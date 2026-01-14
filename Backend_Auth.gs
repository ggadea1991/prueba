/* -------------------------------------------------------------------------- */
/* AUTH & SESIONES (CORREGIDO)                                                */
/* -------------------------------------------------------------------------- */

function api_getOperators() {
  const ss = getDb(); // Ahora llama al getDb local de Utils
  const sheet = ss.getSheetByName(SHEETS.OPERADORES);

  if (!sheet) throw new Error(`ERROR CRÍTICO: No existe la hoja '${SHEETS.OPERADORES}'. Revisa el nombre en el Excel.`);

  // 1. Intentamos buscar las columnas con MUCHAS variantes
  const colId = findHeaderIndex(sheet, [
    'ID_Usuario', 'ID Usuario', 'IdUsuario', 'ID', 'UsuarioID', 'Legajo', 'Codigo', 'User ID', 'Identificador'
  ]);

  const colNombre = findHeaderIndex(sheet, [
    'Nombre', 'Nombre Completo', 'Nombre y Apellido', 'Operador', 'Apellido', 'Name', 'Full Name', 'Usuario'
  ]);

  // 2. Si falla, lanzamos un error descriptivo con lo que vio el script
  if (colId === -1 || colNombre === -1) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].join(' | ');
    throw new Error(`No encuentro columnas de Operador. Busqué 'ID' y 'Nombre'. \nEncabezados encontrados: [ ${headers} ]`);
  }

  const data = sheet.getDataRange().getValues();

  // 3. Mapeo seguro
  const operators = data.slice(1).map(r => {
    const idVal = r[colId-1];
    const nameVal = r[colNombre-1];

    return {
      id: idVal ? String(idVal).trim() : '',
      fullName: nameVal ? String(nameVal).trim() : '',
      role: 'OPERATOR'
    };
  }).filter(o => o.id !== '' && o.fullName !== ''); // Filtrar filas vacías

  if (operators.length === 0) {
    throw new Error("La hoja 'Base_Operadores' tiene columnas correctas pero NO tiene datos (filas vacías).");
  }

  return operators;
}

function api_getActiveSession(operatorId) {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEETS.CONTROL_CAJA);
  const opId = String(operatorId).trim();

  // Buscar columnas flexibles
  const colUser = findHeaderIndex(sheet, ['Usuario', 'User', 'Operador', 'ID_Usuario']);
  const colCierre = findHeaderIndex(sheet, ['Cierre', 'Fecha Cierre', 'Fin']);
  const colApertura = findHeaderIndex(sheet, ['Apertura', 'Inicio', 'Fecha']);

  if (colUser === -1) return null;

  const data = sheet.getDataRange().getValues();

  // Buscar sesión abierta (Cierre vacío)
  for(let i = data.length - 1; i >= 1; i--) {
     const rowUser = String(data[i][colUser-1]).trim();
     const rowClose = data[i][colCierre-1];

     if (rowUser === opId && (!rowClose || rowClose === "")) {
       return {
         id: i + 1,
         operatorId: rowUser,
         openedAt: colApertura > 0 ? data[i][colApertura-1] : new Date(),
         active: true
       };
     }
  }
  return null;
}

function api_openSession(operatorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const active = api_getActiveSession(operatorId);
    if (active) return active;

    const ss = getDb();
    const sheet = ss.getSheetByName(SHEETS.CONTROL_CAJA);
    const colUser = findHeaderIndex(sheet, ['Usuario', 'User']);
    const colApertura = findHeaderIndex(sheet, ['Apertura', 'Inicio']);

    if (colUser === -1 || colApertura === -1) throw new Error("Faltan columnas en Control_Caja");

    const newRow = new Array(sheet.getLastColumn()).fill('');
    newRow[colUser-1] = String(operatorId).trim();
    newRow[colApertura-1] = new Date();

    sheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return api_getActiveSession(operatorId);
  } finally {
    lock.releaseLock();
  }
}

function api_closeSession(operatorId, finalBalance) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const session = api_getActiveSession(operatorId);
    if (!session) throw new Error("No hay sesión abierta.");

    const ss = getDb();
    const sheet = ss.getSheetByName(SHEETS.CONTROL_CAJA);
    const colCierre = findHeaderIndex(sheet, ['Cierre']);
    const colSaldo = findHeaderIndex(sheet, ['Saldo Final', 'Saldo', 'Monto Cierre']);

    if (colCierre > 0) sheet.getRange(session.id, colCierre).setValue(new Date());
    if (colSaldo > 0) sheet.getRange(session.id, colSaldo).setValue(Number(finalBalance));

    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}
