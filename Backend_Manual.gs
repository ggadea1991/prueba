/* -------------------------------------------------------------------------- */
/* MODULO: MANUALES                                                           */
/* -------------------------------------------------------------------------- */

function api_addManualEntry(obj) {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEETS.VALES);

  if (!sheet) throw new Error("Falta hoja: " + SHEETS.VALES);

  // Buscar índices dinámicamente
  const colFecha = findHeaderIndex(sheet, ['Fecha']);
  const colConcepto = findHeaderIndex(sheet, ['Concepto']);
  const colImporte = findHeaderIndex(sheet, ['Importe']);
  const colObs = findHeaderIndex(sheet, ['Observaciones', 'Obs']);
  const colUser = findHeaderIndex(sheet, ['Usuario']);
  const colRendido = findHeaderIndex(sheet, ['Rendido']);

  const newRow = new Array(sheet.getLastColumn()).fill('');

  let importeFinal = Number(obj.amount);
  // Regla de negocio: VALE resta, INGRESO suma
  if (obj.type === 'VALE' && importeFinal > 0) importeFinal = -importeFinal;

  if(colFecha > 0) newRow[colFecha-1] = new Date();
  if(colConcepto > 0) newRow[colConcepto-1] = obj.type;
  if(colImporte > 0) newRow[colImporte-1] = importeFinal;
  if(colObs > 0) newRow[colObs-1] = obj.obs;
  if(colUser > 0) newRow[colUser-1] = String(obj.operatorId).trim();
  if(colRendido > 0) newRow[colRendido-1] = 'no';

  sheet.appendRow(newRow);
}

// NUEVA FUNCIÓN NECESARIA PARA EL DASHBOARD
function api_getManualEntries(operatorId) {
  const data = getSheetDataAsObjects(SHEETS.VALES);
  const opId = String(operatorId).trim();

  return data.filter(r => String(r['Usuario']).trim() === opId)
    .map(r => ({
      date: r['Fecha'],
      type: r['Concepto'],
      amount: r['Importe'],
      obs: r['Observaciones'] || r['Obs'],
      rendido: r['Rendido']
    }))
    .reverse();
}
