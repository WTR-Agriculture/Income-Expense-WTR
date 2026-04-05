/**
 * WTR Ledger Backend (Google Apps Script)
 * 
 * Version: 4.0 (Fully Managed: Create, Read, Update, Delete)
 */

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getTransactions') return getJsonData('Transactions');
  if (action === 'getCategories') return getJsonData('Categories');
  if (action === 'getBusinesses') return getJsonData('Businesses');
  if (action === 'getParties') return getJsonData('Parties');
  return ContentService.createTextOutput("WTR Ledger API v4.0 - Active").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ status: 'error', message: 'Invalid JSON' });
  }
  
  const action = data.action;
  if (action === 'addTransaction') return addTransaction(data.payload);
  if (action === 'updateTransaction') return updateTransaction(data.payload);
  if (action === 'deleteTransaction') return deleteTransaction(data.payload.id);
  if (action === 'addCategory') return addCategory(data.payload);
  if (action === 'addBusiness') return addBusiness(data.payload);
  if (action === 'addParty') return addParty(data.payload);
  if (action === 'updateParty') return updateParty(data.payload);
  if (action === 'deleteParty') return deleteParty(data.payload.id);
  if (action === 'uploadFiles') return uploadFiles(data.payload);
  
  return createResponse({ status: 'error', message: 'Unknown action' });
}

function getJsonData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Transactions') sheet.appendRow(['id', 'type', 'date', 'party', 'desc', 'amount', 'method', 'time', 'category', 'refjob', 'receiptUrl', 'business']);
    if (sheetName === 'Categories') sheet.appendRow(['businessId', 'type', 'name']);
    if (sheetName === 'Businesses') sheet.appendRow(['id', 'name', 'icon']);
    if (sheetName === 'Parties') sheet.appendRow(['id', 'name', 'type', 'note']);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createResponse([]);
  
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // แปลง Google Sheets Date object ให้เป็น string ที่อ่านได้
      if (val instanceof Date) {
        if (h === 'date') {
          val = Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM-dd');
        } else if (h === 'time') {
          val = Utilities.formatDate(val, 'Asia/Bangkok', 'HH:mm');
        } else {
          val = val.toString();
        }
      }
      obj[h] = val;
    });
    return obj;
  });
  return createResponse(result.reverse());
}

function addTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => payload[h] || "");
  sheet.appendRow(newRow);
  return createResponse({ status: 'success' });
}

function updateTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === payload.id.toString()) {
      const updatedRow = headers.map(h => payload[h] !== undefined ? payload[h] : data[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
      return createResponse({ status: 'success' });
    }
  }
  return createResponse({ status: 'error', message: 'Transaction not found' });
}

function deleteTransaction(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return createResponse({ status: 'success' });
    }
  }
  return createResponse({ status: 'error', message: 'Transaction not found' });
}

function addCategory(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Categories');
  sheet.appendRow([payload.businessId, payload.type, payload.name]);
  return createResponse({ status: 'success' });
}

function addBusiness(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Businesses');
  sheet.appendRow([payload.id, payload.name, payload.icon || "Briefcase"]);
  return createResponse({ status: 'success' });
}

function logDebug(msg) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('DebugLog');
    if (!sheet) sheet = ss.insertSheet('DebugLog');
    sheet.appendRow([new Date(), msg]);
  } catch(e) {}
}

function uploadFiles(payload) {
  logDebug('uploadFiles called. txId=' + payload.txId + ' files=' + (payload.files ? payload.files.length : 0));

  let folder;
  try {
    const folders = DriveApp.getFoldersByName("WTR_Receipts");
    if (folders.hasNext()) {
      folder = folders.next();
      logDebug('Found folder: ' + folder.getName());
    } else {
      folder = DriveApp.createFolder("WTR_Receipts");
      logDebug('Created new folder: WTR_Receipts');
    }
  } catch (folderErr) {
    logDebug('Folder error: ' + folderErr.toString());
    return createResponse({ status: 'error', message: folderErr.toString() });
  }

  const urls = [];
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach(function(file) {
      try {
        const fileName = (payload.txId || Date.now()) + "_" + file.name;
        const base64Data = file.base64.split(',')[1];
        logDebug('Uploading: ' + fileName + ' base64len=' + (base64Data ? base64Data.length : 'null'));
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), file.type, fileName);
        const uploadedFile = folder.createFile(blob);
        uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        // แปลง URL เป็นรูปแบบที่ใช้ใน <img> ได้โดยตรง
        const fileId = uploadedFile.getId();
        const viewUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
        urls.push(viewUrl);
        logDebug('Upload OK: ' + viewUrl);
      } catch (err) {
        logDebug('Upload error: ' + err.toString());
      }
    });
  }

  // อัปเดต receiptUrl ในชีทอัตโนมัติ
  if (urls.length > 0 && payload.txId) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Transactions');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idCol = headers.indexOf('id');
      const receiptCol = headers.indexOf('receiptUrl');
      for (var i = 1; i < data.length; i++) {
        if (data[i][idCol].toString() === payload.txId.toString()) {
          sheet.getRange(i + 1, receiptCol + 1).setValue(urls.join(", "));
          logDebug('Sheet updated receiptUrl for txId=' + payload.txId);
          break;
        }
      }
    } catch (sheetErr) {
      logDebug('Sheet update error: ' + sheetErr.toString());
    }
  } else {
    logDebug('No URLs to update. urls.length=' + urls.length);
  }

  return createResponse({ status: 'success', urls: urls });
}

function addParty(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Parties');
  const headers = sheet.getDataRange().getValues()[0];
  const newRow = headers.map(h => payload[h] || "");
  sheet.appendRow(newRow);
  return createResponse({ status: 'success' });
}

function updateParty(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Parties');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === payload.id.toString()) {
      const updatedRow = headers.map(h => payload[h] !== undefined ? payload[h] : data[i][headers.indexOf(h)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
      return createResponse({ status: 'success' });
    }
  }
  return createResponse({ status: 'error', message: 'Party not found' });
}

function deleteParty(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Parties');
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return createResponse({ status: 'success' });
    }
  }
  return createResponse({ status: 'error', message: 'Party not found' });
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
