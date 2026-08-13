/* Browser smoke test + console check for beat-the-villain */
/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer-core')

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.env.TEST_URL || 'http://localhost:3001'

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=390,844'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844 })

  const consoleErrors = []
  const pageErrors = []
  const hydrationWarnings = []

  page.on('console', (msg) => {
    const text = msg.text()
    if (msg.type() === 'error') consoleErrors.push(text)
    if (/hydrat/i.test(text)) hydrationWarnings.push(text)
  })
  page.on('pageerror', (err) => pageErrors.push(String(err)))

  // 1. 載入首頁（mobile viewport）
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 1500))

  const title = await page.title()
  const h1 = await page.$eval('h1', (el) => el.textContent).catch(() => '(none)')
  const smokeCount = await page.$$eval('.animate-smoke', (els) => els.length)
  const bodyText = await page.$eval('body', (el) => el.innerText.length).catch(() => 0)

  // 2. 互動 smoke test：點擊祭壇 5 次
  const altar = await page.$('[role="button"][aria-label*="打小人祭壇"]')
  if (altar) {
    const box = await altar.boundingBox()
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(box.x + box.width / 2 + (i - 2) * 30, box.y + box.height / 2)
      await new Promise((r) => setTimeout(r, 200))
    }
  }
  const hitsText = await page.$eval('body', (el) => el.innerText.match(/累積傷害\s*(\d+)/)?.[1] || '0')

  // 3. 重新載入（驗證 reload 無錯誤）
  await page.reload({ waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1000))

  await page.screenshot({ path: process.env.SHOT_PATH || '/tmp/btv-smoke.png', fullPage: false })

  console.log(JSON.stringify({
    title,
    h1,
    smokeParticlesRendered: smokeCount,
    bodyTextChars: bodyText,
    hitsAfter5Clicks: hitsText,
    consoleErrors,
    pageErrors,
    hydrationWarnings,
    pass: consoleErrors.length === 0 && pageErrors.length === 0 && hydrationWarnings.length === 0,
  }, null, 2))

  await browser.close()
})().catch((e) => {
  console.error('SMOKE_TEST_FAILED', e)
  process.exit(1)
})
