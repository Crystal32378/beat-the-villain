'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* =========================================================================
   資料常量
   ========================================================================= */

// 預設小人清單
const PRESET_VILLAINS: { label: string; emoji: string }[] = [
  { label: '慣老闆', emoji: '💼' },
  { label: '機車主管', emoji: '👔' },
  { label: '愛推事同事', emoji: '🗂️' },
  { label: '渣男', emoji: '💔' },
  { label: '渣女', emoji: '💔' },
  { label: '前任', emoji: '👻' },
  { label: '三姑六婆', emoji: '👵' },
  { label: '假面朋友', emoji: '🎭' },
  { label: '奧客', emoji: '💸' },
  { label: '惡鄰居', emoji: '🏠' },
  { label: '鍵盤俠', emoji: '📱' },
  { label: '暴怒駕駛', emoji: '🚗' },
]

// 武器系統
type WeaponId = 'slipper' | 'needle' | 'whip' | 'sword'
const WEAPONS: {
  id: WeaponId
  name: string
  icon: string
  damage: number
  color: string
  desc: string
  animClass: string
}[] = [
  { id: 'slipper', name: '塑膠拖鞋', icon: '🩴', damage: 1, color: '#d4a017', desc: '入門款，平凡無奇但順手好握', animClass: 'animate-slipper-slam' },
  { id: 'needle', name: '五吋長針', icon: '📍', damage: 2, color: '#c41e3a', desc: '針針見血，專破小人骨血', animClass: 'animate-needle-stab' },
  { id: 'whip', name: '九節鞭', icon: '⛓️', damage: 3, color: '#ffd700', desc: '啪啪作響，連綿不絕', animClass: 'animate-whip-lash' },
  { id: 'sword', name: '桃木劍', icon: '🗡️', damage: 5, color: '#ff6b35', desc: '道法正氣，一擊破煞', animClass: 'animate-sword-strike' },
]

// 咒語庫（按部位分類）
const CURSES: Record<string, string[]> = {
  頭: [
    '打你小人頭，讓你惡有惡報',
    '打你小人頭，頭暈腦脹沒好運',
    '打你小人頭，煩惱通通落到你頭',
    '打你小人頭，作惡多端終有報',
  ],
  手: [
    '打你小人手，伸手必被斷',
    '打你小人手，做什麼都失手',
    '打你小人手，搶東西搶不到',
    '打你小人手，黑手落到你身上',
  ],
  腳: [
    '打你小人腳，走路跌進坑',
    '打你小人腳，舉步維艱沒人扶',
    '打你小人腳，走衰運走到腳軟',
    '打你小人腳，遠走近走樣樣衰',
  ],
  口: [
    '打你小人口，是非出口禍自招',
    '打你小人口，說謊話爛嘴巴',
    '打你小人口，口舌招尤惹是非',
    '打你小人口，惡毒話語迴向你',
  ],
  心: [
    '打你小人心，黑心毒計反噬身',
    '打你小人心，心術不正必遭懲',
    '打你小人心，惡念反噬痛入心',
    '打你小人心，陰謀詭計皆成空',
  ],
  收尾: [
    '小人遠離我，貴人近身來',
    '晦氣盡消除，好運跟著走',
    '百煞皆退散，福祿自然來',
    '一打小人，二迎貴人，三聚財氣',
  ],
}

const ALL_CURSES = Object.values(CURSES).flat()

// 紙人受擊階段（外觀變化）
const PAPER_STAGES = [
  { hits: 0, label: '完好', tint: '#f5e6d0', desc: '囂張氣焰' },
  { hits: 5, label: '受損', tint: '#e8d5b7', desc: '開始收斂' },
  { hits: 15, label: '重傷', tint: '#d4b896', desc: '搖搖欲墜' },
  { hits: 30, label: '殘破', tint: '#b89976', desc: '垂死掙扎' },
  { hits: 50, label: '潰散', tint: '#8a6f56', desc: '魂飛魄散' },
]

// 怒氣條上限
const RAGE_MAX = 100
// 蓋印觸發次數
const STAMP_THRESHOLD = 30

/* =========================================================================
   型別
   ========================================================================= */

interface BloodDrop {
  id: number
  x: number
  y: number
  bx: number
  by: number
  color: string
}
interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  type: 'curse' | 'damage' | 'curse-big'
  color: string
  size: number
}
interface WeaponFx {
  id: number
  x: number
  y: number
  weapon: WeaponId
}
interface VillainRecord {
  name: string
  hits: number
  lastBeaten: number
}
interface Stats {
  totalHits: number
  todayHits: number
  todayDate: string
  villainsBeaten: number
  villainRanking: Record<string, number>
}

/* =========================================================================
   工具函式
   ========================================================================= */

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const defaultStats: Stats = {
  totalHits: 0,
  todayHits: 0,
  todayDate: todayStr(),
  villainsBeaten: 0,
  villainRanking: {},
}

const loadStats = (): Stats => {
  if (typeof window === 'undefined') return defaultStats
  try {
    const raw = localStorage.getItem('da-xiao-ren-stats')
    if (!raw) return defaultStats
    const parsed = JSON.parse(raw) as Stats
    // 跨日重置
    if (parsed.todayDate !== todayStr()) {
      parsed.todayHits = 0
      parsed.todayDate = todayStr()
    }
    return parsed
  } catch {
    return defaultStats
  }
}

