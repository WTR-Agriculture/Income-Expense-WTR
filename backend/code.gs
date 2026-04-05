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
  // ★ รับ uploadFile แบบใหม่: action ใน URL params, base64 เป็น body ตรงๆ
  if (e.parameter && e.parameter.action === 'uploadFile') {
    return uploadSingleFile(
      e.parameter.txId,
      e.parameter.fileName,
      e.parameter.fileType || 'image/jpeg',
      e.postData.contents  // raw base64 string (ไม่มี data:...;base64, prefix)
    );
  }

  // JSON actions (addTransaction, updateTransaction, ...)
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createResponse({ status: 'error', message: 'Invalid JSON: ' + err.toString() });
  }

  const action = data.action;
  if (action === 'addTransaction') return addTransaction(data.payload);
  if (action === 'addTransactionsBatch') return addTransactionsBatch(data.payload);
  if (action === 'updateTransaction') return updateTransaction(data.payload);
  if (action === 'updateTransactionsBatchReceiptUrl') return updateTransactionsBatchReceiptUrl(data.payload);
  if (action === 'deleteTransaction') return deleteTransaction(data.payload.id);
  if (action === 'addCategory') return addCategory(data.payload);
  if (action === 'addBusiness') return addBusiness(data.payload);
  if (action === 'addParty') return addParty(data.payload);
  if (action === 'updateParty') return updateParty(data.payload);
  if (action === 'deleteParty') return deleteParty(data.payload.id);

  return createResponse({ status: 'error', message: 'Unknown action' });
}

function addTransactionsBatch(payloadArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');
  const headers = sheet.getDataRange().getValues()[0];
  const newRows = payloadArray.map(payload => headers.map(h => payload[h] || ""));
  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  return createResponse({ status: 'success', count: newRows.length });
}

function updateTransactionsBatchReceiptUrl(payload) {
  const { ids, url } = payload;
  if (!ids || !url) return createResponse({ status: 'error', message: 'Missing ids or url' });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  const receiptCol = headers.indexOf('receiptUrl');
  
  const idSet = new Set(ids.map(id => id.toString()));
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (idSet.has(data[i][idCol].toString())) {
      sheet.getRange(i + 1, receiptCol + 1).setValue(url);
      count++;
    }
  }
  return createResponse({ status: 'success', updated: count });
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

function updateTransactionsBatchReceiptUrl(payload) {
  const { ids, url } = payload;
  if (!ids || !url) return createResponse({ status: 'error', message: 'Missing ids or url' });
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  const receiptCol = headers.indexOf('receiptUrl');
  
  const idSet = new Set(ids.map(id => id.toString()));
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (idSet.has(data[i][idCol].toString())) {
      sheet.getRange(i + 1, receiptCol + 1).setValue(url);
      count++;
    }
  }
  return createResponse({ status: 'success', updated: count });
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

function uploadSingleFile(txId, fileName, fileType, base64Data) {
  logDebug('uploadSingleFile: txId=' + txId + ' file=' + fileName + ' base64len=' + (base64Data ? base64Data.length : 0));

  let folder;
  try {
    const folders = DriveApp.getFoldersByName("WTR_Receipts");
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("WTR_Receipts");
      logDebug('Created folder WTR_Receipts');
    }
  } catch (folderErr) {
    logDebug('Folder error: ' + folderErr.toString());
    return createResponse({ status: 'error', message: 'Folder error: ' + folderErr.toString() });
  }

  try {
    const safeFileName = (txId || Date.now()) + '_' + fileName;
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), fileType, safeFileName);
    const uploadedFile = folder.createFile(blob);
    uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const viewUrl = 'https://drive.google.com/uc?export=view&id=' + uploadedFile.getId();
    logDebug('Upload OK: ' + viewUrl);

    // อัปเดต receiptUrl ในชีทอัตโนมัติ
    if (txId) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Transactions');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idCol = headers.indexOf('id');
      const receiptCol = headers.indexOf('receiptUrl');
      for (var i = 1; i < data.length; i++) {
        if (data[i][idCol].toString() === txId.toString()) {
          const existing = data[i][receiptCol] ? data[i][receiptCol] + ', ' : '';
          sheet.getRange(i + 1, receiptCol + 1).setValue(existing + viewUrl);
          logDebug('Sheet updated: txId=' + txId);
          break;
        }
      }
    }

    return createResponse({ status: 'success', url: viewUrl });
  } catch (err) {
    logDebug('Upload error: ' + err.toString());
    return createResponse({ status: 'error', message: err.toString() });
  }
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
