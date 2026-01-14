/* -------------------------------------------------------------------------- */
/* CONFIGURACIÓN Y UTILIDADES (VERSIÓN FINAL BLINDADA)                        */
/* -------------------------------------------------------------------------- */

const DB_ID = '1G_Ye_gKtTGTlL4dtCQibL08sGK7Eo43WAGtGgN6MZwQ';

const SHEETS = {
  OPERADORES: 'Base_Operadores',
  CONTROL_CAJA: 'Control_Caja',
  TRANSFERENCIAS: 'Transferencias_Log',
  VALES: 'Vale_Manual',
  SAP: 'Base_Movimientos_SAP'
};

let _dbInstance = null;
function getDb() {
  if (!_dbInstance) {
    try { _dbInstance = SpreadsheetApp.openById(DB_ID); }
    catch (e) { throw new Error(`Error conectando a DB: ${DB_ID}`); }
  }
  return _dbInstance;
}

function findHeaderIndex(sheet, possibleNames) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return -1;
  const rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const cleanHeaders = rawHeaders.map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));

  for (const name of possibleNames) {
    const target = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
    const idx = cleanHeaders.findIndex(h => h === target || h.includes(target));
    if (idx !== -1) return idx + 1;
  }
  return -1;
}

function getSheetDataAsObjects(sheetName) {
  const ss = getDb();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 };
    headers.forEach((h, colIdx) => { if(h) obj[String(h).trim()] = row[colIdx]; });
    return obj;
  });
}

function cleanImporte(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim();
  let isNegative = false;
  if (s.includes('(') && s.includes(')')) { isNegative = true; s = s.replace(/[()]/g, ''); }
  if (s.startsWith('-')) { isNegative = true; s = s.replace('-', ''); }
  s = s.replace(/[$\sA-Za-z]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.indexOf(',') > -1) s = s.replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? 0 : (isNegative ? -Math.abs(num) : num);
}

function parseSapDate(val) {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  // Si es número (Serial Excel, ej: 45280)
  if (typeof val === 'number') {
    return new Date(Math.round((val - 25569)*86400*1000));
  }

  const s = String(val).trim();
  // Formato YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const y = s.substring(0,4), m = s.substring(4,6), d = s.substring(6,8);
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }
  // Intentar estándar
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date(); // Fallback a hoy si falla
  return d;
}
