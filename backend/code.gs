/**
 * WTR Ledger Backend (Google Apps Script)
 * 
 * Version: 3.0 (Supports Multi-Business & Image Uploads)
 */

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getTransactions') return getJsonData('Transactions');
  if (action === 'getCategories') return getJsonData('Categories');
  if (action === 'getBusinesses') return getJsonData('Businesses');
  return ContentService.createTextOutput("WTR Ledger API v3.0 - Multi-Business Enabled").setMimeType(ContentService.MimeType.TEXT);
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
  } else if (action === 'addBusiness') {
    return addBusiness(data.payload);
  } else if (action === 'uploadFiles') {
    return uploadFiles(data.payload);
  }
  
  return createResponse({ status: 'error', message: 'Unknown action' });
}

function getJsonData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  // Auto-create sheets if they don't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Transactions') sheet.appendRow(['id', 'type', 'date', 'party', 'desc', 'amount', 'method', 'time', 'category', 'receiptUrl', 'business']);
    if (sheetName === 'Categories') sheet.appendRow(['businessId', 'type', 'name']);
    if (sheetName === 'Businesses') sheet.appendRow(['id', 'name', 'icon']);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createResponse([]);
  
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return createResponse(result.reverse());
}

function addTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');
  if (!sheet) {
    sheet = ss.insertSheet('Transactions');
    sheet.appendRow(['id', 'type', 'date', 'party', 'desc', 'amount', 'method', 'time', 'category', 'receiptUrl', 'business']);
  }
  
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => payload[h] || "");
  sheet.appendRow(newRow);
  return createResponse({ status: 'success' });
}

function addCategory(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Categories');
  if (!sheet) {
    sheet = ss.insertSheet('Categories');
    sheet.appendRow(['businessId', 'type', 'name']);
  }
  sheet.appendRow([payload.businessId, payload.type, payload.name]);
  return createResponse({ status: 'success' });
}

function addBusiness(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Businesses');
  if (!sheet) {
    sheet = ss.insertSheet('Businesses');
    sheet.appendRow(['id', 'name', 'icon']);
  }
  sheet.appendRow([payload.id, payload.name, payload.icon || "Briefcase"]);
  return createResponse({ status: 'success' });
}

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
