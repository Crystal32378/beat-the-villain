# beat-the-villain Audit & Hardening Report

> 日期：2026-08-13 ｜ Branch：`autoclaw/beat-villain-hardening`
> 範圍：read-only audit + technical hardening（未建立 RevenueCat 商品、未操作 Dashboard、未部署、未 merge）

---

## Part 1：Technical & Product Audit（read-only）

### 技術架構 [VERIFIED]

| 項目 | 內容 |
|---|---|
| 框架 | Next.js 16.1.1（build 解析 16.3.0）+ React 19 + TypeScript 5 + Tailwind 4 |
| 結構 | 單一 `src/app/page.tsx`（1490 行）+ layout.tsx + globals.css，純 client-side |
| 後端 | 無 backend、無 API、無 middleware |
| 音效 | BeatSoundEngine（Web Audio 即時合成，零音檔）：6 種音效 + 靜音 |
| 持久化 | localStorage（key `da-xiao-ren-stats`） |
| Git | 僅 1 commit（`263861d`） |

### 功能完成度 [VERIFIED]（逐行確認，全為真邏輯）

- ✅ 12 預設小人 + 自訂名稱（maxLength 12）
- ✅ 4 法器（拖鞋-1 / 長針-2 / 九節鞭-3 / 桃木劍-5）真實傷害累積
- ✅ 5 階段紙人退化（SVG 裂痕 / 表情 / 漩渦眼）
- ✅ 怒氣條 100 → 手動五連擊（追蹤 timers 防疊加）
- ✅ 蓋印（30 傷害）、驚蟄大禮成（50 傷害）
- ✅ 咒語庫 20+ 句（5 部位 + 收尾）
- ✅ 統計 + 痛恨榜 Top 5、鍵盤 / 觸控 / ARIA、響應式

**結論：無假資料、無硬編碼成功。唯一未做的是商業化（完全無 IAP 程式碼）。**

### IAP 模式建議（獨立判斷，非套用中元普渡）

| 模式 | 評估 | 結論 |
|---|---|---|
| 消耗品 | 「打小人課金」觀感差、pay-to-win 與民俗衝突 | ❌ |
| 訂閱 | 工具型留存差、季節性主題無意義 | ❌ |
| NT$60 一次買斷 | 解鎖完整法器 + 自訂紙人 + 特殊儀式，符合「一次供奉、永久擁有」 | ✅ 推薦 [ASSUMPTION] |

**產品決策待 Crystal**：免費版保留完整玩法、付費解鎖「收藏與儀式」層（較安全）；或閹割法器作為付費賣點（風險高，不建議）。

### 風險盤點

| 風險 | 評估 | 信心 |
|---|---|---|
| Web Audio 啟動 | 音效皆由點擊觸發，符合 WKWebView gesture 規範 | VERIFIED |
| **無震動 API** | 程式碼無 vibrate；打小人手感極度依賴觸覺，原生需補 Capacitor Haptics | VERIFIED |
| 資料保存 | localStorage 可能被 WKWebView 清除；需原生 Preferences | MUST-TEST |
| 效能 | 血花 + 浮動文字 + 煙霧同時動畫，低階 Android 可能卡 | MUST-TEST |
| App Store 暴力意象 | 血花 / 針 / 鞭 / 劍 → 12+ 分級起跳，最大審查風險 | ASSUMPTION |
| 真人姓名輸入 | 潛在霸凌 / 誹謗觀感，需免責聲明或限制代稱 | MUST-TEST |
| App Store 4.2 | 單一互動頁面 →「網站包殼」風險（比中元普渡高） | VERIFIED |
| 隱私 | 無帳號、無追蹤、全本機儲存 → 低風險（好處） | VERIFIED |

---

## Part 2：Technical Hardening（本 branch）

### 問題：SmokeColumn SSR hydration 風險

**證據（audit 時實測）**：`SmokeColumn` 的 `useMemo(() => { Math.random() ... }, [offset])` 每次 render 重骰。兩次 SSR 請求的 `--smoke-x` 值不同（18.52 vs -19.26…），client hydration 時 useMemo 再執行一次 → 值不同 → hydration mismatch。

**修正**：粒子改為 mount 後 `useState + useEffect` 產生（client-only）。SSR 與首次 client render 皆為空陣列 → HTML 一致；mount 後立即填入粒子，視覺保留。

```diff
- const particles = useMemo(() => Array.from({ length: 5 }).map(... Math.random() ...), [offset])
+ const [particles, setParticles] = useState<...[]>([])
+ useEffect(() => {
+   setParticles(Array.from({ length: 5 }).map(... Math.random() ...))
+ }, [offset])
```

### 驗證結果（全部通過）

| 驗證項 | 結果 | 方式 |
|---|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings | eslint . |
| `npm run build` | ✅ Compiled successfully（exit 0） | next build（Next 16.3.0） |
| SSR 不再含隨機粒子 | ✅ `smoke-x` 出現 0 次 | curl 兩次比較 |
| 兩次 SSR inline style 一致 | ✅ 完全相同 | diff |
| **Browser console** | ✅ **0 errors / 0 pageerrors / 0 hydration warnings** | puppeteer-core 連 Chrome headless |
| 頁面渲染 | ✅ 標題 / H1 / 煙霧粒子 5 個正常 | 同上 |
| 互動 smoke test | ✅ 點擊 5 次 → 累積傷害 = 5 | 同上 |

**Browser 測試方式**（可重跑）：

```bash
npm run dev -- -p 3001
node docs/shipaton/smoke-test.cjs   # 需先 npm i --no-save puppeteer-core
```

### Changed Files

| 檔案 | 變更 |
|---|---|
| `src/app/page.tsx` | SmokeColumn hydration 修正（粒子 client-only 產生） |
| `docs/shipaton/audit-hardening-report.md` | 本文件 |
| `docs/shipaton/smoke-test.cjs` | 可重跑的瀏覽器 smoke test 腳本 |

### 尚未測試項目

- 未在 production build（`next start`）下重跑瀏覽器測試（僅 dev server 驗證）
- 未測 Android 低階裝置效能
- 未測原生 WebView（無 Xcode / Android Studio）
- 未建立任何 RevenueCat 商品 / 未操作 Dashboard
- 未加入付費牆（依本 branch 範圍）

### 下一階段（Haptics + RevenueCat）前需要的產品決策

1. **免費 / 付費切分**：免費保留完整 4 法器 + 付費解鎖「自訂紙人外觀 / 特殊儀式 / 未來法器」？還是其他組合？
2. **NT$60 定價確認**：是否沿用中元普渡的六六大順定價？或打小人另有考量（如 NT$30 試水溫）？
3. **entitlement identifier 命名**：建議 `beat-the-villain Premium`（待 Crystal 於 Dashboard 設定時確認）
4. **暴力意象緩解**：是否接受 Apple 可能要求調降血花寫實度？備好文化脈絡說明（鵝頸橋打小人）
5. **真人姓名防護**：輸入框是否需要免責聲明文案或改為代稱限制？
6. **Haptics 範圍**：只有擊打回饋，或連怒氣爆發 / 蓋印都要？（影響 Capacitor Haptics 設定）
