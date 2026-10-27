import { signal, computed, effect } from "@preact/signals";
import type { Organization, ModuleInstance } from "./types";
import { normalizeCountry, type CountryCode } from "./data/factors";

const STORAGE_KEY = "geo-carbono-plantas";

/** Limpia datos leídos de disco o de un archivo importado. */
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

// 1. Load from LocalStorage
function loadInitial(): Organization[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? sanitizeOrganizations(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}
const initialOrgs: Organization[] = loadInitial();

// 2. Define Signals
export const organizations = signal<Organization[]>(initialOrgs);
export const activeOrgId = signal<string | null>(null);
export const currentView = signal<"orgs" | "dashboard" | "settings" | "stats" | "about">("orgs");

// 3. Auto-save to LocalStorage whenever 'organizations' changes
effect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(organizations.value));
  } catch {
    // Sin almacenamiento disponible (modo privado): la app sigue funcionando en memoria.
  }
});

// 4. Computed Helpers
export const activeOrg = computed(() => 
  organizations.value.find(o => o.id === activeOrgId.value) || null
);

// 5. Actions
export function addOrganization(name: string, description: string, country: CountryCode) {
  const newOrg: Organization = { 
    id: crypto.randomUUID(), 
    name, 
    description,
    country, 
    modules: [] 
  };
  organizations.value = [...organizations.value, newOrg];
}

export function selectOrganization(id: string | null) {
  activeOrgId.value = id;
  currentView.value = id ? "dashboard" : "orgs";
}

export function addModuleInstance(defId: string) {
  const currentOrgId = activeOrgId.value;
  if (!currentOrgId) return;

  // We update the signal immutably so the UI knows to re-render
  organizations.value = organizations.value.map(org => {
    if (org.id === currentOrgId) {
      return {
        ...org,
        modules: [
          ...org.modules,
          { id: crypto.randomUUID(), defId, value: 0, submoduleValues: {} }
        ]
      };
    }
    return org;
  });
}

export function addModuleInstanceWithValues(defId: string, value: number, submoduleValues?: Record<string, number>) {
  const currentOrgId = activeOrgId.value;
  if (!currentOrgId) return;

  // We update the signal immutably so the UI knows to re-render
  organizations.value = organizations.value.map(org => {
    if (org.id === currentOrgId) {
      return {
        ...org,
        modules: [
          ...org.modules,
          { id: crypto.randomUUID(), defId, value, submoduleValues: submoduleValues || {} }
        ]
      };
    }
    return org;
  });
}

export function updateModuleValue(moduleId: string, newValue: number) {
  const currentOrgId = activeOrgId.value;
  if (!currentOrgId) return;

  organizations.value = organizations.value.map(org => {
    if (org.id === currentOrgId) {
      return {
        ...org,
        modules: org.modules.map(mod => 
          mod.id === moduleId ? { ...mod, value: newValue } : mod
        )
      };
    }
    return org;
  });
}

export function updateModuleInstance(updatedModule: ModuleInstance) {
  const currentOrgId = activeOrgId.value;
  if (!currentOrgId) return;

  organizations.value = organizations.value.map(org => {
    if (org.id === currentOrgId) {
      return {
        ...org,
        modules: org.modules.map(mod => mod.id === updatedModule.id ? updatedModule : mod)
      };
    }
    return org;
  });
}

export function deleteModuleInstance(moduleId: string) {
  const currentOrgId = activeOrgId.value;
  if (!currentOrgId) return;

  organizations.value = organizations.value.map(org => {
    if (org.id === currentOrgId) {
      return {
        ...org,
        modules: org.modules.filter(mod => mod.id !== moduleId)
      };
    }
    return org;
  });
}

/**
 * Importa plantas desde un respaldo: las que tienen el mismo id se reemplazan,
 * las nuevas se agregan. Así se pueden consolidar archivos de varias plantas.
 * Devuelve cuántas plantas se agregaron y cuántas se actualizaron.
 */
export function mergeOrganizations(imported: Organization[]): { added: number; updated: number } {
  const byId = new Map(organizations.value.map(o => [o.id, o]));
  let added = 0;
  let updated = 0;
  for (const org of imported) {
    if (byId.has(org.id)) updated++;
    else added++;
    byId.set(org.id, org);
  }
  organizations.value = [...byId.values()];
  return { added, updated };
}

export function deleteOrganization(id: string) {
  organizations.value = organizations.value.filter(org => org.id !== id);
  if (activeOrgId.value === id) {
    selectOrganization(null);
  }
}