import { signal, computed, effect } from "@preact/signals";
import type { Organization, ModuleInstance } from "./types";
import { normalizeCountry, type CountryCode } from "./data/factors";

const STORAGE_KEY = "geo-carbono-plantas";

/** Limpia datos leídos de disco, del registro central o de un archivo importado. */
export function sanitizeOrganizations(data: unknown): Organization[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter((o): o is Organization => !!o && typeof o === "object" && typeof (o as Organization).id === "string")
    .map(o => ({
      ...o,
      name: String(o.name || "Planta sin nombre"),
      country: normalizeCountry(o.country),
      modules: Array.isArray(o.modules) ? o.modules : [],
    }));
}

function loadInitial(): Organization[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeOrganizations(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}

export const organizations = signal<Organization[]>(loadInitial());
export const activeOrgId = signal<string | null>(null);
export const currentView = signal<"orgs" | "dashboard" | "settings" | "stats" | "about">("orgs");

effect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(organizations.value));
  } catch {
    // Sin almacenamiento disponible (modo privado): la app sigue funcionando en memoria.
  }
});

export const activeOrg = computed(() =>
  organizations.value.find(o => o.id === activeOrgId.value) || null
);

// --- Aviso de cambios (lo usa la sincronización con el registro central) ---
type ChangeListener = (orgId: string, deleted: boolean) => void;
const listeners: ChangeListener[] = [];
export function onOrganizationChange(fn: ChangeListener) {
  listeners.push(fn);
}
function notify(orgId: string, deleted = false) {
  listeners.forEach(fn => fn(orgId, deleted));
}

/** Aplica un cambio a una planta, le pone fecha de actualización y avisa. */
function mutateOrg(orgId: string, fn: (org: Organization) => Organization) {
  let changed = false;
  organizations.value = organizations.value.map(org => {
    if (org.id !== orgId) return org;
    changed = true;
    return { ...fn(org), updatedAt: new Date().toISOString() };
  });
  if (changed) notify(orgId);
}

// --- Acciones ---
export function addOrganization(name: string, description: string, country: CountryCode) {
  const newOrg: Organization = {
    id: crypto.randomUUID(),
    name,
    description,
    country,
    modules: [],
    updatedAt: new Date().toISOString(),
  };
  organizations.value = [...organizations.value, newOrg];
  notify(newOrg.id);
}

export function selectOrganization(id: string | null) {
  activeOrgId.value = id;
  currentView.value = id ? "dashboard" : "orgs";
}

export function addModuleInstanceWithValues(defId: string, value: number, submoduleValues?: Record<string, number>) {
  const orgId = activeOrgId.value;
  if (!orgId) return;
  mutateOrg(orgId, org => ({
    ...org,
    modules: [...org.modules, { id: crypto.randomUUID(), defId, value, submoduleValues: submoduleValues || {} }],
  }));
}

export function updateModuleInstance(updatedModule: ModuleInstance) {
  const orgId = activeOrgId.value;
  if (!orgId) return;
  mutateOrg(orgId, org => ({
    ...org,
    modules: org.modules.map(mod => (mod.id === updatedModule.id ? updatedModule : mod)),
  }));
}

export function deleteModuleInstance(moduleId: string) {
  const orgId = activeOrgId.value;
  if (!orgId) return;
  mutateOrg(orgId, org => ({ ...org, modules: org.modules.filter(mod => mod.id !== moduleId) }));
}

/** Marca una planta como sincronizada sin disparar un nuevo envío. */
export function markSynced(orgId: string, at: string) {
  organizations.value = organizations.value.map(o => (o.id === orgId ? { ...o, syncedAt: at } : o));
}

/** Reemplaza el listado completo (lo usa la sincronización al traer datos del registro). */
export function replaceOrganizations(list: Organization[]) {
  organizations.value = list;
  if (activeOrgId.value && !list.some(o => o.id === activeOrgId.value)) selectOrganization(null);
}

/**
 * Importa plantas desde un respaldo: las que tienen el mismo id se reemplazan,
 * las nuevas se agregan. Así se pueden consolidar archivos de varias plantas.
 */
export function mergeOrganizations(imported: Organization[]): { added: number; updated: number } {
  const byId = new Map(organizations.value.map(o => [o.id, o]));
  let added = 0;
  let updated = 0;
  const now = new Date().toISOString();
  for (const org of imported) {
    if (byId.has(org.id)) updated++;
    else added++;
    byId.set(org.id, { ...org, updatedAt: now, syncedAt: undefined });
  }
  organizations.value = [...byId.values()];
  imported.forEach(o => notify(o.id));
  return { added, updated };
}

export function deleteOrganization(id: string) {
  organizations.value = organizations.value.filter(org => org.id !== id);
  if (activeOrgId.value === id) selectOrganization(null);
  notify(id, true);
}
