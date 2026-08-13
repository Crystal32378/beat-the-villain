# beat-the-villain RevenueCat Test Store Handoff

> 日期：2026-08-13  
> Branch：`codex/revenuecat-test-store-flow`  
> 範圍：Web RevenueCat Test Store；未部署、未建立正式 App Store / Google Play 商品。

## 程式端狀態

- 使用 `@revenuecat/purchases-js` 1.52.1。
- Test Store 入口受 `NEXT_PUBLIC_ENABLE_RC_TEST_STORE=true` 控制；production 預設關閉。
- Test Store API key 由 Crystal 在瀏覽器輸入，只存 localStorage；不得寫入 repo、文件或 log。
- 穩定的隨機 App User ID 存於 localStorage，供重新整理後查詢同一份 entitlement。
- 商品名稱、價格與幣別由 RevenueCat Offering 動態回傳，不硬編碼。
- 購買 callback 不直接解鎖；完成後重新查詢 active entitlement，只有 active 才更新 UI。
- 已擁有權益時停用購買按鈕。

## 固定識別碼

| 層級 | Identifier |
|---|---|
| Product | `lifetime` |
| Entitlement | `beat-the-villain Premium` |
| Offering | `default` |
| Package | `$rc_lifetime` |

## 已完成驗證

| 驗證 | 結果 |
|---|---|
| `npm run lint` | 通過 |
| production build（旗標關閉） | 通過 |
| production UI（旗標關閉） | 無測試入口、無 key input、console 無錯誤 |
| production build（旗標開啟） | 通過 |
| production UI（旗標開啟） | 測試按鈕與 key input 正常、console 無錯誤 |
| Offering 真實載入 | `Lifetime` / `$rc_lifetime` / Test Store 模擬價 `$99.99` |
| Cancel 路徑 | 正常取消、不解鎖、不卡 loading |
| Failed Purchase 路徑 | 顯示模擬失敗、不解鎖、可重新測試 |
| Successful Purchase 路徑 | entitlement active 後才顯示成功並解鎖 |
| 重新整理持久化 | `getCustomerInfo()` 重新確認後仍顯示已解鎖 |
| RevenueCat 後台紀錄 | Sandbox purchase 為 `owned`，正確連結 active entitlement |

## Dashboard 實際設定

- Project：`beat-the-villain`（`proj8626adaf`）
- App：Test Store（`appa27f7b53cd`）
- Product：`lifetime`，non-consumable，active
- Entitlement：`beat-the-villain Premium`，已連結 `lifetime`
- Offering：`default`，active / current
- Package：`$rc_lifetime`，已連結 `lifetime`
- Test Store public SDK key 只留在本機瀏覽器 localStorage，未寫入 repo 或文件。

## 完整驗收門檻

以下六項已於 2026-08-13 全數通過，因此本分支可標示為 **Web Test Store purchase flow VERIFIED**：

1. Offering 能載入 Dashboard 商品名稱與模擬價格。
2. Test Store Successful Purchase 後 entitlement active，收藏章解鎖。
3. Cancel 不顯示錯誤、不解鎖、不卡 loading。
4. Failed Purchase 顯示失敗、不解鎖、不卡 loading。
5. 重新整理後 `getCustomerInfo()` 仍確認 entitlement active。
6. RevenueCat Dashboard Sandbox customer 顯示 transaction 與正確 entitlement。

注意：`$99.99` 是 Test Store 模擬價，並非正式售價；本次驗證不代表 NT$60 已在 App Store Connect 或 Google Play Console 設定。

## 尚未涵蓋

- Capacitor iOS / Android SDK 與原生 restore purchases。
- App Store Connect / Google Play Console 正式商品與 NT$ 定價。
- Haptics 與原生 WebView 測試。
- 免費／付費內容切分；本 Test Store 入口只驗證購買 plumbing，不鎖現有四法器。
