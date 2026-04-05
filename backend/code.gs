/**
 * WTR Ledger Backend (Google Apps Script)
 * 
 * Version: 2.0 (Supports Multiple Image Uploads to Drive)
 */

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getTransactions') return getJsonData('Transactions');
  if (action === 'getCategories') return getJsonData('Categories');
  return ContentService.createTextOutput("WTR Ledger API v2.0 - Active").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ status: 'error', message: 'Invalid JSON' });
  }
  
  const action = data.action;
  
  if (action === 'addTransaction') {
    return addTransaction(data.payload);
  } else if (action === 'addCategory') {
    return addCategory(data.payload);
  } else if (action === 'uploadFiles') {
    return uploadFiles(data.payload);
  }
  
  return createResponse({ status: 'error', message: 'Unknown action' });
}

function getJsonData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return createResponse({status: 'error', message: 'Sheet not found'});
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createResponse([]);
  
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return createResponse(result.reverse()); // Newest first
}

function addTransaction(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transactions');
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => payload[h] || "");
  sheet.appendRow(newRow);
  return createResponse({ status: 'success' });
}

function addCategory(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  sheet.appendRow([payload.type, payload.name]);
  return createResponse({ status: 'success' });
}

/**
 * Handle Multiple Base64 File Uploads to Drive
 */
function uploadFiles(payload) {
  const folderName = "WTR_Receipts";
  let folder;
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  const urls = payload.files.map((file, index) => {
    const fileName = `${payload.txId}_${index}_${file.name}`;
    const contentType = file.type;
    const base64Data = file.base64.split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
    const driveFile = folder.createFile(blob);
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return driveFile.getUrl();
  });
  
  return createResponse({ status: 'success', urls: urls });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
