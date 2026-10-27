import type { Organization, ModuleInstance } from '../types';
import { MODULE_CATALOG } from './moduleCatalog';

export interface Footprint {
  /** kg CO₂e */
  total: number;
  byScope: { 1: number; 2: number; 3: number };
  /** kg CO₂e por id de módulo */
  byModule: Record<string, number>;
  /** kg producidos (0 si no se cargó) */
  production: number;
  /** kg CO₂e por kg producido (null si no hay producción) */
  intensity: number | null;
}

export function moduleCO2(mod: ModuleInstance, org: Organization): number {
  const def = MODULE_CATALOG[mod.defId];
  if (!def) return 0;
  const r = def.calculateCO2(mod.value, mod.submoduleValues, org.country);
  return Number.isFinite(r) ? r : 0;
}

export function computeFootprint(org: Organization): Footprint {
  const byScope = { 1: 0, 2: 0, 3: 0 };
  const byModule: Record<string, number> = {};
  let production = 0;

  for (const mod of org.modules) {
    const def = MODULE_CATALOG[mod.defId];
    if (!def) continue;
    if (def.scope === 0) {
      if (def.id === 'produccion') production += Math.max(0, mod.value || 0);
      continue;
    }
    const kg = moduleCO2(mod, org);
    byScope[def.scope] += kg;
    byModule[def.id] = (byModule[def.id] || 0) + kg;
  }

  const total = byScope[1] + byScope[2] + byScope[3];
  return { total, byScope, byModule, production, intensity: production > 0 ? total / production : null };
}

/** Formatea kg CO₂e mostrando toneladas cuando conviene. */
export function formatCO2(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} t CO₂e`;
  }
  return `${kg.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg CO₂e`;
}

export function formatNumber(n: number, digits = 2): string {
  return n.toLocaleString('es-AR', { maximumFractionDigits: digits });
}
