/**
 * WTR Ledger Backend (Google Apps Script)
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create sheets named: "Transactions", "Categories", "Settings"
 * 3. Go to Extensions > Apps Script.
 * 4. Paste this code and save.
 * 5. Deploy as Web App (Execute as: Me, Who has access: Anyone).
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getTransactions') {
    return getJsonData('Transactions');
  } else if (action === 'getCategories') {
    return getJsonData('Categories');
  }
  
  return ContentService.createTextOutput("WTR Ledger API is running").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'addTransaction') {
    return addTransaction(data.payload);
  } else if (action === 'addCategory') {
    return addCategory(data.payload);
  }
  
  return createResponse({ status: 'error', message: 'Unknown action' });
}

function getJsonData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return createResponse(result);
}

function addTransaction(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
  const headers = sheet.getDataRange().getValues()[0];
  
  const newRow = headers.map(header => payload[header] || "");
  sheet.appendRow(newRow);
  
  return createResponse({ status: 'success' });
}

function addCategory(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  sheet.appendRow([payload.type, payload.name]);
  return createResponse({ status: 'success' });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
