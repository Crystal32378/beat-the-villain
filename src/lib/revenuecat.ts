'use client'

import { ErrorCode, Purchases } from '@revenuecat/purchases-js'

const KEY_STORAGE = 'beat-villain-rc-test-key'
const USER_STORAGE = 'beat-villain-rc-user-id'

export const ENTITLEMENT_ID = 'beat-the-villain Premium'
export const PRODUCT_ID = 'lifetime'
export const PACKAGE_ID = '$rc_lifetime'

export const RC_TEST_STORE_ENABLED =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_RC_TEST_STORE === 'true'

export interface OfferingInfo {
  productId: string
  packageId: string
  title: string
  description: string
  formattedPrice: string
  currency: string
}

export type PurchaseOutcome =
  | { status: 'success'; message: string }
  | { status: 'cancel'; message: string }
  | { status: 'fail'; message: string }

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(KEY_STORAGE) ?? ''
}

export function storeApiKey(key: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY_STORAGE, key.trim())
}

export function resetLocalTestState(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY_STORAGE)
  window.localStorage.removeItem(USER_STORAGE)
}

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'beat-villain-web-user'
  let userId = window.localStorage.getItem(USER_STORAGE)
  if (!userId) {
    userId = `beat-villain-${crypto.randomUUID()}`
    window.localStorage.setItem(USER_STORAGE, userId)
  }
  return userId
}

export async function initRevenueCat(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey.trim().startsWith('test_')) return false
    if (!Purchases.isConfigured()) {
      Purchases.configure({ apiKey: apiKey.trim(), appUserId: getOrCreateUserId() })
    }
    return true
  } catch (error) {
    console.error('[revenuecat] Test Store 初始化失敗', error instanceof Error ? error.message : error)
    return false
  }
}

function activeEntitlement(customerInfo: Awaited<ReturnType<InstanceType<typeof Purchases>['getCustomerInfo']>>): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive === true
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
    return activeEntitlement(customerInfo)
  } catch (error) {
    console.error('[revenuecat] entitlement 查詢失敗', error instanceof Error ? error.message : error)
    return false
  }
}

async function findPackage() {
  const offerings = await Purchases.getSharedInstance().getOfferings()
  const current = offerings.current
  if (!current) return null
  return (
    current.availablePackages.find((pkg) => pkg.identifier === PACKAGE_ID) ??
    current.availablePackages.find((pkg) => pkg.webBillingProduct.identifier === PRODUCT_ID) ??
    null
  )
}

export async function loadLifetimePack(): Promise<OfferingInfo | null> {
  try {
    const pkg = await findPackage()
    if (!pkg) return null
    const product = pkg.webBillingProduct
    return {
      productId: product.identifier,
      packageId: pkg.identifier,
      title: product.title || product.displayName || product.identifier,
      description: product.description ?? '',
      formattedPrice: product.price.formattedPrice,
      currency: product.price.currency,
    }
  } catch (error) {
    console.error('[revenuecat] Offering 載入失敗', error instanceof Error ? error.message : error)
    return null
  }
}

export async function purchaseLifetimePack(): Promise<PurchaseOutcome> {
  try {
    const pkg = await findPackage()
    if (!pkg) return { status: 'fail', message: '找不到 Test Store 的 Lifetime 商品' }

    await Purchases.getSharedInstance().purchase({ rcPackage: pkg })

    // 購買 callback 不負責放行；重新讀取 entitlement，只有 active 才算成功。
    const entitled = await checkPremiumEntitlement()
    if (!entitled) {
      return {
        status: 'fail',
        message: `交易已完成，但 ${ENTITLEMENT_ID} 尚未 active；請檢查 Dashboard 商品關聯。`,
      }
    }
    return { status: 'success', message: `${ENTITLEMENT_ID} 已生效，永久收藏章已解鎖。` }
  } catch (error) {
    const purchaseError = error as { errorCode?: number; message?: string }
    if (purchaseError.errorCode === ErrorCode.UserCancelledError) {
      return { status: 'cancel', message: '已取消購買，沒有變更任何權益。' }
    }
    console.error('[revenuecat] 購買失敗', purchaseError.message ?? error)
    return { status: 'fail', message: `購買失敗：${purchaseError.message ?? '未知錯誤'}` }
  }
}
