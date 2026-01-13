/**
 * Google Apps Script 用於處理 Google Sheets 的寫入和刪除操作
 * 
 * 使用說明：
 * 1. 在 Google Sheets 中，選擇「擴充功能」>「Apps Script」
 * 2. 貼上此程式碼
 * 3. 根據您的需求修改 sheetName 和欄位名稱
 * 4. 部署為 Web App
 */

// 根據不同的 gid 取得對應的 Sheet
function getSheetByGid(gid) {
  const spreadsheet = SpreadsheetApp.openById('1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw');
  
  // 根據 gid 取得對應的 sheet
  // gid=0: URLs
  // gid=997844508: Data
  // gid=2063120752: Tasks
  
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const sheetId = sheet.getSheetId();
    if (sheetId.toString() === gid) {
      return sheet;
    }
  }
  
  // 如果找不到，使用第一個 sheet
  return sheets[0];
}

// 處理 POST 請求
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, gid, rowData, rowIndex } = data;
    
    const sheet = getSheetByGid(gid);
    
    if (action === 'append') {
      // 根據 gid 決定欄位
      let row;
      if (gid === '0') {
        // URLs: Name, URL
        row = [rowData.Name || rowData.name, rowData.URL || rowData.url];
      } else if (gid === '997844508') {
        // Data: 資料, 數值
        row = [rowData.資料 || rowData.data, rowData.數值 || rowData.value];
      } else if (gid === '2063120752') {
        // Tasks: 任務名稱
        row = [rowData.任務名稱 || rowData.taskName || rowData.name];
      } else {
        row = Object.values(rowData);
      }
      
      sheet.appendRow(row);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Row added successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'delete') {
      // rowIndex 是從 0 開始，但 Sheets 從 1 開始，且第一行是標題
      const sheetRowIndex = rowIndex + 2; // +2 因為第一行是標題，且 Sheets 從 1 開始
      sheet.deleteRow(sheetRowIndex);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Row deleted successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 處理 GET 請求（用於測試）
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    message: 'Google Apps Script is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

