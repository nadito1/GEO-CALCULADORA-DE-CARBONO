/**
 * Sincronización con el registro central (planilla de Google vía Apps Script).
 *
 * - Cada cambio en una planta se envía al registro (con un pequeño retardo para agrupar cambios).
 * - Al abrir la app, al volver a ella y cada 2 minutos se traen los datos de todas las plantas.
 * - Si se trabaja sin conexión, los cambios quedan pendientes y se envían en la próxima sincronización.
 *
 * Las solicitudes van como text/plain para evitar el "preflight" CORS, que Apps Script no admite.
 */
import { signal } from '@preact/signals';
import { REGISTRO_URL } from './config';
import {
  organizations,
  onOrganizationChange,
  markSynced,
  replaceOrganizations,
  sanitizeOrganizations,
} from './store';
import { computeFootprint } from './data/footprint';
import type { Organization } from './types';

// ---------- Configuración guardada en el dispositivo ----------
const CFG_KEY = 'geo-carbono-registro';
const PENDING_DELETES_KEY = 'geo-carbono-bajas-pendientes';

export interface SyncConfig {
  url: string;
  code: string;
  user: string;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin almacenamiento
  }
}

function loadConfig(): SyncConfig {
  const cfg = readJSON<SyncConfig>(CFG_KEY, { url: REGISTRO_URL, code: '', user: '' });
  // Si el usuario no cargó una URL propia, se usa la del registro oficial.
  return { ...cfg, url: cfg.url || REGISTRO_URL };
}

export const syncConfig = signal<SyncConfig>(loadConfig());

export function saveSyncConfig(cfg: SyncConfig) {
  syncConfig.value = { url: cfg.url.trim() || REGISTRO_URL, code: cfg.code.trim(), user: cfg.user.trim() };
  writeJSON(CFG_KEY, syncConfig.value);
  if (isConfigured()) void syncNow();
  else syncState.value = { state: 'off' };
}

export function isConfigured(): boolean {
  const { url, code } = syncConfig.value;
  return (/^https:\/\//.test(url) || /^http:\/\/localhost[:/]/.test(url)) && code.length > 0;
}

// ---------- Estado visible ----------
export type SyncStateName = 'off' | 'syncing' | 'ok' | 'error';
export const syncState = signal<{ state: SyncStateName; message?: string; last?: string }>({ state: 'off' });

const later = (a: string, b?: string) => (b && b > a ? b : a);

// ---------- Llamadas al registro ----------
interface ApiResponse {
  ok: boolean;
  error?: string;
  plants?: unknown[];
  savedAt?: string;
}

async function call(payload: Record<string, unknown> | null): Promise<ApiResponse> {
  const { url, code, user } = syncConfig.value;
  let res: Response;
  if (payload === null) {
    const u = `${url}${url.includes('?') ? '&' : '?'}action=list&key=${encodeURIComponent(code)}`;
    res = await fetch(u, { method: 'GET', redirect: 'follow' });
  } else {
    res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, key: code, user }),
    });
  }
  if (!res.ok) throw new Error(`El registro respondió con error (HTTP ${res.status})`);
  let data: ApiResponse;
  try {
    data = (await res.json()) as ApiResponse;
  } catch {
    throw new Error('El registro no devolvió datos válidos. Revisá la implementación del script.');
  }
  if (!data.ok) {
    if (data.error === 'clave') throw new Error('Código de acceso incorrecto');
    if (data.error === 'ocupado') throw new Error('El registro está ocupado, se reintenta en unos segundos');
    throw new Error(data.error || 'Error del registro');
  }
  return data;
}

/** Traduce errores de red ("Failed to fetch") a un mensaje entendible. */
function describeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (!navigator.onLine) return 'Sin conexión a internet: los cambios se envían cuando vuelva la señal';
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return 'No se pudo conectar con el registro de Google (la red puede estar bloqueando script.google.com, o el script falló)';
  }
  return msg;
}

function summary(org: Organization) {
  const fp = computeFootprint(org);
  return {
    a1: fp.byScope[1],
    a2: fp.byScope[2],
    a3: fp.byScope[3],
    total: fp.total,
    production: fp.production,
    intensity: fp.intensity,
  };
}

async function pushOrg(org: Organization) {
  const { syncedAt, ...plant } = org;
  void syncedAt;
  const data = await call({ action: 'upsert', plant: { ...plant, updatedBy: syncConfig.value.user }, summary: summary(org) });
  void data;
  markSynced(org.id, later(new Date().toISOString(), org.updatedAt));
}

