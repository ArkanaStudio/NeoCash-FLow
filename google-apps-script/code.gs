// Configuration & Initial Setup
function doGet(e) {
  setupDatabase();
  const action = e.parameter.action;
  
  if (action === 'getTransactions') return responseJSON(getTableData('Transactions'));
  if (action === 'getBudgets') return responseJSON(getTableData('Budgets'));
  if (action === 'getGoals') return responseJSON(getTableData('Goals'));
  if (action === 'getCategories') return responseJSON(getTableData('Categories'));
  
  return responseJSON({ status: 'success', message: 'Finora API Active' });
}

function doPost(e) {
  setupDatabase();
  try {
    let contents = {};
    if (e.parameter && e.parameter.data) {
      contents = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      contents = e.parameter;
    }

    const action = contents.action;
    
    // 1. TRANSACTIONS
    if (action === 'addTransaction') {
      const amount = Number(contents.amount);
      if (!contents.description || isNaN(amount) || amount <= 0) {
        return responseJSON({ status: 'ignored', message: 'Invalid payload' });
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('Transactions');
      
      const now = new Date();
      const formattedDate = contents.date ? formatDateString(contents.date) : formatDateString(now);
      const nowStr = formatTimestamp(now);
      const id = contents.id || 'TRX_' + Date.now();
      
      sheet.appendRow([
        id,
        formattedDate,
        contents.type,
        contents.description,
        contents.category,
        contents.account,
        amount,
        contents.notes || '',
        nowStr,
        nowStr
      ]);

      ensureCategoryExists(contents.category, contents.type);
      return responseJSON({ status: 'success', id: id });
    }
    
    if (action === 'deleteTransaction') {
      deleteRowById('Transactions', contents.id);
      return responseJSON({ status: 'success' });
    }
    
    if (action === 'updateTransaction') {
      updateTransactionRow(contents);
      ensureCategoryExists(contents.category, contents.type);
      return responseJSON({ status: 'success' });
    }

    // 2. BUDGETS
    if (action === 'setBudget') {
      upsertBudget(contents);
      return responseJSON({ status: 'success' });
    }

    if (action === 'deleteBudget') {
      if (contents.id) {
        deleteRowById('Budgets', contents.id);
      } else {
        deleteBudgetByCategory('Budgets', contents.category, contents.month);
      }
      return responseJSON({ status: 'success' });
    }

    // 3. GOALS
    if (action === 'saveGoal') {
      upsertGoal(contents);
      return responseJSON({ status: 'success' });
    }

    if (action === 'deleteGoal') {
      deleteRowById('Goals', contents.id);
      return responseJSON({ status: 'success' });
    }
    
    return responseJSON({ status: 'error', message: 'Action not supported' });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

// Inisialisasi Database & Header Resmi Termasuk Kolom USED
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    { name: 'Transactions', headers: ['ID', 'Date', 'Type', 'Description', 'Category', 'Account', 'Amount', 'Notes', 'CreatedAt', 'UpdatedAt'] },
    { name: 'Budgets', headers: ['ID', 'Month', 'Category', 'Budget', 'Used', 'CreatedAt'] },
    { name: 'Goals', headers: ['ID', 'Goal', 'Target', 'Current', 'Deadline', 'CreatedAt'] },
    { name: 'Categories', headers: ['ID', 'Name', 'Type', 'Icon', 'Color'] }
  ];

  sheets.forEach(s => {
    let sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
      sheet.appendRow(s.headers);
      sheet.getRange(1, 1, 1, s.headers.length).setFontWeight('bold');
    } else {
      // Pastikan baris header selalu sesuai urutan standar resmi
      sheet.getRange(1, 1, 1, s.headers.length).setValues([s.headers]).setFontWeight('bold');
    }
  });
}