const saveStats = (s: Stats) => {
  try {
    localStorage.setItem('da-xiao-ren-stats', JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/* =========================================================================
   音效引擎（Web Audio API 合成，無需音檔）
   ========================================================================= */

class BeatSoundEngine {
  private ctx: AudioContext | null = null
  private enabled = true

  setEnabled(v: boolean) {
    this.enabled = v
  }

  private ensureCtx() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {
        return null
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // 拖鞋拍打：低頻 thump + 高頻 smack
  playSlipper() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    // thump
    const o1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    o1.type = 'sine'
    o1.frequency.setValueAtTime(180, t)
    o1.frequency.exponentialRampToValueAtTime(60, t + 0.12)
    g1.gain.setValueAtTime(0.5, t)
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    o1.connect(g1).connect(ctx.destination)
    o1.start(t)
    o1.stop(t + 0.2)
    // smack (noise)
    this.playNoiseBurst(0.08, 0.3, 2000)
  }

  // 針扎：尖銳高頻
  playNeedle() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(2400, t)
    o.frequency.exponentialRampToValueAtTime(1800, t + 0.06)
    g.gain.setValueAtTime(0.18, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.12)
  }

  // 鞭子甩：啪一聲 + 殘響
  playWhip() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(900, t)
    o.frequency.exponentialRampToValueAtTime(120, t + 0.08)
    g.gain.setValueAtTime(0.35, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.18)
    this.playNoiseBurst(0.06, 0.25, 3500)
  }

  // 桃木劍：低沉金屬斬擊
  playSword() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    // 鋼鐵擊
    const o1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    o1.type = 'triangle'
    o1.frequency.setValueAtTime(420, t)
    o1.frequency.exponentialRampToValueAtTime(80, t + 0.25)
    g1.gain.setValueAtTime(0.5, t)
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    o1.connect(g1).connect(ctx.destination)
    o1.start(t)
    o1.stop(t + 0.4)
    // 殘響鈴聲
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'sine'
    o2.frequency.setValueAtTime(1200, t + 0.05)
    g2.gain.setValueAtTime(0.12, t + 0.05)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    o2.connect(g2).connect(ctx.destination)
    o2.start(t + 0.05)
    o2.stop(t + 0.55)
  }

  // 怒氣爆發
  playRageBurst() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(60, t)
    o.frequency.exponentialRampToValueAtTime(400, t + 0.4)
    g.gain.setValueAtTime(0.4, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.65)
    this.playNoiseBurst(0.4, 0.3, 800)
  }

  // 蓋印聲
  playStamp() {
    if (!this.enabled) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(40, t + 0.2)
    g.gain.setValueAtTime(0.6, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + 0.32)
  }

  private playNoiseBurst(dur: number, gain: number, freq: number) {
    const ctx = this.ctx
    if (!ctx) return
    const t = ctx.currentTime
    const bufferSize = Math.floor(ctx.sampleRate * dur)
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(filter).connect(g).connect(ctx.destination)
    src.start(t)
    src.stop(t + dur)
  }
}

/* =========================================================================
   紙人 SVG 元件
   ========================================================================= */