function pendingDeletes(): { id: string; name: string }[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_DELETES_KEY) || '[]');
  } catch {
    return [];
  }
}
function setPendingDeletes(list: { id: string; name: string }[]) {
  writeJSON(PENDING_DELETES_KEY, list);
}

// ---------- Sincronización completa ----------
let running: Promise<void> | null = null;
let again = false;

export function syncNow(): Promise<void> {
  if (!isConfigured()) {
    syncState.value = { state: 'off' };
    return Promise.resolve();
  }
  if (running) {
    // Ya hay una sincronización en curso: se repite al terminar para tomar los cambios nuevos.
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      await doSync();
    } while (again && syncState.value.state !== 'error');
  })().finally(() => {
    running = null;
  });
  return running;
}

async function doSync() {
  syncState.value = { ...syncState.value, state: 'syncing' };
  try {
    // 1. Bajas pendientes (se sacan de la lista de a una, así no se pierde ninguna que llegue mientras tanto)
    let next: { id: string; name: string } | undefined;
    while ((next = pendingDeletes()[0])) {
      await call({ action: 'delete', id: next.id, name: next.name });
      const done = next.id;
      setPendingDeletes(pendingDeletes().filter(d => d.id !== done));
    }

    // 2. Traer todo del registro (sin lo que esté pendiente de baja)
    const data = await call(null);
    const stillDeleting = new Set(pendingDeletes().map(d => d.id));
    const remote = sanitizeOrganizations(data.plants || []).filter(o => !stillDeleting.has(o.id));
    const remoteById = new Map(remote.map(o => [o.id, o]));
    const now = new Date().toISOString();

    const merged: Organization[] = [];
    const toPush: Organization[] = [];

    for (const local of organizations.value) {
      const r = remoteById.get(local.id);
      const localPending = !local.syncedAt || (local.updatedAt || '') > local.syncedAt;
      if (r) {
        remoteById.delete(local.id);
        if (localPending && (local.updatedAt || '') > (r.updatedAt || '')) {
          merged.push(local);
          toPush.push(local);
        } else {
          merged.push({ ...r, syncedAt: later(now, r.updatedAt) });
        }
      } else if (local.syncedAt && !localPending) {
        // Estaba en el registro y ya no está: la borraron desde otro dispositivo.
        continue;
      } else {
        merged.push(local);
        toPush.push(local);
      }
    }
    for (const r of remoteById.values()) merged.push({ ...r, syncedAt: later(now, r.updatedAt) });

    replaceOrganizations(merged);

    // 3. Enviar lo pendiente
    for (const org of toPush) {
      const current = organizations.value.find(o => o.id === org.id);
      if (current) await pushOrg(current);
    }

    syncState.value = { state: 'ok', last: new Date().toISOString() };
  } catch (err) {
    syncState.value = { state: 'error', message: describeError(err), last: syncState.value.last };
    retryLater();
  }
}

/** Ante un error, reintenta en 20 s (además de la sincronización periódica). */
let retryTimer: ReturnType<typeof setTimeout> | null = null;
function retryLater() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void syncNow();
  }, 20_000);
}

// ---------- Envío automático de cambios ----------
let syncSoon: ReturnType<typeof setTimeout> | null = null;

/** Agrupa varios avisos seguidos (por ejemplo, muchas bajas de una importación) en una sola sincronización. */
function scheduleSync(delay = 300) {
  if (syncSoon) clearTimeout(syncSoon);
  syncSoon = setTimeout(() => {
    syncSoon = null;
    void syncNow();
  }, delay);
}

onOrganizationChange((orgId, deleted) => {
  if (deleted) {
    if (!isConfigured()) return;
    const list = pendingDeletes().filter(d => d.id !== orgId);
    list.push({ id: orgId, name: '' });
    setPendingDeletes(list);
    scheduleSync();
    return;
  }
  if (!isConfigured()) return;
  // Agrupa los cambios y los envía en una sola sincronización, de a una planta por vez.
  scheduleSync(1500);
});

/** Arranca la sincronización periódica. Se llama una vez al iniciar la app. */
export function startSync() {
  void syncNow();
  window.addEventListener('focus', () => void syncNow());
  window.addEventListener('online', () => void syncNow());
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow();
  }, 120_000);
}
