/* -------------------------------------------------------------------------- */
/*                          MODULO: TRANSFERENCIAS                            */
/* -------------------------------------------------------------------------- */

const COLS_TRANS = {
  ID: 'ID',
  TIPO: 'Tipo',
  ORIGEN: 'Origen',
  DESTINO: 'Destino',
  IMPORTE: 'Importe',
  MOTIVO: 'Motivo',
  ESTADO: 'Estado',
  FECHA_ENVIO: 'Fecha Envío',
  FECHA_RES: 'Fecha Res.',
  USUARIO_RES: 'Usuario Res.'
};

function api_getTransfers() {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEETS.TRANSFERENCIAS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim());

  // Buscar índices exactos
  const idx = {
    id: headers.indexOf(COLS_TRANS.ID),
    tipo: headers.indexOf(COLS_TRANS.TIPO),
    origen: headers.indexOf(COLS_TRANS.ORIGEN),
    destino: headers.indexOf(COLS_TRANS.DESTINO),
    imp: headers.indexOf(COLS_TRANS.IMPORTE),
    motivo: headers.indexOf(COLS_TRANS.MOTIVO),
    estado: headers.indexOf(COLS_TRANS.ESTADO),
    fechaEnv: headers.indexOf(COLS_TRANS.FECHA_ENVIO),
    fechaRes: headers.indexOf(COLS_TRANS.FECHA_RES),
    userRes: headers.indexOf(COLS_TRANS.USUARIO_RES)
  };

  if (idx.imp === -1 || idx.origen === -1 || idx.destino === -1) return [];

  return data.slice(1).map(row => ({
    id: idx.id > -1 ? row[idx.id] : '',
    type: idx.tipo > -1 ? row[idx.tipo] : 'Reparto',
    fromUser: idx.origen > -1 ? String(row[idx.origen]).trim() : '',
    toUser: idx.destino > -1 ? String(row[idx.destino]).trim() : '',
    amount: idx.imp > -1 ? Number(row[idx.imp]) : 0,
    reason: idx.motivo > -1 ? row[idx.motivo] : '',
    status: idx.estado > -1 ? row[idx.estado] : 'PENDIENTE',
    createdAt: idx.fechaEnv > -1 ? new Date(row[idx.fechaEnv]).toISOString() : new Date().toISOString()
  })).reverse();
}

function api_createTransfer(obj) {
  if (!obj.fromUser || !obj.toUser || !obj.amount) throw new Error("Faltan datos.");

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const ss = getDb();
    const sheet = ss.getSheetByName(SHEETS.TRANSFERENCIAS);

    // Mapeo dinámico por si cambian de orden, pero usando nombres exactos
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

    const getCol = (name) => headers.indexOf(name);

    // Array vacío
    const newRow = new Array(headers.length).fill('');
    const uuid = Utilities.getUuid();
    const now = new Date();

    const setVal = (name, val) => {
      const i = getCol(name);
      if(i > -1) newRow[i] = val;
    };

    setVal(COLS_TRANS.ID, uuid);
    setVal(COLS_TRANS.TIPO, obj.type || 'Reparto');
    setVal(COLS_TRANS.ORIGEN, String(obj.fromUser).trim());
    setVal(COLS_TRANS.DESTINO, String(obj.toUser).trim());
    setVal(COLS_TRANS.IMPORTE, Number(obj.amount));
    setVal(COLS_TRANS.MOTIVO, obj.reason || '');
    setVal(COLS_TRANS.ESTADO, 'PENDIENTE');
    setVal(COLS_TRANS.FECHA_ENVIO, now);

    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return { success: true, id: uuid };

  } catch (e) {
    throw new Error("Error creando transferencia: " + e.message);
  } finally {
    lock.releaseLock();
  }
}

function api_acceptTransfer(id, operatorId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const ss = getDb();
    const sheet = ss.getSheetByName(SHEETS.TRANSFERENCIAS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());

    const idxId = headers.indexOf(COLS_TRANS.ID);
    const idxEstado = headers.indexOf(COLS_TRANS.ESTADO);
    const idxFechaRes = headers.indexOf(COLS_TRANS.FECHA_RES);
    const idxUserRes = headers.indexOf(COLS_TRANS.USUARIO_RES);

    if (idxId === -1 || idxEstado === -1) throw new Error("Error en estructura de hoja.");

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idxId]) === String(id)) {
        // Verificar que no esté ya aceptada
        if (data[i][idxEstado] === 'ACEPTADA') return true;

        sheet.getRange(i + 1, idxEstado + 1).setValue('ACEPTADA');

        if (idxFechaRes > -1) sheet.getRange(i + 1, idxFechaRes + 1).setValue(new Date());
        if (idxUserRes > -1 && operatorId) sheet.getRange(i + 1, idxUserRes + 1).setValue(String(operatorId).trim());

        SpreadsheetApp.flush();
        return true;
      }
    }
    throw new Error("Transferencia no encontrada.");
  } finally {
    lock.releaseLock();
  }
}
