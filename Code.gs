/**
 * Google Apps Script for Common URLs Management
 * 
 * Instructions to deploy:
 * 1. Open Google Sheets: https://docs.google.com/spreadsheets/d/1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw/edit
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Save the project
 * 5. Click Deploy > New deployment
 * 6. Select type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy
 * 10. Copy the Web app URL and update it in script.js
 */

// Configuration
const SHEET_ID = '1utrF4anYUAoDGHMj1tAZDQOVbi-l61LYRWWMAIJJ1lw';
const SHEET_NAME = 'Sheet1';

/**
 * Handle GET request - Retrieve all URLs
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const newSheet = ss.insertSheet(SHEET_NAME);
      newSheet.getRange(1, 1, 1, 2).setValues([['Name', 'URL']]);
      return createJSONResponse({success: true, urls: []});
    }
    
    // Get all data from the sheet
    const data = sheet.getDataRange().getValues();
    
    // Skip header row if it exists
    const startRow = (data.length > 0 && (data[0][0] === 'Name' || data[0][0] === 'URL')) ? 1 : 0;
    
    // Convert to array of objects
    const urls = [];
    for (let i = startRow; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        urls.push({
          name: data[i][0].toString(),
          url: data[i][1].toString()
        });
      }
    }
    
    return createJSONResponse({
      success: true,
      urls: urls
    });
    
  } catch (error) {
    return createJSONResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Helper function to create JSON response with CORS headers
 */
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request - Add a new URL or Delete a URL
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SHEET_ID);
      const newSheet = ss.insertSheet(SHEET_NAME);
      newSheet.getRange(1, 1, 1, 2).setValues([['Name', 'URL']]);
    }
    
    // Parse the request data
    const postData = JSON.parse(e.postData.contents);
    
    // Handle delete action
    if (postData.action === 'delete') {
      const name = postData.name || '';
      const url = postData.url || '';
      
      if (!name || !url) {
        return createJSONResponse({
          success: false,
          error: 'Name and URL are required for deletion'
        });
      }
      
      // Get all data
      const data = sheet.getDataRange().getValues();
      const startRow = (data.length > 0 && (data[0][0] === 'Name' || data[0][0] === 'URL')) ? 1 : 0;
      
      // Find and delete the row
      for (let i = data.length - 1; i >= startRow; i--) {
        if (data[i][0] === name && data[i][1] === url) {
          sheet.deleteRow(i + 1);
          return createJSONResponse({
            success: true,
            message: 'URL deleted successfully'
          });
        }
      }
      
      return createJSONResponse({
        success: false,
        error: 'URL not found'
      });
    }
    
    // Handle add action (default)
    const name = postData.name || '';
    const url = postData.url || '';
    
    if (!name || !url) {
      return createJSONResponse({
        success: false,
        error: 'Name and URL are required'
      });
    }
    
    // Check if header row exists
    const data = sheet.getDataRange().getValues();
    if (data.length === 0 || (data[0][0] !== 'Name' && data[0][1] !== 'URL')) {
      sheet.getRange(1, 1, 1, 2).setValues([['Name', 'URL']]);
    }
    
    // Append the new URL
    sheet.appendRow([name, url]);
    
    return createJSONResponse({
      success: true,
      message: 'URL added successfully'
    });
    
  } catch (error) {
    return createJSONResponse({
      success: false,
      error: error.toString()
    });
  }
}

