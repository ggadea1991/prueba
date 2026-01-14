/* -------------------------------------------------------------------------- */
/* MODULO SAP (IMPORTACIÓN ROBUSTA 7268)                                      */
/* -------------------------------------------------------------------------- */

function parseSapReference(description, internalId) {
  const clean = String(description).trim();
  const res = { uniqueKey: '', type: 'OTROS', docId: '', soc: '', driver: '' };

  if (!clean) return null;

  if (clean.startsWith('GOCI')) {
    // GOCI:02631627-VC-FBU-2994
    const parts = clean.replace('GOCI:', '').split('-');
    res.docId = parts[0]?.trim();
    res.type = parts[1]?.trim();
    res.uniqueKey = `GOCI-${res.docId}-${res.type}`;
  } else if (clean.startsWith('KZ')) {
    // KZ: 515969-FBU-1480
    const parts = clean.replace('KZ:', '').split('-');
    res.docId = parts[0]?.trim();
    res.type = 'KZ';
    res.uniqueKey = `KZ-${res.docId}`;
  } else {
    // Fallback: Usamos ID del Excel + Hash de descripción
    res.type = 'GEN';
    res.uniqueKey = `GEN-${internalId}-${clean.substring(0,5)}`;
  }
  return res;
}

function api_importSapData(rows) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(30000); } catch(e) { throw new Error("Servidor ocupado. Reintenta."); }

  try {
    const ss = getDb();
    const sheet = ss.getSheetByName(SHEETS.SAP);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Mapeo Indices de la HOJA DE GOOGLE (Destino)
    const map = {
      idUnico: findHeaderIndex(sheet, ['ID_Unico']),
      fecha: findHeaderIndex(sheet, ['Fecha_Cont', 'Fecha']),
      ref: findHeaderIndex(sheet, ['Referencia']),
      monto: findHeaderIndex(sheet, ['Importe', 'Monto']),
      uOrig: findHeaderIndex(sheet, ['Usuario_Original']),
      uAsig: findHeaderIndex(sheet, ['Usuario_Asignado']),
      estado: findHeaderIndex(sheet, ['Estado']),
      nroComp: findHeaderIndex(sheet, ['Nro_Comprobante']),
      tipo: findHeaderIndex(sheet, ['Tipo_Comprobante'])
    };

    if (map.idUnico === -1) throw new Error("Error Crítico: Falta columna 'ID_Unico' en Google Sheets.");

    // Cache de IDs existentes
    const existingIds = new Set();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const dbIds = sheet.getRange(2, map.idUnico, lastRow - 1, 1).getValues();
      dbIds.forEach(r => existingIds.add(String(r[0])));
    }

    const newRows = [];

    // LECTURA DIRECTA DEL ARRAY (Input del Usuario)
    // Estructura Fija: [0:Id, 1:Fecha, 2:Desc, 3:Importe, 4:Usuario]

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const desc = String(row[2] || '').trim();
      const internalId = String(row[0] || '').trim();

      // Saltamos encabezados o filas de saldo
      if (desc === 'Descripción' || desc.toLowerCase().includes('saldo inicial')) continue;
      if (internalId === 'Id' || internalId === '') continue;

      // Parseamos
      const parsed = parseSapReference(desc, internalId);
      if (!parsed || existingIds.has(parsed.uniqueKey)) continue;

      // Validamos importe (Col 3)
      const importe = cleanImporte(row[3]);
      if (importe === 0 && !String(row[3]).match(/0/)) continue; // Si es 0 real ok, si es vacío saltar

      existingIds.add(parsed.uniqueKey);

      // Datos
      const fecha = parseSapDate(row[1]); // Col 1
      const usuario = row[4] ? String(row[4]).trim() : 'IPROSAP'; // Col 4

      // Asignación
      let status = 'PENDING';
      let assigned = '';
      if (usuario.toUpperCase() !== 'IPROSAP' && usuario.length > 2) {
        status = 'ASSIGNED';
        assigned = usuario.toLowerCase();
      }

      // Construir Fila
      const newRowData = new Array(sheet.getLastColumn()).fill('');
      const setVal = (idx, val) => { if (idx > 0) newRowData[idx-1] = val; };

      setVal(map.idUnico, parsed.uniqueKey);
      setVal(map.fecha, fecha);
      setVal(map.ref, desc);
      setVal(map.monto, importe);
      setVal(map.uOrig, usuario);
      setVal(map.uAsig, assigned);
      setVal(map.estado, status);
      setVal(map.nroComp, parsed.docId);
      setVal(map.tipo, parsed.type);

      newRows.push(newRowData);
    }

    // Escritura Batch
    if (newRows.length > 0) {
      sheet.getRange(lastRow + 1, 1, newRows.length, sheet.getLastColumn()).setValues(newRows);
      SpreadsheetApp.flush();
    }

    return newRows.length;

  } catch (e) {
    throw new Error("Backend Error: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function api_getSapMovements() {
  return getSheetDataAsObjects(SHEETS.SAP).map(r => ({
    id: r['ID_Unico'],
    amount: r['Importe'] || r['Monto'],
    originalUser: r['Usuario_Original'],
    status: r['Estado'],
    ref: r['Referencia'],
    assignedUser: r['Usuario_Asignado']
  })).reverse();
}

function api_claimMovement(id, opId) {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEETS.SAP);
  const data = sheet.getDataRange().getValues();
  const colId = findHeaderIndex(sheet, ['ID_Unico']);
  const colUser = findHeaderIndex(sheet, ['Usuario_Asignado']);
  const colEstado = findHeaderIndex(sheet, ['Estado']);

  for(let i=1; i<data.length; i++) {
    if(String(data[i][colId-1]) === String(id)) {
      sheet.getRange(i+1, colUser).setValue(String(opId).trim());
      sheet.getRange(i+1, colEstado).setValue('ASSIGNED');
      return true;
    }
  }
}