function ensureCategoryExists(categoryName, type) {
  if (!categoryName) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catSheet = ss.getSheetByName('Categories');
  if (!catSheet) return;

  const rows = catSheet.getDataRange().getDisplayValues();
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toLowerCase() === String(categoryName).trim().toLowerCase()) {
      found = true;
      break;
    }
  }

  if (!found) {
    catSheet.appendRow(['CAT_' + Date.now(), categoryName, type || 'Expense', 'tag', '#4f46e5']);
  }
}

// PEMBACAAN DATA PRESISI BERDASARKAN INDEKS NAMA HEADER
function getTableData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  // Jika membaca sheet Budgets, perbarui kolom 'Used' secara real-time dari Sheet Transactions
  if (sheetName === 'Budgets') {
    recalculateBudgetsUsed();
  }

  const rawValues = sheet.getDataRange().getValues();
  const displayValues = sheet.getDataRange().getDisplayValues();
  if (rawValues.length <= 1) return [];
  
  const headers = rawValues[0].map(h => String(h).trim().toLowerCase());
  const results = [];

  for (let i = 1; i < rawValues.length; i++) {
    const rowRaw = rawValues[i];
    const rowDisplay = displayValues[i];

    if (!rowRaw[0] || String(rowRaw[0]).trim() === '') continue;

    let obj = {};
    headers.forEach((key, idx) => {
      let val = rowDisplay[idx];

      if (key === 'date' || key === 'month') {
        val = formatDateString(rowRaw[idx] || val);
      } else if (key === 'budget' || key === 'target' || key === 'current' || key === 'amount' || key === 'used') {
        val = Number(rowRaw[idx]) || 0;
      } else {
        val = String(val || '').trim();
      }

      obj[key] = val;
    });
    results.push(obj);
  }

  return results;
}

// Menghitung Ulang Kolom USED untuk Setiap Budget Berdasarkan Pengeluaran di Sheet Transactions
function recalculateBudgetsUsed() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bgSheet = ss.getSheetByName('Budgets');
  const txSheet = ss.getSheetByName('Transactions');
  if (!bgSheet || !txSheet) return;

  const bgData = bgSheet.getDataRange().getDisplayValues();
  const txData = txSheet.getDataRange().getValues();
  if (bgData.length <= 1) return;

  // Hitung total pengeluaran per kategori dari Transactions
  const categoryExpenses = {};
  for (let j = 1; j < txData.length; j++) {
    const type = String(txData[j][2] || '').trim(); // Type
    const cat = String(txData[j][4] || '').trim().toLowerCase(); // Category
    const amt = Number(txData[j][6]) || 0; // Amount

    if (type === 'Expense' && cat) {
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    }
  }

  // Update nilai kolom USED (Kolom E / Kolom ke-5) pada Sheet Budgets
  for (let i = 1; i < bgData.length; i++) {
    const bgCat = String(bgData[i][2] || '').trim().toLowerCase();
    const usedAmt = categoryExpenses[bgCat] || 0;
    bgSheet.getRange(i + 1, 5).setValue(usedAmt);
  }
}

function deleteRowById(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const data = sheet.getDataRange().getDisplayValues();
  const searchId = String(id).trim();

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).trim() === searchId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

function deleteBudgetByCategory(sheetName, category, month) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  const data = sheet.getDataRange().getDisplayValues();
  const targetCategory = String(category || '').trim().toLowerCase();
  const targetMonth = String(month || '').trim();

  for (let i = data.length - 1; i >= 1; i--) {
    const rowMonth = String(data[i][1] || '').trim();
    const rowCat = String(data[i][2] || '').trim().toLowerCase();

    if (rowCat === targetCategory) {
      if (!targetMonth || rowMonth === targetMonth) {
        sheet.deleteRow(i + 1);
      }
    }
  }
}

function updateTransactionRow(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Transactions');
  const rows = sheet.getDataRange().getDisplayValues();
  const searchId = String(data.id).trim();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === searchId) {
      const nowStr = formatTimestamp(new Date());
      const formattedDate = formatDateString(data.date);

      sheet.getRange(i + 1, 2, 1, 7).setValues([[
        formattedDate, data.type, data.description, data.category, data.account, Number(data.amount) || 0, data.notes || ''
      ]]);
      sheet.getRange(i + 1, 10).setValue(nowStr);
      break;
    }
  }
}

