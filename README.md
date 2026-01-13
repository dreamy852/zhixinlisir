# Eduzhixin Hub 部署說明

## 專案簡介

Eduzhixin Hub 是一個簡單的網頁應用，包含三個主要功能：
- **Common URL**: 管理常用連結
- **Data**: 管理資料和數值
- **Task**: 管理任務列表

## 檔案結構

```
.
├── index.html      # 主 HTML 檔案
├── styles.css      # 樣式檔案
├── app.js          # JavaScript 邏輯
└── README.md       # 本說明文件
```

## 部署方法

### 方法 1: GitHub Pages（推薦）

1. **建立 GitHub 儲存庫**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/eduzhixin-hub.git
   git push -u origin main
   ```

2. **啟用 GitHub Pages**
   - 前往儲存庫的 Settings
   - 選擇 Pages
   - Source 選擇 main branch
   - 儲存後，網站將在 `https://yourusername.github.io/eduzhixin-hub` 可用

### 方法 2: Netlify

1. **註冊 Netlify 帳號** (https://www.netlify.com)

2. **部署方式**
   - 方式 A: 拖放部署
     - 將整個專案資料夾拖放到 Netlify 的部署區域
   - 方式 B: GitHub 整合
     - 連接 GitHub 儲存庫
     - 自動部署

3. **設定**
   - Build command: 留空
   - Publish directory: `/` (根目錄)

### 方法 3: Vercel

1. **安裝 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署**
   ```bash
   vercel
   ```

3. **或使用網頁介面**
   - 前往 https://vercel.com
   - 匯入 GitHub 儲存庫
   - 自動部署

### 方法 4: Cloudflare Pages

1. **註冊 Cloudflare 帳號**

2. **建立新專案**
   - 選擇 Pages
   - 連接 Git 儲存庫或直接上傳檔案

3. **設定**
   - Build command: 留空
   - Build output directory: `/`

### 方法 5: 本地伺服器（開發測試）

使用 Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

使用 Node.js (http-server):
```bash
npm install -g http-server
http-server -p 8000
```

然後在瀏覽器開啟 `http://localhost:8000`

## Google Sheets 設定

### 重要說明

應用程式已整合 Google Apps Script Web App，可以完整讀寫 Google Sheets：

1. **讀取資料**: 使用 Google Sheets 的公開 CSV 匯出功能（表格需設為公開）
2. **寫入資料**: 使用 Google Apps Script Web App 進行寫入（已配置）

### 設定 Google Sheets 為公開

1. 開啟您的 Google Sheets
2. 點擊右上角的「共用」
3. 將權限設為「知道連結的使用者都可以檢視」
4. 複製連結並更新 `app.js` 中的 `CONFIG`（如需要）

### Google Apps Script 設定

應用程式已配置 Google Apps Script Web App URL：
- URL: `https://script.google.com/macros/s/AKfycby4IuZThCSvWvNMAdBuHt4iCEpcBEEMPwh4pmXK6wWJrzbRB0mfSOrk-d9xKAYQWIw/exec`

如果您需要修改或重新部署 Google Apps Script：

1. **建立 Apps Script 專案**
   - 在 Google Sheets 中，選擇「擴充功能」>「Apps Script」
   - 建立新的腳本

2. **使用提供的程式碼**
   - 參考 `google-apps-script.js` 檔案中的程式碼
   - 該程式碼已針對三個不同的 gid（URLs、Data、Tasks）進行優化

3. **部署為 Web App**
   - 點擊「部署」>「新增部署」
   - 選擇類型為「網頁應用程式」
   - 執行身份：我
   - 具有存取權的使用者：所有人
   - 部署並複製新的 Web App URL

4. **更新 app.js**
   - 將新的 Web App URL 更新到 `CONFIG.appsScriptUrl`

## 功能說明

### Common URL
- 預設包含 4 個常用連結
- 可以新增自訂連結
- 可以刪除連結
- 資料儲存在 Google Sheets (gid=0)

### Data
- 顯示資料和數值的對應表
- 可以新增資料項目
- 可以刪除資料項目
- 資料儲存在 Google Sheets (gid=997844508)

### Task
- 顯示任務列表
- 可以新增任務
- 可以刪除任務
- 資料儲存在 Google Sheets (gid=2063120752)

## 注意事項

1. **CORS 限制**: 如果遇到 CORS 錯誤，可能需要使用代理伺服器或設定 Google Sheets 的 CORS 標頭
2. **資料同步**: 目前寫入功能使用 localStorage 作為備份，建議定期手動同步到 Google Sheets
3. **安全性**: 如果 Google Sheets 包含敏感資料，請確保適當的權限設定

## 疑難排解

### 無法讀取 Google Sheets 資料
- 確認 Google Sheets 已設為公開
- 檢查網路連線
- 查看瀏覽器控制台的錯誤訊息

### 無法寫入資料
- 目前寫入功能使用 localStorage 備份
- 如需完整寫入功能，請設定 Google Apps Script（見上方說明）

### 樣式顯示異常
- 確認所有檔案都在同一目錄
- 清除瀏覽器快取
- 檢查檔案路徑是否正確

## 技術支援

如有問題，請檢查：
1. 瀏覽器控制台（F12）的錯誤訊息
2. 網路連線狀態
3. Google Sheets 的權限設定

