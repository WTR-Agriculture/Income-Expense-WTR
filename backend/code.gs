/**
 * WTR Ledger Backend (Google Apps Script)
 * 
 * Version: 4.1 (AI Smart Scan & Test Permission Ready)
 */

function testPermission() {
  // ฟังก์ชันนี้หนูเอาตัวดัก Error ออกแล้วค่ะ
  // เมื่อพี่สาวกด [▷ Run] คราวนี้ Google จะบังคับให้พี่สาวกดยอมรับสิทธิ์แน่นอน!
  UrlFetchApp.fetch('https://www.google.com');
  Logger.log('สิทธิ์การใช้งานถูกต้องแล้วค่ะ! พี่สาวลองสแกนใบเสร็จในแอปได้เลย');
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === 'getTransactions') return getJsonData('Transactions');
  if (action === 'getCategories') return getJsonData('Categories');
  if (action === 'getBusinesses') return getJsonData('Businesses');
  if (action === 'getParties') return getJsonData('Parties');
  return ContentService.createTextOutput("WTR Ledger API v4.1 - Active").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
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
  if (action === 'analyzeReceiptWithAI') return analyzeReceiptWithAI(data.payload);

  return createResponse({ status: 'error', message: 'Unknown action' });
}

// --- OpenAI OCR & Analysis ---
const OPENAI_CONFIG = {
  // ★ สำคัญ: พี่สาวนำ API Key ไปใส่ใน [Project Settings] -> [Script Properties]
  // ชื่อตัวแปร (Property): OPENAI_API_KEY
  API_KEY: PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY')
};

function analyzeReceiptWithAI(payload) {
  const { base64Images, modalType, existingParties } = payload;
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const partyListContext = existingParties ? existingParties.map(p => `${p.name} ${p.note ? '(' + p.note + ')' : ''}`).join(', ') : 'None';

  const systemPrompt = `You are a HIGH-PRECISION OCR TRANSCRIPTION MACHINE.
Your ONLY JOB is to COPY characters from the images to JSON with 100% fidelity.

STRICT RULES:
1. NO INTELLIGENCE/INTERPRETATION: Pretend you know nothing about brands, models, or business categories. Do NOT use your training data to "guess" or "fix" what you see.
2. NO AUTOCORRECT/AUTOFILL: If the image says "GWS700", you must write "GWS700". Never change it based on what you think is a "correct" number. 
3. LITERAL TRANSCRIPTION: Copy every symbol, letter, and number EXACTLY as printed or written. If the image has a typo like "พลาาสม่า", keep it as "พลาาสม่า". DO NOT fix spelling.
4. COLUMN-STRICT EXTRACTION: Locate the table. Read each row LEFT-TO-RIGHT.
   - Map Column "รายการ" to itemName.
   - Map Column "จำนวน" to quantity.
   - Map Column "หน่วยละ" to unitPrice.
   DO NOT swap these values.
5. NO LOGO/HEADER MIXING: Only extract items from the actual table rows.

Return ONLY JSON:
{
  "date": "YYYY-MM-DD",
  "partyName": "Vendor Name from Header",
  "vatAmount": number,
  "grandTotal": number, (The final total amount shown at the bottom of the bill)
  "items": [
    { "itemName": "EXACT CHAR-BY-CHAR COPY", "unitPrice": number, "quantity": number }
  ]
}
Use Thai for names/items.`;

  const userContent = [
    { type: "text", text: `Please analyze these ${base64Images.length} images for a ${modalType} entry. Reconcile bill details with slip names if both are present.` }
  ];
  
  base64Images.forEach(base64 => {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}` }
    });
  });

  const requestBody = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + OPENAI_CONFIG.API_KEY },
    payload: JSON.stringify(requestBody),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (result.choices && result.choices.length > 0) {
      const extractedData = JSON.parse(result.choices[0].message.content);
      return createResponse({ status: 'success', data: extractedData });
    } else {
      return createResponse({ status: 'error', message: 'AI could not process the image.', raw: result });
    }
  } catch (err) {
    return createResponse({ status: 'error', message: err.toString() });
  }
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
    if (sheetName === 'Transactions') sheet.appendRow(['id', 'type', 'date', 'party', 'desc', 'amount', 'method', 'time', 'category', 'refjob', 'receiptUrl', 'business', 'batchId']);
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
      if (val instanceof Date) {
        if (h === 'date') val = Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM-dd');
        else if (h === 'time') val = Utilities.formatDate(val, 'Asia/Bangkok', 'HH:mm');
        else val = val.toString();
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
