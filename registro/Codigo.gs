/**
 * Registro central – Georgalos · Huella de Carbono
 *
 * Pegar este código en la planilla de Google: Extensiones → Apps Script.
 * Instrucciones completas en registro/README.md del repositorio.
 *
 * Hojas que crea solo:
 *   "Plantas"   → una fila por planta y período, con el último estado (resumen + datos completos).
 *   "Historial" → una fila por cada guardado o baja, con fecha y usuario (no se borra nunca).
 */

// Cambiá este código antes de publicar. Es el que cada usuario carga en Configuración de la app.
const CODIGO_ACCESO = 'CAMBIAR-ESTE-CODIGO';

const HOJA_PLANTAS = 'Plantas';
const HOJA_HISTORIAL = 'Historial';

const COLS_PLANTAS = [
  'ID', 'Planta y período', 'Descripción',
  'Alcance 1 (t CO2e)', 'Alcance 2 (t CO2e)', 'Alcance 3 (t CO2e)', 'Total (t CO2e)',
  'Producción (kg)', 'Intensidad (kg CO2e/kg)',
  'Última actualización', 'Actualizado por', 'Datos (JSON)',
];
const COLS_HISTORIAL = [
  'Fecha', 'Usuario', 'Acción', 'ID', 'Planta y período', 'Total (t CO2e)', 'Datos (JSON)',
];

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.key !== CODIGO_ACCESO) return salida({ ok: false, error: 'clave' });
    return salida({ ok: true, plants: listarPlantas() });
  } catch (err) {
    return salida({ ok: false, error: 'Error en el script: ' + err });
  }
}

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return salida({ ok: false, error: 'json' });
  }
  if (datos.key !== CODIGO_ACCESO) return salida({ ok: false, error: 'clave' });

  // Si otro dispositivo está guardando, se espera hasta 25 s; si no se libera, la app reintenta.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return salida({ ok: false, error: 'ocupado' });
  try {
    const usuario = String(datos.user || '').slice(0, 100);
    if (datos.action === 'upsert' && datos.plant && datos.plant.id) {
      guardarPlanta(datos.plant, datos.summary || {}, usuario);
      return salida({ ok: true, savedAt: new Date().toISOString() });
    }
    if (datos.action === 'delete' && datos.id) {
      borrarPlanta(String(datos.id), usuario);
      return salida({ ok: true });
    }
    return salida({ ok: false, error: 'accion' });
  } catch (err) {
    return salida({ ok: false, error: 'Error en el script: ' + err });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Prueba manual: en el editor elegí "probarRegistro" en la lista de funciones y tocá Ejecutar.
 * Si en el registro de ejecución aparece "OK", el script y la planilla funcionan.
 */
function probarRegistro() {
  const n = listarPlantas().length;
  Logger.log('OK – plantas en el registro: ' + n);
}

// ---------- Lógica ----------

function hoja(nombre, columnas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) {
    sh = ss.insertSheet(nombre);
    sh.getRange(1, 1, 1, columnas.length).setValues([columnas])
      .setFontWeight('bold').setBackground('#6a2c91').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function filaDe(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return -1;
}

const t = (kg) => (typeof kg === 'number' && isFinite(kg) ? Math.round(kg / 10) / 100 : '');

function guardarPlanta(planta, resumen, usuario) {
  const sh = hoja(HOJA_PLANTAS, COLS_PLANTAS);
  const ahora = new Date();
  planta.updatedBy = usuario || planta.updatedBy || '';
  const json = JSON.stringify(planta);
  const fila = [
    planta.id, planta.name || '', planta.description || '',
    t(resumen.a1), t(resumen.a2), t(resumen.a3), t(resumen.total),
    typeof resumen.production === 'number' ? resumen.production : '',
    typeof resumen.intensity === 'number' ? Math.round(resumen.intensity * 10000) / 10000 : '',
    ahora, planta.updatedBy, json,
  ];
  const r = filaDe(sh, planta.id);
  if (r > 0) sh.getRange(r, 1, 1, fila.length).setValues([fila]);
  else sh.appendRow(fila);

  hoja(HOJA_HISTORIAL, COLS_HISTORIAL).appendRow([
    ahora, usuario, r > 0 ? 'Actualización' : 'Alta', planta.id, planta.name || '', t(resumen.total), json,
  ]);
}

function borrarPlanta(id, usuario) {
  const sh = hoja(HOJA_PLANTAS, COLS_PLANTAS);
  const r = filaDe(sh, id);
  let nombre = '';
  let json = '';
  if (r > 0) {
    nombre = sh.getRange(r, 2).getValue();
    json = sh.getRange(r, COLS_PLANTAS.length).getValue();
    sh.deleteRow(r);
  }
  hoja(HOJA_HISTORIAL, COLS_HISTORIAL).appendRow([new Date(), usuario, 'Baja', id, nombre, '', json]);
}

function listarPlantas() {
  const sh = hoja(HOJA_PLANTAS, COLS_PLANTAS);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const valores = sh.getRange(2, 1, n - 1, COLS_PLANTAS.length).getValues();
  const plantas = [];
  valores.forEach(function (v) {
    try {
      const p = JSON.parse(v[COLS_PLANTAS.length - 1]);
      if (p && p.id) plantas.push(p);
    } catch (err) {
      // fila editada a mano con JSON inválido: se ignora
    }
  });
  return plantas;
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