function PaperFigure({
  name,
  stage,
  shaking,
}: {
  name: string
  stage: number
  shaking: boolean
}) {
  const stageInfo = PAPER_STAGES[stage]
  const tint = stageInfo.tint
  // 受擊程度影響裂痕數量
  const cracks = stage * 2

  return (
    <div
      className={`relative no-select ${shaking ? 'animate-paper-shake' : ''}`}
      style={{ width: '180px', height: '260px' }}
    >
      <svg
        viewBox="0 0 180 260"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}
      >
        {/* 紙張底色（殘破撕裂邊緣） */}
        <path
          d="M 30 20 L 50 12 L 70 18 L 90 10 L 110 16 L 130 12 L 150 22 L 156 50 L 162 90 L 158 140 L 162 200 L 156 240 L 140 250 L 120 244 L 100 250 L 80 246 L 60 250 L 40 244 L 24 234 L 22 180 L 18 120 L 22 70 L 26 40 Z"
          fill={tint}
          stroke="#8a6f56"
          strokeWidth="1.2"
          opacity="0.95"
        />

        {/* 紙紋 */}
        <g opacity="0.18" stroke="#8a6f56" strokeWidth="0.4" fill="none">
          <line x1="30" y1="50" x2="150" y2="48" />
          <line x1="28" y1="90" x2="152" y2="92" />
          <line x1="26" y1="130" x2="154" y2="128" />
          <line x1="28" y1="170" x2="152" y2="172" />
          <line x1="30" y1="210" x2="150" y2="208" />
        </g>

        {/* 頭部 */}
        <circle
          cx="90"
          cy="60"
          r="22"
          fill={tint}
          stroke="#5c4a3a"
          strokeWidth="1.5"
        />
        {/* 眼睛 - 受擊階段越後越誇張 */}
        {stage === 0 ? (
          <g stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round">
            <line x1="78" y1="55" x2="84" y2="61" />
            <line x1="84" y1="55" x2="78" y2="61" />
            <line x1="96" y1="55" x2="102" y2="61" />
            <line x1="102" y1="55" x2="96" y2="61" />
          </g>
        ) : stage < 3 ? (
          <g stroke="#5c4a3a" strokeWidth="2" strokeLinecap="round">
            <line x1="76" y1="58" x2="86" y2="58" />
            <line x1="94" y1="58" x2="104" y2="58" />
          </g>
        ) : (
          // 漩渦眼
          <g fill="none" stroke="#5c4a3a" strokeWidth="1.8">
            <path d="M 76 58 Q 80 54 84 58 Q 88 62 84 66 Q 80 70 76 66" />
            <path d="M 96 58 Q 100 54 104 58 Q 108 62 104 66 Q 100 70 96 66" />
          </g>
        )}
        {/* 嘴 - 階段越後越痛苦 */}
        {stage < 2 ? (
          <path d="M 82 72 Q 90 76 98 72" stroke="#5c4a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : stage < 4 ? (
          <ellipse cx="90" cy="74" rx="5" ry="4" fill="#5c4a3a" />
        ) : (
          <path d="M 82 74 Q 86 80 90 74 Q 94 80 98 74" stroke="#5c4a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* 身體（穿著的紙衣） */}
        <path
          d="M 60 90 L 120 90 L 128 170 L 52 170 Z"
          fill={stage >= 2 ? '#c41e3a' : '#8b0000'}
          stroke="#3a0808"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* 衣領 */}
        <path d="M 75 90 L 90 105 L 105 90" fill="none" stroke="#3a0808" strokeWidth="1.2" />

        {/* 名牌 */}
        <rect
          x="62"
          y="115"
          width="56"
          height="22"
          fill="#f5e6d0"
          stroke="#5c4a3a"
          strokeWidth="0.8"
          rx="2"
        />
        <text
          x="90"
          y="130"
          textAnchor="middle"
          fontSize="11"
          fontFamily="var(--font-noto-serif-tc), serif"
          fontWeight="700"
          fill="#1a0808"
        >
          {name.slice(0, 5)}
        </text>

        {/* 雙手 */}
        <path d="M 52 100 L 38 150 L 42 158 L 56 110 Z" fill={tint} stroke="#5c4a3a" strokeWidth="1" />
        <path d="M 128 100 L 142 150 L 138 158 L 124 110 Z" fill={tint} stroke="#5c4a3a" strokeWidth="1" />

        {/* 雙腿 */}
        <path d="M 70 170 L 66 235 L 78 240 L 82 175 Z" fill={tint} stroke="#5c4a3a" strokeWidth="1" />
        <path d="M 110 170 L 114 235 L 102 240 L 98 175 Z" fill={tint} stroke="#5c4a3a" strokeWidth="1" />

        {/* 裂痕（受擊階段越高越多） */}
        {Array.from({ length: cracks }).map((_, i) => {
          const angle = (i * 47) % 360
          const rad = (angle * Math.PI) / 180
          const cx = 90 + Math.cos(rad) * 50
          const cy = 130 + Math.sin(rad) * 80
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} l ${Math.cos(rad + 0.5) * 18} ${Math.sin(rad + 0.5) * 18} l ${Math.cos(rad - 0.3) * 8} ${Math.sin(rad - 0.3) * 8}`}
              stroke="#3a0808"
              strokeWidth="0.8"
              fill="none"
              opacity="0.7"
            />
          )
        })}

        {/* 血跡（階段 2+） */}
        {stage >= 2 && (
          <>
            <circle cx="75" cy="140" r="4" fill="#8b0000" opacity="0.7" />
            <circle cx="110" cy="120" r="3" fill="#8b0000" opacity="0.6" />
            <path d="M 88 95 L 86 110 L 92 108" stroke="#8b0000" strokeWidth="1.5" fill="none" opacity="0.6" />
          </>
        )}
        {stage >= 3 && (
          <>
            <circle cx="55" cy="160" r="5" fill="#8b0000" opacity="0.8" />
            <circle cx="130" cy="180" r="4" fill="#8b0000" opacity="0.7" />
            <path d="M 90 200 L 92 220" stroke="#8b0000" strokeWidth="2" opacity="0.7" />
          </>
        )}
        {stage >= 4 && (
          <>
            {/* 大裂痕，紙人快要撕裂 */}
            <path
              d="M 90 20 L 88 80 L 92 130 L 88 200 L 92 245"
              stroke="#3a0808"
              strokeWidth="1.8"
              fill="none"
              opacity="0.9"
              strokeDasharray="3 2"
            />
          </>
        )}
      </svg>
    </div>
  )
}

/* =========================================================================
   燭火元件
   ========================================================================= */

function Candle({ side }: { side: 'left' | 'right' }) {
  return (
    <div className="flex flex-col items-center" style={{ width: '60px' }}>
      {/* 火光暈 */}
      <div
        className="animate-candle-glow rounded-full"
        style={{
          width: '70px',
          height: '70px',
          background: 'radial-gradient(circle, rgba(255,180,60,0.55) 0%, rgba(196,30,58,0.25) 50%, transparent 80%)',
          marginTop: '-10px',
        }}
      />
      {/* 火焰 */}
      <div className="relative -mt-12" style={{ width: '14px', height: '32px' }}>
        <div
          className="animate-candle-flicker absolute inset-0"
          style={{
            background: 'linear-gradient(to top, #ff6b35 0%, #ffd700 60%, #fff8dc 100%)',
            borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
            boxShadow: '0 0 16px rgba(255,180,60,0.8), 0 0 30px rgba(196,30,58,0.4)',
          }}
        />
      </div>
      {/* 燭芯 */}
      <div className="w-0.5 h-1 bg-black opacity-70" />
      {/* 燭身 */}
      <div
        className="rounded-t-sm"
        style={{
          width: '14px',
          height: '70px',
          background: 'linear-gradient(to bottom, #f5e6d0 0%, #d4b896 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
      />
      {/* 燭台 */}
      <div
        className="rounded-sm"
        style={{
          width: '36px',
          height: '8px',
          background: 'linear-gradient(to bottom, #d4a017 0%, #8b6914 100%)',
          marginTop: '-2px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
        }}
      />
      <div
        className="rounded-b"
        style={{
          width: '24px',
          height: '6px',
          background: 'linear-gradient(to bottom, #8b6914 0%, #5c4a10 100%)',
        }}
      />
      <span className="sr-only">{side} candle</span>
    </div>
  )
}

/* =========================================================================
   煙霧粒子
   ========================================================================= */

function SmokeColumn({ offset = 0 }: { offset?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        delay: i * 0.8 + offset,
        x: (Math.random() - 0.5) * 40,
        left: 40 + Math.random() * 20,
        size: 30 + Math.random() * 30,
      })),
    [offset]
  )
  return (
    <div className="absolute pointer-events-none" style={{ top: '20%', left: 0, right: 0, height: '180px' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="animate-smoke absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, rgba(245,230,208,0.45) 0%, transparent 70%)',
            ['--smoke-x' as any]: `${p.x}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* =========================================================================
   主頁面
   ========================================================================= */

export default function Home() {
  // 小人名稱
  const [villainName, setVillainName] = useState('小人')
  const [committedName, setCommittedName] = useState('小人')
  const [inputValue, setInputValue] = useState('')

  // 武器
  const [weapon, setWeapon] = useState<WeaponId>('slipper')
  const weaponInfo = WEAPONS.find((w) => w.id === weapon)!

  // 擊中狀態（hits 現為「累積傷害值」，武器傷害真正影響階段）
  const [hits, setHits] = useState(0)
  const [rage, setRage] = useState(0)
  const [shaking, setShaking] = useState(false)
  const [bloodDrops, setBloodDrops] = useState<BloodDrop[]>([])
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [weaponFx, setWeaponFx] = useState<WeaponFx[]>([])
  const [stamped, setStamped] = useState(false)
  const [stampAnim, setStampAnim] = useState(false)
  const [blessingOpen, setBlessingOpen] = useState(false)

  // 統計
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [soundOn, setSoundOn] = useState(true)

  // refs（避免連擊 stale state）
  const soundRef = useRef<BeatSoundEngine | null>(null)
  const altarRef = useRef<HTMLDivElement | null>(null)
  const idCounter = useRef(0)
  const blessingTriggeredRef = useRef(false)
  const hitsRef = useRef(0)        // 同步追蹤累積傷害
  const stampedRef = useRef(false) // 同步追蹤蓋印狀態
  const committedNameRef = useRef('小人')
  const weaponRef = useRef<WeaponId>('slipper')
  const rageRef = useRef(0)        // 同步追蹤怒氣值
  const rageBurstingRef = useRef(false) // 怒氣爆發進行中標記
  const burstTimersRef = useRef<Set<number>>(new Set()) // 爆發期間所有 timers，供 reset/換小人/卸載時取消

  // 取消所有爆發 timers（供 reset/換小人/卸載呼叫；提前宣告供 commitVillain/handleReset 使用）
  const cancelAllBurstTimers = useCallback(() => {
    burstTimersRef.current.forEach((id) => window.clearTimeout(id))
    burstTimersRef.current.clear()
    rageBurstingRef.current = false
  }, [])

  // 初始化音效引擎
  useEffect(() => {
    soundRef.current = new BeatSoundEngine()
  }, [])

  // 卸載時取消所有爆發 timers，避免攻擊落到已卸載的元件
  useEffect(() => {
    return () => {
      burstTimersRef.current.forEach((id) => window.clearTimeout(id))
      burstTimersRef.current.clear()
    }
  }, [])

  // 從 localStorage 載入統計（僅在客戶端，且延後一幀以避開 SSR 水合不一致）
  useEffect(() => {
    const loaded = loadStats()
    // 用 setStats 的函式式更新，避免與當前值無謂重渲染
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats((prev) => {
      if (
        prev.totalHits === loaded.totalHits &&
        prev.todayHits === loaded.todayHits &&
        prev.villainsBeaten === loaded.villainsBeaten &&
        Object.keys(prev.villainRanking).length === Object.keys(loaded.villainRanking).length
      ) {
        return prev
      }
      return loaded
    })
  }, [])

  useEffect(() => {
    soundRef.current?.setEnabled(soundOn)
  }, [soundOn])

  // 計算紙人階段（依累積傷害）
  const stage = useMemo(() => {
    let s = 0
    for (let i = 0; i < PAPER_STAGES.length; i++) {
      if (hits >= PAPER_STAGES[i].hits) s = i
    }
    return s
  }, [hits])

  // 提交小人名稱（換小人時取消爆發 timers，避免剩餘攻擊落到新目標）
  const commitVillain = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      cancelAllBurstTimers()
      setVillainName(trimmed)
      setCommittedName(trimmed)
      committedNameRef.current = trimmed
      setHits(0)
      hitsRef.current = 0
      setRage(0)
      rageRef.current = 0
      setStamped(false)
      stampedRef.current = false
      setStampAnim(false)
      blessingTriggeredRef.current = false
      setBloodDrops([])
      setFloatingTexts([])
      setWeaponFx([])
    },
    [cancelAllBurstTimers]
  )

  // 處理擊打（用 refs 避免 stale state，武器傷害真正累積影響階段）
  const handleBeat = useCallback(
    (e?: React.MouseEvent | React.TouchEvent | React.KeyboardEvent, customWeapon?: WeaponId) => {
      const useWeapon = customWeapon ?? weaponRef.current
      const wInfo = WEAPONS.find((w) => w.id === useWeapon)!
      // 累積傷害（非次數），武器傷害直接影響紙人階段
      const prevHits = hitsRef.current
      const newHits = prevHits + wInfo.damage
      hitsRef.current = newHits
      const name = committedNameRef.current

      // 計算點擊位置（在祭壇內的相對座標；鍵盤觸發時用中央）
      let x = 50, y = 50
      if (e && altarRef.current && 'clientX' in e) {
        const rect = altarRef.current.getBoundingClientRect()
        const me = e as React.MouseEvent
        x = ((me.clientX - rect.left) / rect.width) * 100
        y = ((me.clientY - rect.top) / rect.height) * 100
        x = Math.max(10, Math.min(90, x))
        y = Math.max(10, Math.min(90, y))
      } else if (e && altarRef.current && 'touches' in e) {
        const rect = altarRef.current.getBoundingClientRect()
        const te = e as React.TouchEvent
        const touch = te.touches[0] ?? te.changedTouches[0]
        if (touch) {
          x = ((touch.clientX - rect.left) / rect.width) * 100
          y = ((touch.clientY - rect.top) / rect.height) * 100
          x = Math.max(10, Math.min(90, x))
          y = Math.max(10, Math.min(90, y))
        }
      }

      // 音效
      if (soundRef.current) {
        if (useWeapon === 'slipper') soundRef.current.playSlipper()
        else if (useWeapon === 'needle') soundRef.current.playNeedle()
        else if (useWeapon === 'whip') soundRef.current.playWhip()
        else if (useWeapon === 'sword') soundRef.current.playSword()
      }

      // 顫抖
      setShaking(true)
      window.setTimeout(() => setShaking(false), 500)

      // 武器特效
      const fxId = ++idCounter.current
      setWeaponFx((prev) => [...prev, { id: fxId, x, y, weapon: useWeapon }])
      window.setTimeout(() => {
        setWeaponFx((prev) => prev.filter((f) => f.id !== fxId))
      }, 600)

      // 血花
      const bloodCount = useWeapon === 'sword' ? 6 : useWeapon === 'whip' ? 5 : 3
      const newBloods: BloodDrop[] = []
      for (let i = 0; i < bloodCount; i++) {
        const id = ++idCounter.current
        const angle = Math.random() * Math.PI * 2
        const dist = 30 + Math.random() * 50
        newBloods.push({
          id,
          x,
          y,
          bx: Math.cos(angle) * dist,
          by: Math.sin(angle) * dist,
          color: Math.random() > 0.5 ? '#8b0000' : '#c41e3a',
        })
      }
      setBloodDrops((prev) => [...prev, ...newBloods])
      window.setTimeout(() => {
        setBloodDrops((prev) => prev.filter((b) => !newBloods.some((nb) => nb.id === b.id)))
      }, 800)

      // 傷害數字
      const dmgId = ++idCounter.current
      const dmgText = `-${wInfo.damage}`
      setFloatingTexts((prev) => [
        ...prev,
        {
          id: dmgId,
          x: x + (Math.random() - 0.5) * 10,
          y: y - 5,
          text: dmgText,
          type: 'damage',
          color: wInfo.color,
          size: wInfo.damage >= 3 ? 28 : 22,
        },
      ])
      window.setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== dmgId))
      }, 900)

      // 咒語（32% 機率出現，避免太擠）
      if (Math.random() < 0.32) {
        const curseId = ++idCounter.current
        const categories = ['頭', '手', '腳', '口', '心']
        const cat = pickRandom(categories)
        const curse = pickRandom(CURSES[cat])
        setFloatingTexts((prev) => [
          ...prev,
          {
            id: curseId,
            x: x + (Math.random() - 0.5) * 20,
            y: y - 20,
            text: curse,
            type: 'curse',
            color: '#ffd700',
            size: 14,
          },
        ])
        window.setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== curseId))
        }, 2400)
      }

      // 更新累積傷害（functional update，避免連擊 stale state）
      setHits(newHits)

      // 怒氣條（爆發期間停止累積；累積到滿就保持滿，等使用者按按鈕才爆發歸零）
      if (!rageBurstingRef.current) {
        const rageGain = wInfo.damage * 5 + Math.floor(Math.random() * 3)
        const newRage = Math.min(RAGE_MAX, rageRef.current + rageGain)
        rageRef.current = newRage
        setRage(newRage)
      }

      // 達到蓋印門檻（用 ref 避免重複觸發）
      if (newHits >= STAMP_THRESHOLD && !stampedRef.current) {
        stampedRef.current = true
        setStamped(true)
        setStampAnim(true)
        if (soundRef.current) soundRef.current.playStamp()
        window.setTimeout(() => setStampAnim(false), 1000)
      }

      // 達到潰散階段觸發驚蟄儀式（只觸發一次）
      if (newHits >= 50 && !blessingTriggeredRef.current) {
        blessingTriggeredRef.current = true
        window.setTimeout(() => setBlessingOpen(true), 1200)
      }

      // 更新統計（每次擊打 +1 下；跨過蓋印門檻那次 villainsBeaten +1）
      const crossedStamp = prevHits < STAMP_THRESHOLD && newHits >= STAMP_THRESHOLD
      setStats((prev) => {
        const next: Stats = {
          ...prev,
          totalHits: prev.totalHits + 1,
          todayHits: prev.todayHits + 1,
          todayDate: todayStr(),
          villainsBeaten: crossedStamp ? prev.villainsBeaten + 1 : prev.villainsBeaten,
          villainRanking: {
            ...prev.villainRanking,
            [name]: (prev.villainRanking[name] || 0) + 1,
          },
        }
        saveStats(next)
        return next
      })
    },
    []
  )

  // 怒氣爆發（手動觸發：滿 100 後按鈕可按，真正五連擊，再歸零）
  // 副作用全部在 updater 外執行，不在 setRage 的 updater 內觸發
  // 所有 timers 存入 burstTimersRef，供 reset/換小人/卸載時取消
  const handleRageBurst = useCallback(() => {
    // 用 ref 檢查，避免在 state updater 內做判斷
    if (rageRef.current < RAGE_MAX) return
    // 先取消任何殘留的爆發 timers（防重複觸發疊加）
    cancelAllBurstTimers()
    // 標記爆發中，期間停止怒氣累積
    rageBurstingRef.current = true

    // 輔助：建立受追蹤的 timer
    const trackedTimeout = (fn: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        burstTimersRef.current.delete(id)
        fn()
      }, delay)
      burstTimersRef.current.add(id)
      return id
    }

    // 音效 + 視覺
    if (soundRef.current) soundRef.current.playRageBurst()
    setFloatingTexts((prev) => [
      ...prev,
      {
        id: ++idCounter.current,
        x: 50,
        y: 30,
        text: '怒氣爆發！百煞退散！',
        type: 'curse-big',
        color: '#ff6b35',
        size: 22,
      },
    ])
    // 多重咒語齊發
    for (let i = 0; i < 5; i++) {
      const cid = ++idCounter.current
      const c = pickRandom(ALL_CURSES)
      trackedTimeout(() => {
        setFloatingTexts((prev) => [
          ...prev,
          {
            id: cid,
            x: 20 + Math.random() * 60,
            y: 40 + Math.random() * 30,
            text: c,
            type: 'curse',
            color: '#ffd700',
            size: 14,
          },
        ])
        const cleanupId = window.setTimeout(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== cid))
        }, 2400)
        burstTimersRef.current.add(cleanupId)
      }, i * 150)
    }
    // 真正五連擊（用桃木劍，每擊 -5 傷害，間隔 120ms）
    for (let i = 0; i < 5; i++) {
      trackedTimeout(() => {
        handleBeat(undefined, 'sword')
      }, i * 120)
    }
    // 五連擊結束後解除爆發標記
    trackedTimeout(() => {
      rageBurstingRef.current = false
    }, 5 * 120 + 100)
    // 歸零怒氣
    rageRef.current = 0
    setRage(0)
  }, [handleBeat, cancelAllBurstTimers])



  // 重置當前小人（同步 refs + 取消爆發 timers）
  const handleReset = useCallback(() => {
    cancelAllBurstTimers()
    setHits(0)
    hitsRef.current = 0
    setRage(0)
    rageRef.current = 0
    rageBurstingRef.current = false
    setStamped(false)
    stampedRef.current = false
    setStampAnim(false)
    blessingTriggeredRef.current = false
    setBloodDrops([])
    setFloatingTexts([])
    setWeaponFx([])
  }, [cancelAllBurstTimers])

  // 切換武器（同步 ref）
  const handleSelectWeapon = useCallback((id: WeaponId) => {
    weaponRef.current = id
    setWeapon(id)
  }, [])

  // 排行榜
  const ranking = useMemo(() => {
    return Object.entries(stats.villainRanking)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [stats])

  const stageInfo = PAPER_STAGES[stage]

  return (
    <main className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* 背景氛圍光 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(196,30,58,0.18) 0%, transparent 55%), radial-gradient(ellipse at 20% 90%, rgba(212,160,23,0.07) 0%, transparent 40%), radial-gradient(ellipse at 80% 90%, rgba(212,160,23,0.07) 0%, transparent 40%)',
        }}
      />
      {/* 噪點紋理 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          opacity: 0.035,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* ====== 標題 ====== */}
        <header className="text-center mb-5 animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[#c41e3a]" style={{ textShadow: '0 0 8px rgba(196,30,58,0.6)' }}>◆</span>
            <span className="text-xs tracking-[0.3em] text-[#b8a08a]">驚蟄時節 · 線上祭壇</span>
            <span className="text-[#c41e3a]" style={{ textShadow: '0 0 8px rgba(196,30,58,0.6)' }}>◆</span>
          </div>
          <h1
            className="animate-title-shine text-3xl sm:text-4xl font-black tracking-[0.1em] text-[#d4a017]"
          >
            線上打小人出氣筒
          </h1>
          <p className="mt-2 text-sm text-[#b8a08a]">
            拖鞋一拍，晦氣消散 · 一邊打一邊唸咒，讓你心頭之火化作青煙
          </p>
        </header>

        {/* ====== 小人選擇區 ====== */}
        <section className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitVillain(inputValue)
                  setInputValue('')
                }
              }}
              placeholder={`輸入要打的小人名（當前：${committedName}）`}
              maxLength={12}
              className="flex-1 bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg px-4 py-2.5 text-[#f5e6d0] placeholder-[#b8a08a] focus:outline-none focus:border-[#d4a017] focus:ring-1 focus:ring-[#d4a017] transition"
            />
            <button
              onClick={() => {
                commitVillain(inputValue)
                setInputValue('')
              }}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#d4a017] to-[#8b6914] text-[#1a0808] font-bold hover:brightness-110 active:scale-95 transition shadow-lg"
            >
              立小人
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_VILLAINS.map((v) => (
              <button
                key={v.label}
                onClick={() => commitVillain(v.label)}
                className={`px-3 py-1.5 rounded-full text-xs border transition active:scale-95 ${
                  committedName === v.label
                    ? 'bg-[#c41e3a] border-[#ffd700] text-[#f5e6d0] shadow-md'
                    : 'bg-[rgba(139,0,0,0.25)] border-[rgba(212,160,23,0.25)] text-[#b8a08a] hover:border-[#d4a017] hover:text-[#f5e6d0]'
                }`}
              >
                <span className="mr-1">{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
        </section>

        {/* ====== 祭壇主區（支援滑鼠、觸控、Enter/Space 鍵操作）====== */}
        <section
          ref={altarRef}
          role="button"
          tabIndex={0}
          aria-label="打小人祭壇，按 Enter 或 Space 出手，或點擊任意位置出手"
          className="relative noise-overlay paper-texture rounded-2xl border border-[rgba(212,160,23,0.3)] overflow-hidden mb-4 select-none focus:outline-none focus:ring-2 focus:ring-[#d4a017] focus:ring-offset-2 focus:ring-offset-[#1a0808]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(58,8,8,0.85) 0%, rgba(26,8,8,0.95) 50%, rgba(58,8,8,0.7) 100%)',
            minHeight: '380px',
            cursor: 'pointer',
          }}
          onClick={(e) => handleBeat(e)}
          onTouchEnd={(e) => {
            e.preventDefault()
            handleBeat(e)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleBeat(e)
            }
          }}
        >
          {/* 祭壇金光暈 */}
          <div
            className="animate-aura absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 35%, rgba(212,160,23,0.18) 0%, transparent 60%)',
            }}
          />

          {/* 煙霧 */}
          <SmokeColumn offset={0} />

          {/* 左右燭火 */}
          <div className="absolute left-3 bottom-6 z-20">
            <Candle side="left" />
          </div>
          <div className="absolute right-3 bottom-6 z-20">
            <Candle side="right" />
          </div>

          {/* 祭壇底座（磚橋） */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12 z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgba(90,40,20,0.7) 0%, rgba(50,20,10,0.95) 100%)',
              borderTop: '2px solid rgba(212,160,23,0.4)',
              boxShadow: 'inset 0 1px 0 rgba(212,160,23,0.2)',
            }}
          >
            {/* 磚塊紋路 */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-[rgba(212,160,23,0.15)]"
                  style={{ borderRightWidth: i < 7 ? '1px' : '0' }}
                />
              ))}
            </div>
          </div>

          {/* 中央：紙人 */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pb-12">
            <div className="relative">
              <PaperFigure name={committedName} stage={stage} shaking={shaking} />

              {/* 蓋印「已打」 */}
              {stamped && (
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 ${stampAnim ? 'animate-stamp' : ''}`}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '8px',
                    border: '3px solid #c41e3a',
                    background: 'rgba(196,30,58,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: stampAnim ? undefined : 'translate(-50%, -50%) rotate(-12deg)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="text-center">
                    <div className="text-[#f5e6d0] font-black text-2xl leading-none">已打</div>
                    <div className="text-[#f5e6d0] text-[9px] mt-1 opacity-90">驚蟄祭壇印</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 血花飛濺 */}
          {bloodDrops.map((b) => (
            <div
              key={b.id}
              className="animate-blood absolute z-20 pointer-events-none"
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: b.color,
                ['--bx' as any]: `${b.bx}px`,
                ['--by' as any]: `${b.by}px`,
                boxShadow: `0 0 6px ${b.color}`,
              }}
            />
          ))}

          {/* 武器特效 */}
          {weaponFx.map((fx) => {
            const w = WEAPONS.find((x) => x.id === fx.weapon)!
            return (
              <div
                key={fx.id}
                className={`absolute z-30 pointer-events-none ${w.animClass}`}
                style={{
                  left: `${fx.x}%`,
                  top: `${fx.y}%`,
                  fontSize: fx.weapon === 'sword' ? '64px' : fx.weapon === 'whip' ? '52px' : '44px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))',
                }}
              >
                {w.icon}
              </div>
            )
          })}

          {/* 浮動文字（咒語 + 傷害） */}
          {floatingTexts.map((t) => (
            <div
              key={t.id}
              className={`absolute z-40 pointer-events-none font-bold whitespace-nowrap ${
                t.type === 'damage' ? 'animate-damage' : t.type === 'curse-big' ? 'animate-curse' : 'animate-curse'
              }`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                color: t.color,
                fontSize: `${t.size}px`,
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
                fontFamily: t.type === 'curse' ? 'var(--font-noto-serif-tc), serif' : 'inherit',
                maxWidth: t.type === 'curse' ? '240px' : 'none',
                transform: 'translate(-50%, 0)',
                letterSpacing: t.type === 'curse' ? '0.05em' : '0',
              }}
            >
              {t.text}
            </div>
          ))}

          {/* 左上：擊打計數 */}
          <div className="absolute top-3 left-3 z-30">
            <div className="bg-[rgba(26,8,8,0.7)] border border-[rgba(212,160,23,0.3)] rounded-lg px-3 py-1.5 backdrop-blur-sm">
              <div className="text-[10px] text-[#b8a08a] tracking-wider">累積傷害</div>
              <div className="text-2xl font-black text-[#d4a017] leading-none">{hits}</div>
            </div>
          </div>

          {/* 右上：階段標籤 */}
          <div className="absolute top-3 right-3 z-30">
            <div className="bg-[rgba(26,8,8,0.7)] border border-[rgba(212,160,23,0.3)] rounded-lg px-3 py-1.5 backdrop-blur-sm text-right">
              <div className="text-[10px] text-[#b8a08a] tracking-wider">小人狀態</div>
              <div className="text-sm font-bold text-[#c41e3a] leading-none mt-0.5">{stageInfo.label}</div>
              <div className="text-[10px] text-[#b8a08a] mt-0.5">{stageInfo.desc}</div>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 text-[10px] text-[#b8a08a] opacity-70 pointer-events-none">
            輕點祭壇或按 Enter/Space 即可出手
          </div>
        </section>

        {/* ====== 怒氣條 ====== */}
        <section className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#b8a08a] tracking-wider">怒氣值</span>
            <span className="text-xs font-bold text-[#c41e3a]">{rage} / {RAGE_MAX}</span>
          </div>
          <div className="relative h-4 bg-[rgba(26,8,8,0.6)] border border-[rgba(212,160,23,0.25)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${rage >= RAGE_MAX ? 'animate-rage-pulse' : ''}`}
              style={{
                width: `${(rage / RAGE_MAX) * 100}%`,
                background:
                  rage >= RAGE_MAX
                    ? 'linear-gradient(90deg, #c41e3a 0%, #ff6b35 50%, #ffd700 100%)'
                    : 'linear-gradient(90deg, #8b0000 0%, #c41e3a 100%)',
              }}
            />
          </div>
          <button
            onClick={handleRageBurst}
            disabled={rage < RAGE_MAX}
            className={`mt-2 w-full py-2 rounded-lg text-sm font-bold transition ${
              rage >= RAGE_MAX
                ? 'bg-gradient-to-r from-[#c41e3a] to-[#ff6b35] text-[#f5e6d0] hover:brightness-110 active:scale-95 animate-rage-pulse'
                : 'bg-[rgba(139,0,0,0.25)] text-[#b8a08a] border border-[rgba(212,160,23,0.15)] cursor-not-allowed'
            }`}
          >
            {rage >= RAGE_MAX ? '⚡ 怒氣爆發 · 連環五擊' : `集氣中... 需要 ${RAGE_MAX - rage} 點怒氣`}
          </button>
        </section>

        {/* ====== 武器選擇 ====== */}
        <section className="mb-4">
          <div className="text-xs text-[#b8a08a] tracking-wider mb-2">選擇法器</div>
          <div className="grid grid-cols-4 gap-2">
            {WEAPONS.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelectWeapon(w.id)}
                className={`relative rounded-lg p-2 border transition active:scale-95 ${
                  weapon === w.id
                    ? 'bg-[rgba(196,30,58,0.25)] border-[#d4a017] shadow-md'
                    : 'bg-[rgba(139,0,0,0.25)] border-[rgba(212,160,23,0.2)] hover:border-[#d4a017]'
                }`}
              >
                <div className="text-2xl text-center mb-1">{w.icon}</div>
                <div className="text-[11px] text-center text-[#f5e6d0] font-bold leading-tight">{w.name}</div>
                <div className="text-[9px] text-center text-[#c41e3a] mt-0.5">-{w.damage} HP</div>
                {weapon === w.id && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#d4a017] border-2 border-[#1a0808]" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#b8a08a] text-center">
            <span className="text-[#d4a017]">{weaponInfo.icon} {weaponInfo.name}</span>
            ：{weaponInfo.desc}
          </p>
        </section>

        {/* ====== 統計面板 ====== */}
        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[#b8a08a] tracking-wider mb-1">今日已打</div>
            <div className="text-2xl font-black text-[#d4a017]">{stats.todayHits}</div>
            <div className="text-[9px] text-[#b8a08a] mt-0.5">下</div>
          </div>
          <div className="bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[#b8a08a] tracking-wider mb-1">累計已打</div>
            <div className="text-2xl font-black text-[#d4a017]">{stats.totalHits}</div>
            <div className="text-[9px] text-[#b8a08a] mt-0.5">下</div>
          </div>
          <div className="bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[#b8a08a] tracking-wider mb-1">已蓋印</div>
            <div className="text-2xl font-black text-[#c41e3a]">{stats.villainsBeaten}</div>
            <div className="text-[9px] text-[#b8a08a] mt-0.5">個</div>
          </div>
        </section>

        {/* ====== 痛恨榜 ====== */}
        {ranking.length > 0 && (
          <section className="mb-4">
            <div className="text-xs text-[#b8a08a] tracking-wider mb-2">痛恨榜 Top 5</div>
            <div className="bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg p-3 max-h-48 overflow-y-auto custom-scrollbar">
              {ranking.map(([name, count], i) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-[rgba(212,160,23,0.1)] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black w-5 text-center ${i === 0 ? 'text-[#ffd700]' : i === 1 ? 'text-[#d4a017]' : i === 2 ? 'text-[#c41e3a]' : 'text-[#b8a08a]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#f5e6d0]">{name}</span>
                  </div>
                  <span className="text-xs font-bold text-[#c41e3a]">{count} 下</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== 咒語庫 ====== */}
        <section className="mb-4">
          <details className="bg-[rgba(139,0,0,0.25)] border border-[rgba(212,160,23,0.25)] rounded-lg overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-[#d4a017] flex items-center justify-between">
              <span>📜 咒語大全（點擊展開）</span>
              <span className="text-xs text-[#b8a08a]">{ALL_CURSES.length} 句</span>
            </summary>
            <div className="px-4 pb-3 pt-1 max-h-72 overflow-y-auto custom-scrollbar">
              {Object.entries(CURSES).map(([cat, list]) => (
                <div key={cat} className="mb-3 last:mb-0">
                  <div className="text-xs font-bold text-[#c41e3a] mb-1.5 border-l-2 border-[#c41e3a] pl-2">
                    {cat}部咒語
                  </div>
                  <ul className="space-y-1">
                    {list.map((c, i) => (
                      <li key={i} className="text-[12px] text-[#f5e6d0] leading-relaxed pl-3">
                        · {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </section>

        {/* ====== 操作列 ====== */}
        <section className="flex gap-2 mb-4">
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-lg bg-[rgba(139,0,0,0.4)] border border-[rgba(212,160,23,0.25)] text-[#b8a08a] text-xs hover:border-[#d4a017] hover:text-[#f5e6d0] transition active:scale-95"
          >
            🔄 換個小人重新打
          </button>
          <button
            onClick={() => setSoundOn((v) => !v)}
            className="px-4 py-2 rounded-lg bg-[rgba(139,0,0,0.4)] border border-[rgba(212,160,23,0.25)] text-[#b8a08a] text-xs hover:border-[#d4a017] hover:text-[#f5e6d0] transition active:scale-95"
          >
            {soundOn ? '🔊 音效' : '🔇 靜音'}
          </button>
        </section>

        {/* ====== 頁尾說明 ====== */}
        <footer className="mt-auto pt-4 pb-2 text-center">
          <p className="text-[11px] text-[#b8a08a] leading-relaxed">
            驚蟄打小人，是民間傳統習俗，傳說驚蟄日雷聲驚醒冬眠蟲蛇，
            小人亦在此時活躍，故以拖鞋拍打紙人、唸咒驅趕。
          </p>
          <p className="text-[10px] text-[#7a6557] mt-2">
            ※ 本網站純娛樂用途，請勿當真 · 統計資料僅儲存於本機瀏覽器
          </p>
        </footer>
      </div>

      {/* ====== 驚蟄祝福儀式彈窗 ====== */}
      {blessingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setBlessingOpen(false)}
        >
          <div
            className="relative max-w-md w-full bg-gradient-to-b from-[#2a1010] to-[#1a0808] border-2 border-[#d4a017] rounded-2xl p-6 text-center shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 裝飾角 */}
            <div className="absolute top-2 left-2 text-[#c41e3a] text-xs">◆</div>
            <div className="absolute top-2 right-2 text-[#c41e3a] text-xs">◆</div>
            <div className="absolute bottom-2 left-2 text-[#c41e3a] text-xs">◆</div>
            <div className="absolute bottom-2 right-2 text-[#c41e3a] text-xs">◆</div>

            <div className="text-5xl mb-3">🙏</div>
            <h2 className="text-2xl font-black text-[#d4a017] mb-2 tracking-wider">驚蟄大禮成</h2>
            <p className="text-sm text-[#f5e6d0] mb-4 leading-relaxed">
              「<span className="text-[#c41e3a] font-bold">{committedName}</span>」已被你打得魂飛魄散，
              小人之煞盡數退散。
            </p>
            <div className="bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.3)] rounded-lg p-4 mb-4">
              <div className="text-xs text-[#b8a08a] mb-1">祭壇祝詞</div>
              <p className="text-sm text-[#f5e6d0] leading-relaxed">
                小人遠離我，貴人近身來<br />
                晦氣盡消除，好運跟著走<br />
                百煞皆退散，福祿自然來
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBlessingOpen(false)
                  handleReset()
                }}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-b from-[#d4a017] to-[#8b6914] text-[#1a0808] font-bold hover:brightness-110 active:scale-95 transition"
              >
                再打一個
              </button>
              <button
                onClick={() => setBlessingOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-[rgba(139,0,0,0.4)] border border-[rgba(212,160,23,0.25)] text-[#b8a08a] hover:text-[#f5e6d0] transition active:scale-95"
              >
                收工
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
