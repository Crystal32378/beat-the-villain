'use client'

import { useEffect, useState } from 'react'
import {
  ENTITLEMENT_ID,
  OfferingInfo,
  checkPremiumEntitlement,
  getStoredApiKey,
  initRevenueCat,
  loadLifetimePack,
  purchaseLifetimePack,
  resetLocalTestState,
  storeApiKey,
} from '@/lib/revenuecat'

interface Props {
  open: boolean
  onClose: () => void
  onEntitlementChanged: (active: boolean) => void
}

type Phase = 'key' | 'loading' | 'ready' | 'purchasing' | 'result' | 'checking'
type Result = { kind: 'success' | 'cancel' | 'fail'; message: string }

export default function RevenueCatTestPaywall({ open, onClose, onEntitlementChanged }: Props) {
  const [phase, setPhase] = useState<Phase>('key')
  const [keyInput, setKeyInput] = useState('')
  const [offering, setOffering] = useState<OfferingInfo | null>(null)
  const [entitled, setEntitled] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const stored = getStoredApiKey()
    if (stored) void bootstrap(stored)
  }, [open])

  async function bootstrap(key: string) {
    setPhase('loading')
    setError('')
    if (!(await initRevenueCat(key))) {
      setError('初始化失敗：請確認使用 test_ 開頭的 Test Store API key。')
      setPhase('key')
      return
    }
    const active = await checkPremiumEntitlement()
    setEntitled(active)
    onEntitlementChanged(active)
    const product = await loadLifetimePack()
    if (!product) {
      setError('Offering 載入失敗：請確認 Default Offering、$rc_lifetime 與 lifetime 商品關聯。')
      setPhase('key')
      return
    }
    setOffering(product)
    setPhase('ready')
  }

  function saveKey() {
    const key = keyInput.trim()
    if (!key.startsWith('test_')) {
      setError('請輸入 test_ 開頭的 RevenueCat Test Store API key。')
      return
    }
    storeApiKey(key)
    setKeyInput('')
    void bootstrap(key)
  }

  async function purchase() {
    setPhase('purchasing')
    const outcome = await purchaseLifetimePack()
    setResult({ kind: outcome.status, message: outcome.message })
    const active = outcome.status === 'success' ? await checkPremiumEntitlement() : false
    if (outcome.status === 'success') {
      setEntitled(active)
      onEntitlementChanged(active)
    }
    setPhase('result')
  }

  async function recheck() {
    setPhase('checking')
    const active = await checkPremiumEntitlement()
    setEntitled(active)
    onEntitlementChanged(active)
    setResult({
      kind: active ? 'success' : 'fail',
      message: active ? `${ENTITLEMENT_ID} 目前為 active。` : `${ENTITLEMENT_ID} 目前不是 active。`,
    })
    setPhase('result')
  }

  function clearTestState() {
    resetLocalTestState()
    setOffering(null)
    setEntitled(false)
    setResult(null)
    setError('')
    setPhase('key')
    onEntitlementChanged(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#d4a017] bg-gradient-to-b from-[#2a1010] to-[#120606] p-6 shadow-2xl max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onClose} aria-label="關閉" className="absolute right-3 top-3 text-[#b8a08a] hover:text-white">✕</button>
        <div className="mb-2 text-center text-5xl">🧿</div>
        <h2 className="text-center text-2xl font-black tracking-wider text-[#d4a017]">打小人永久收藏章</h2>
        <p className="mb-4 text-center text-xs text-[#b8a08a]">RevenueCat Test Store 驗證入口</p>

        {phase === 'key' && (
          <div>
            <p className="mb-3 text-xs leading-relaxed text-[#b8a08a]">
              Test Store key 只存在這個瀏覽器的 localStorage，不會寫入 GitHub 或 log。
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && saveKey()}
              placeholder="test_xxxxxxxxxxxxxxxx"
              autoComplete="off"
              className="w-full rounded-lg border border-[rgba(212,160,23,0.35)] bg-black/30 px-3 py-2 text-[#f5e6d0] outline-none focus:border-[#d4a017]"
            />
            {error && <p className="mt-2 text-xs text-[#ff6b6b]">{error}</p>}
            <button onClick={saveKey} className="mt-3 w-full rounded-lg bg-gradient-to-b from-[#d4a017] to-[#8b6914] py-2.5 font-bold text-[#1a0808]">
              儲存並載入測試商品
            </button>
          </div>
        )}

        {['loading', 'purchasing', 'checking'].includes(phase) && (
          <div className="py-8 text-center text-sm text-[#b8a08a]">
            <div className="mb-2 animate-pulse text-3xl">🪔</div>
            {phase === 'loading' && '正在載入 RevenueCat Offering…'}
            {phase === 'purchasing' && '請在 Test Store 視窗選擇成功、取消或失敗…'}
            {phase === 'checking' && '正在重新確認 entitlement…'}
          </div>
        )}

        {phase === 'ready' && offering && (
          <div>
            <div className="mb-3 rounded-lg border border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.08)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-[#f5e6d0]">{offering.title}</div>
                  <div className="mt-1 text-xs text-[#b8a08a]">{offering.description || offering.productId}</div>
                </div>
                <div className="text-xl font-black text-[#d4a017]">{offering.formattedPrice}</div>
              </div>
              <div className="mt-2 border-t border-white/10 pt-2 text-[10px] text-[#7a6557]">
                {offering.productId} · {offering.packageId} · {offering.currency}
              </div>
            </div>
            {entitled && <p className="mb-3 text-center text-sm font-bold text-[#66d17a]">✅ {ENTITLEMENT_ID} 已 active</p>}
            <button
              onClick={purchase}
              disabled={entitled}
              className="w-full rounded-lg bg-gradient-to-b from-[#d4a017] to-[#8b6914] py-3 font-black text-[#1a0808] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {entitled ? '✅ 已擁有 · 無需重複購買' : `測試供奉 ${offering.formattedPrice}`}
            </button>
            <div className="mt-3 flex gap-2">
              <button onClick={recheck} className="flex-1 rounded-lg border border-white/15 py-2 text-xs text-[#b8a08a]">重新確認權益</button>
              <button onClick={clearTestState} className="flex-1 rounded-lg border border-white/15 py-2 text-xs text-[#b8a08a]">清除本機測試</button>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div>
            <div className={`mb-3 rounded-lg border p-4 text-sm ${result.kind === 'success' ? 'border-green-700 text-green-300' : result.kind === 'cancel' ? 'border-yellow-700 text-yellow-300' : 'border-red-800 text-red-300'}`}>
              <strong>{result.kind === 'success' ? '✅ 成功' : result.kind === 'cancel' ? '🚫 已取消' : '❌ 失敗'}</strong>
              <p className="mt-1 text-xs text-[#b8a08a]">{result.message}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPhase(offering ? 'ready' : 'key')} className="flex-1 rounded-lg bg-[#d4a017] py-2 font-bold text-[#1a0808]">
                {result.kind === 'success' ? '完成' : '再試一次'}
              </button>
              <button onClick={onClose} className="flex-1 rounded-lg border border-white/15 py-2 text-[#b8a08a]">關閉</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
