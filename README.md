# 線上打小人出氣筒 · 驚蟄祭壇 🩴

> 拖鞋一拍，晦氣消散 —— 一個充滿驚蟄紙紮風味的線上出氣互動網站。
> 把讓你勞氣的人事物寫成紙人，用拖鞋、長針、九節鞭、桃木劍打到魂飛魄散，掃走晦氣、迎來好運。

![Tech Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 特色功能

### 🎯 核心玩法
- **祭壇主場景**：暗紅金紙紮風背景，左右搖曳燭火、裊裊上升煙霧，中央擺放可互動的紙人
- **點擊祭壇任何位置**即可出手：武器落下動畫、血花飛濺、紙人顫抖、傷害數字浮起、隨機咒語飄動
- **12 個預設小人**：慣老闆、機車主管、渣男渣女、前任、三姑六婆、奧客、鍵盤俠⋯⋯也支援自訂名稱
- **4 種法器**：塑膠拖鞋 (-1)、五吋長針 (-2)、九節鞭 (-3)、桃木劍 (-5)，每種音效不同

### 📈 進階系統
- **5 階段紙人退化**：完好 → 受損 → 重傷 → 殘破 → 潰散，外觀裂痕、血跡、表情逐漸加劇
- **怒氣條**：100 點滿後可觸發「怒氣爆發」連環五擊 + 多重咒語齊發
- **蓋印系統**：30 下後祭壇自動蓋上「已打 · 驚蟄祭壇印」紅印
- **驚蟄大禮成儀式**：50 下觸發祝福彈窗，含「小人遠離我，貴人近身來」祝詞

### 📜 咒語庫
20+ 句咒語，按 **頭 / 手 / 腳 / 口 / 心** 五部位分類，擊打時隨機浮現，也可在咒語大全中瀏覽。

### 💾 本機統計
- 今日已打、累計已打、已蓋印數
- 痛恨榜 Top 5（按小人名累計被打次數）
- 跨日自動重置今日計數
- 所有資料儲存於瀏覽器 LocalStorage，不上傳任何伺服器

### 🔊 音效
- 全部由 **Web Audio API** 即時合成，無需音檔
- 拖鞋拍打、針扎、鞭甩、劍斬、怒氣爆發、蓋印聲
- 一鍵靜音

---

## 🛠 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 語言 | TypeScript 5 |
| 樣式 | Tailwind CSS 4 |
| UI | 自製元件 + 手繪 SVG 紙人 |
| 音效 | Web Audio API |
| 持久化 | localStorage |
| 字型 | Noto Serif TC |

---

## 🚀 本機開發

### 需求
- Node.js 18.18+ 或 Bun 1.0+
- npm / pnpm / yarn / bun 任一套件管理器

### 步驟

```bash
# 1. Clone 專案
git clone https://github.com/Crystal32378/beat-the-villain.git
cd beat-the-villain

# 2. 安裝依賴
bun install   # 或 npm install / pnpm install / yarn

# 3. 啟動開發伺服器
bun run dev   # 或 npm run dev

# 4. 打開瀏覽器
# 本機開發：http://localhost:3000
```

---

## 🌐 部署到 Vercel（推薦）

這個專案是純前端 Next.js 應用，**不需要資料庫、不需要環境變數**，部署超簡單：

### 方法一：一鍵部署（最快）

1. 把這個 repo 推到你的 GitHub
2. 到 [vercel.com](https://vercel.com) 註冊/登入（可用 GitHub 帳號直接登入）
3. 點 **「Add New Project」** → 選擇這個 repo
4. **直接點「Deploy」**，所有設定 Vercel 會自動偵測
5. 等待 1-2 分鐘，部署完成後會拿到一個 `https://beat-the-villain.vercel.app` 的公開連結
6. 之後每次 `git push` 到 main 分支，Vercel 會自動重新部署

### 方法二：用 Vercel CLI

```bash
npm i -g vercel
vercel          # 首次部署
vercel --prod   # 之後更新到正式環境
```

### 其他託管平台
- **Netlify**：支援 Next.js，設定類似 Vercel
- **Cloudflare Pages**：支援 Next.js（需用 `@cloudflare/next-on-pages`）
- **GitHub Pages**：不建議，因為不支援 Next.js SSR（需改靜態匯出設定）

---

## 📁 專案結構

```
beat-the-villain/
├── src/
│   ├── app/
│   │   ├── page.tsx        # 主頁面（打小人祭壇 + 所有互動邏輯）
│   │   ├── layout.tsx      # 根 layout（字型、metadata）
│   │   └── globals.css     # 全域樣式 + 驚蟄祭壇動畫 keyframes
│   ├── components/ui/      # shadcn/ui 元件庫（本專案主要用到 Toaster）
│   └── lib/utils.ts        # 工具函式
├── public/                 # 靜態資源
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 設計理念

- **驚蟄紙紮風視覺**：暗紅、金色、米白配色，模仿廟宇祭壇的莊嚴感
- **手感動畫**：紙人顫抖、血花飛濺、咒語浮動、燭火搖曳，每個互動都有視覺回饋
- **無障礙**：語意化 HTML、ARIA 標籤、鍵盤可操作（Enter 提交）
- **響應式**：手機到桌面全寬皆適配
- **零依賴音效**：所有音效由 Web Audio API 即時合成，不載入任何音檔

---

## ⚠️ 免責聲明

本網站純娛樂用途，請勿當真。打小人習俗承載的是民間對「掃除晦氣、迎來好運」的心理寄託，重點在於過程中的情緒抒發，而非對他人的實質詛咒。請以健康的心態使用，真正的心結還是要靠溝通與自我調適來化解。

---

## 📜 License

MIT License - 歡迎自由 fork、修改、部署自己的版本。

---

## 🙏 致謝

驚蟄打小人是華人民間傳統習俗，傳說驚蟄日雷聲驚醒冬眠蟲蛇，小人亦在此時活躍，故以拖鞋拍打紙人、唸咒驅趕。本網站將此習俗數位化，希望能為現代人的壓力提供一個趣味出口。

**打完小人，記得對自己好一點。** 🌸
