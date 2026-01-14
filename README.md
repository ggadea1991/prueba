# Caja Enterprise v26 - Sistema de Control de Caja

Sistema completo de gestión de tesorería y control de caja desarrollado en Google Apps Script + React.

## 🚀 Características

- ✅ **Gestión de Sesiones**: Apertura y cierre de turnos con arqueo
- 💰 **Cálculo Automático de Saldos**: Integración de movimientos SAP, transferencias y vales
- 📊 **Importación SAP**: Carga masiva de movimientos desde Excel
- 🔄 **Transferencias entre Operadores**: Sistema de envío y aceptación
- 📝 **Registros Manuales**: Vales e ingresos con seguimiento
- 🎨 **Interfaz Moderna**: UI con React y TailwindCSS

## 📋 Requisitos Previos

1. Cuenta de Google
2. Hoja de cálculo de Google Sheets con las siguientes pestañas:
   - `Base_Operadores` (columnas: ID_Usuario, Nombre)
   - `Control_Caja` (columnas: Usuario, Apertura, Cierre, Saldo Final)
   - `Base_Movimientos_SAP` (columnas: ID_Unico, Fecha_Cont, Referencia, Importe, Usuario_Original, Usuario_Asignado, Estado, Nro_Comprobante, Tipo_Comprobante)
   - `Transferencias_Log` (columnas: ID, Tipo, Origen, Destino, Importe, Motivo, Estado, Fecha Envío, Fecha Res., Usuario Res.)
   - `Vale_Manual` (columnas: Fecha, Concepto, Importe, Observaciones, Usuario, Rendido)

## 🔧 Instalación en Google Apps Script

### Paso 1: Obtener el ID de tu Google Sheet

1. Abrí tu Google Sheet
2. Copiá el ID de la URL (es la parte larga entre `/d/` y `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

### Paso 2: Crear el Proyecto en Apps Script

1. En tu Google Sheet, andá a **Extensiones > Apps Script**
2. Se abrirá el editor de Apps Script
3. Borrá el código por defecto del archivo `Code.gs`

### Paso 3: Subir los Archivos

Vas a crear los siguientes archivos en el editor de Apps Script:

#### 1. **Backend_Utils.gs**
- Click en el botón **+** al lado de "Archivos"
- Seleccioná **Secuencia de comandos**
- Nombralo: `Backend_Utils`
- Pegá el contenido del archivo `Backend_Utils.gs`
- **IMPORTANTE**: Reemplazá el `DB_ID` con el ID de tu Google Sheet:
  ```javascript
  const DB_ID = 'TU_ID_AQUI';
  ```

#### 2. **Backend_Auth.gs**
- Repetí el proceso anterior
- Nombre: `Backend_Auth`
- Pegá el contenido de `Backend_Auth.gs`

#### 3. **Backend_SAP.gs**
- Nombre: `Backend_SAP`
- Pegá el contenido de `Backend_SAP.gs`

#### 4. **Backend_Transfers.gs**
- Nombre: `Backend_Transfers`
- Pegá el contenido de `Backend_Transfers.gs`

#### 5. **Backend_Manual.gs**
- Nombre: `Backend_Manual`
- Pegá el contenido de `Backend_Manual.gs`

#### 6. **Backend_Balance.gs**
- Nombre: `Backend_Balance`
- Pegá el contenido de `Backend_Balance.gs`

#### 7. **Code.gs** (archivo principal)
- Usá el archivo `Code.gs` que ya existe
- Pegá el contenido del archivo `code.gs`

#### 8. **index.html**
- Click en el botón **+** al lado de "Archivos"
- Seleccioná **HTML**
- Nombralo: `index`
- Pegá el contenido del archivo `index.html`

### Paso 4: Configurar el Proyecto

1. En el editor, andá al ícono del **engranaje** (⚙️) en la barra lateral izquierda
2. Marcá la casilla **"Mostrar archivo de manifiesto "appsscript.json" en el editor"**
3. Ahora vas a ver el archivo `appsscript.json` en la lista de archivos
4. Reemplazá su contenido con el del archivo `appsscript.json`

### Paso 5: Implementar como Web App

1. En el editor de Apps Script, click en **Implementar > Nueva implementación**
2. Click en el ícono de **engranaje** ⚙️ al lado de "Seleccionar tipo"
3. Seleccioná **Aplicación web**
4. Configurá:
   - **Descripción**: "Caja Enterprise v26"
   - **Ejecutar como**: Tu cuenta (quien ejecuta)
   - **Quién tiene acceso**: Cualquier usuario (o "Solo yo" si preferís)
5. Click en **Implementar**
6. **Autorizá la aplicación** cuando te lo pida
7. Copiá la **URL de la aplicación web**

### Paso 6: Probar la Aplicación

1. Abrí la URL que te dió en el paso anterior
2. Deberías ver la pantalla de login con los operadores de tu base
3. Seleccioná un operador y empezá a usar el sistema

## 📁 Estructura del Proyecto

```
Caja-Enterprise-v26/
├── code.gs                  # Punto de entrada (doGet)
├── Backend_Utils.gs         # Configuración y utilidades
├── Backend_Auth.gs          # Autenticación y sesiones
├── Backend_SAP.gs           # Importación de movimientos SAP
├── Backend_Transfers.gs     # Gestión de transferencias
├── Backend_Manual.gs        # Movimientos manuales (vales)
├── Backend_Balance.gs       # Cálculo de balances
├── index.html               # Interfaz React
└── appsscript.json         # Configuración del proyecto
```

## 🔍 Solución de Problemas

### Error: "No existe la hoja"
- Verificá que los nombres de las pestañas coincidan exactamente con los definidos en `SHEETS` en `Backend_Utils.gs`

### Error: "No encuentro columnas"
- Verificá que las columnas en tu Google Sheet coincidan con los nombres esperados
- Revisá la consola de errores en Apps Script (Ver > Registros)

### La aplicación no carga
- Asegurate de haber autorizado todos los permisos
- Verificá que el `DB_ID` en `Backend_Utils.gs` sea correcto
- Revisá que todos los archivos estén guardados

### No aparecen operadores
- Verificá que la hoja `Base_Operadores` tenga datos
- Asegurate de tener las columnas `ID_Usuario` y `Nombre`

## 🆕 Actualizar la Aplicación

Cuando hagas cambios:

1. Guardá todos los archivos en el editor de Apps Script
2. Refrescá la página de tu Web App
3. Si hacés cambios estructurales, puede que necesites:
   - Ir a **Implementar > Administrar implementaciones**
   - Click en el ícono de **lápiz** ✏️
   - Cambiar a "Nueva versión"
   - Click en **Implementar**

## 📊 Formato del Excel para Importación SAP

El archivo Excel debe tener estas columnas (en orden):
1. **Id**: Identificador del movimiento
2. **Fecha**: Fecha del movimiento (puede ser DD/MM/YYYY o número serial)
3. **Descripción**: Referencia (ej: "GOCI:02631627-VC-FBU-2994")
4. **Importe**: Monto (puede tener formato de moneda)
5. **Usuario**: Asignado (ej: "IPROSAP" o nombre del operador)

## 👨‍💻 Desarrollo

Este proyecto usa:
- **Backend**: Google Apps Script (JavaScript V8)
- **Frontend**: React 18 + TailwindCSS
- **Base de datos**: Google Sheets
- **Excel parsing**: SheetJS (xlsx)

## 📄 Licencia

Proyecto interno - Todos los derechos reservados

## 🆘 Soporte

Para problemas o consultas, contactá al equipo de desarrollo.