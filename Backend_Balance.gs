/* -------------------------------------------------------------------------- */
/* MODULO: CÁLCULO DE BALANCE                                                 */
/* -------------------------------------------------------------------------- */

function api_calculateBalance(operatorId, sessionDate) {
  const opId = String(operatorId).trim();
  const sessionStart = new Date(sessionDate);

  // Inicializar totales
  let breakdown = {
    sap: 0,
    transfersIn: 0,
    transfersOut: 0,
    manualIn: 0,
    manualOut: 0
  };

  // 1. MOVIMIENTOS SAP ASIGNADOS
  const sapMovements = getSheetDataAsObjects(SHEETS.SAP);
  sapMovements.forEach(row => {
    const assignedUser = String(row['Usuario_Asignado'] || '').trim();
    const estado = String(row['Estado'] || '').trim();

    if (assignedUser === opId && estado === 'ASSIGNED') {
      const amount = Number(row['Importe'] || row['Monto'] || 0);
      breakdown.sap += amount;
    }
  });

  // 2. TRANSFERENCIAS
  const transfers = getSheetDataAsObjects(SHEETS.TRANSFERENCIAS);
  transfers.forEach(row => {
    const estado = String(row['Estado'] || '').trim();
    const fechaEnvio = row['Fecha Envío'];

    // Solo contar transferencias aceptadas después de la apertura de sesión
    if (estado === 'ACEPTADA' && fechaEnvio && new Date(fechaEnvio) >= sessionStart) {
      const origen = String(row['Origen'] || '').trim();
      const destino = String(row['Destino'] || '').trim();
      const amount = Number(row['Importe'] || 0);

      // Recibidas
      if (destino === opId) {
        breakdown.transfersIn += amount;
      }
      // Enviadas
      if (origen === opId) {
        breakdown.transfersOut += amount;
      }
    }
  });

  // 3. MOVIMIENTOS MANUALES (Vales e Ingresos)
  const manuals = getSheetDataAsObjects(SHEETS.VALES);
  manuals.forEach(row => {
    const usuario = String(row['Usuario'] || '').trim();
    const fecha = row['Fecha'];

    // Solo contar movimientos de este operador después de la apertura
    if (usuario === opId && fecha && new Date(fecha) >= sessionStart) {
      const amount = Number(row['Importe'] || 0);

      if (amount > 0) {
        breakdown.manualIn += amount;
      } else {
        breakdown.manualOut += Math.abs(amount);
      }
    }
  });

  // CALCULAR TOTAL
  const total = breakdown.sap
                + breakdown.transfersIn
                - breakdown.transfersOut
                + breakdown.manualIn
                - breakdown.manualOut;

  return {
    total: total,
    breakdown: breakdown
  };
}
