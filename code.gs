/* -------------------------------------------------------------------------- */
/* PUNTO DE ENTRADA (SOLO WEB APP)                                            */
/* Nota: La configuración DB_ID y SHEETS ahora vive en Backend_Utils.gs       */
/* -------------------------------------------------------------------------- */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Control Caja Enterprise v26')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
