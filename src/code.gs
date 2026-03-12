/**
 * code.gs — Google Apps Script Web App
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Refresh your Google Sheet to see the "Hexx Scraper" menu appear.
 * 5. Click "Hexx Scraper" -> "Initialize Sheets" to automatically create the styled tables.
 * 6. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Copy the Web App URL and paste it into the Scraper GUI Settings
 */

const DEFAULT_SHEETS = ["X_Posts", "Reddit_Posts"];

// ── CUSTOM MENU FOR INITIALIZATION ────────────────────────────
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Hexx Scraper')
      .addItem('Initialize Sheets', 'initializeSheets')
      .addToUi();
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  DEFAULT_SHEETS.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    let headers = [];
    if (sheetName === "X_Posts") {
      headers = [
        "URL", 
        "Likes", 
        "Replies", 
        "Reposts", 
        "Views", 
        "Last Updated", 
        "Status"
      ];
    } else {
      headers = [
        "URL", 
        "Likes", 
        "Comments", 
        "Shares", 
        "Views", 
        "Last Updated", 
        "Status"
      ];
    }
    
    // Set headers starting from column D
    const headerRange = sheet.getRange(1, 4, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Style headers
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1e293b"); // Slate Noir Surface color
    headerRange.setFontColor("#f1f5f9");  // Slate Noir Text color
    headerRange.setHorizontalAlignment("center");

    // Create and style the empty headers for A, B, C
    const emptyHeaderRange = sheet.getRange(1, 1, 1, 3);
    emptyHeaderRange.setBackground("#1e293b");
    
    // Freeze the top row so it stays visible when scrolling
    sheet.setFrozenRows(1);
    
    // Auto-resize columns for better fit
    sheet.autoResizeColumns(4, headers.length);
    // Give the URL column a bit more breathing room manually
    sheet.setColumnWidth(4, 300);
  });
  
  SpreadsheetApp.getUi().alert('Initialization Complete', `Created and styled sheets: ${DEFAULT_SHEETS.join(", ")}.`, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ── WEBHOOK ENDPOINTS ─────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheetName; // Optionally pass which sheet to read

  if (action === "getUrls") {
    return _getUrls(sheetName);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: "Unknown action. Use ?action=getUrls" })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  if (action === "writeResults") {
    return _writeResults(body.results, body.sheetName);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ error: "Unknown action. Send {action: 'writeResults', results: [...]}" })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ── GET: Return all URLs from Column D ────────────────────────
function _getUrls(targetSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // If a specific sheet is requested, get from there. Otherwise, get from all default sheets.
  const sheetsToScan = targetSheetName ? [targetSheetName] : DEFAULT_SHEETS;
  let allUrls = [];

  sheetsToScan.forEach(sName => {
    const sheet = ss.getSheetByName(sName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const range = sheet.getRange(2, 4, lastRow - 1, 1);
        const values = range.getValues();
        const urls = values.map(row => row[0]).filter(v => v && v.toString().trim());
        allUrls = allUrls.concat(urls);
      }
    }
  });

  // Deduplicate just in case
  const uniqueUrls = [...new Set(allUrls)];
  return _jsonResponse({ urls: uniqueUrls });
}

// ── POST: Write scraped results back to the sheet ─────────────
function _writeResults(results, targetSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let written = 0;

  for (const item of results) {
    const url = item.url;
    const status = item.status;
    const data = item.data || {};

    // Detect platform and determine which sheet to use
    const isReddit = url.includes("reddit.com");
    const platform = isReddit ? "Reddit" : "X";
    const sheetName = targetSheetName ? targetSheetName : (isReddit ? "Reddit_Posts" : "X_Posts");
    
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue; // Skip if sheet doesn't exist

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) continue; // No URLs to match against

    const urlRange = sheet.getRange(2, 4, lastRow - 1, 1).getValues();

    // Find the row matching this URL
    for (let i = 0; i < urlRange.length; i++) {
      if (urlRange[i][0].toString().trim() === url.trim()) {
        const row = i + 2; // offset for header + 0-index

        if (platform === "X") {
          sheet.getRange(row, 5).setValue(data.likes || "");      // E: Likes
          sheet.getRange(row, 6).setValue(data.replies || "");    // F: Replies
          sheet.getRange(row, 7).setValue(data.reposts || "");    // G: Reposts
        } else {
          sheet.getRange(row, 5).setValue(data.likes || data.upvotes || ""); // E: Likes/Upvotes
          sheet.getRange(row, 6).setValue(data.comments || "");   // F: Comments
          sheet.getRange(row, 7).setValue(data.shares || "");     // G: Shares
        }
        
        sheet.getRange(row, 8).setValue(data.views || "");         // H: Views
        sheet.getRange(row, 9).setValue(new Date());               // I: Last Updated
        sheet.getRange(row, 10).setValue(status === "ok" ? "✅ Done" : "❌ " + (item.error || "Failed"));  // J: Status

        written++;
        break;
      }
    }
  }

  return _jsonResponse({ written: written, total: results.length });
}

function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}