// UPSERT BUDGET DENGAN STRUCTURE FIX: [ ID | Month | Category | Budget | Used | CreatedAt ]
function upsertBudget(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Budgets');
  
  // Pastikan Header Baris 1 Terpasang Presisi
  sheet.getRange(1, 1, 1, 6).setValues([['ID', 'Month', 'Category', 'Budget', 'Used', 'CreatedAt']]).setFontWeight('bold');

  const rows = sheet.getDataRange().getDisplayValues();
  const now = new Date();
  const realtimeMonth = formatYearMonth(now); // YYYY-MM
  
  const targetCat = String(data.category || '').trim();
  const targetMonth = (data.month && String(data.month).trim().length === 7) 
                      ? String(data.month).trim() 
                      : realtimeMonth;
  
  const budgetAmount = Number(data.budget) || 0;
  const budgetId = data.id || 'BDG_' + Date.now();

  // Hitung total terpakai dari Sheet Transactions
  const txSheet = ss.getSheetByName('Transactions');
  let usedAmount = 0;
  if (txSheet) {
    const txData = txSheet.getDataRange().getValues();
    for (let j = 1; j < txData.length; j++) {
      if (String(txData[j][2] || '').trim() === 'Expense' && 
          String(txData[j][4] || '').trim().toLowerCase() === targetCat.toLowerCase()) {
        usedAmount += Number(txData[j][6]) || 0;
      }
    }
  }

  let foundIndex = -1;

  for (let i = 1; i < rows.length; i++) {
    const rowId = String(rows[i][0]).trim();
    const rowMonth = String(rows[i][1]).trim();
    const rowCategory = String(rows[i][2]).trim().toLowerCase();

    if ((data.id && rowId === String(data.id).trim()) || 
        (rowMonth === targetMonth && rowCategory === targetCat.toLowerCase())) {
      foundIndex = i + 1;
      break;
    }
  }

  if (foundIndex > 0) {
    // Update Sel Budget (Kolom D) dan Used (Kolom E)
    sheet.getRange(foundIndex, 4).setValue(budgetAmount);
    sheet.getRange(foundIndex, 5).setValue(usedAmount);
  } else {
    // [ A: ID | B: Month | C: Category | D: Budget | E: Used | F: CreatedAt ]
    sheet.appendRow([budgetId, targetMonth, targetCat, budgetAmount, usedAmount, formatTimestamp(now)]);
  }
}

function upsertGoal(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Goals');
  const rows = sheet.getDataRange().getDisplayValues();
  let found = false;
  const id = data.id || 'GOL_' + Date.now();
  const searchId = String(id).trim();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === searchId) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[data.goal, Number(data.target) || 0, Number(data.current) || 0, data.deadline || '']]);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow([id, data.goal, Number(data.target) || 0, Number(data.current) || 0, data.deadline || '', formatTimestamp(new Date())]);
  }
}

// HELPER: Format YYYY-MM
function formatYearMonth(d) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1);
}

// HELPER: Format YYYY-MM-DD
function formatDateString(dateVal) {
  if (!dateVal) return formatYearMonth(new Date()) + '-' + (new Date().getDate() < 10 ? '0' + new Date().getDate() : new Date().getDate());
  if (dateVal instanceof Date) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return dateVal.getFullYear() + '-' + pad(dateVal.getMonth() + 1) + '-' + pad(dateVal.getDate());
  }
  let str = String(dateVal).trim();
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

// HELPER: Format Timestamp (YYYY-MM-DD HH:mm:ss)
function formatTimestamp(d) {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return d.getFullYear() + '-' +
         pad(d.getMonth() + 1) + '-' +
         pad(d.getDate()) + ' ' +
         pad(d.getHours()) + ':' +
         pad(d.getMinutes()) + ':' +
         pad(d.getSeconds());
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}