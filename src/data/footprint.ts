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

// ---------- Períodos ----------
// Una carga tiene período "AAAA-MM". Un filtro puede ser "" (todo), "AAAA" (año) o "AAAA-MM" (mes).

export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function matchesPeriod(period: string | undefined, filter: string): boolean {
  if (!filter) return true;
  if (!period) return false;
  return filter.length === 4 ? period.startsWith(filter + '-') : period === filter;
}

/** "2026-03" → "mar 2026"; "2026" → "2026"; "" → "Todo el período"; sin período → "Sin mes". */
export function formatPeriod(p: string | undefined, long = false): string {
  if (p === '') return 'Todo el período';
  if (!p) return 'Sin mes';
  if (p.length === 4) return p;
  const [y, m] = p.split('-');
  const i = Number(m) - 1;
  return `${(long ? MONTHS_LONG : MONTHS_SHORT)[i] ?? m} ${y}`;
}

/** Meses con cargas, ordenados del más viejo al más nuevo. */
export function periodsOf(orgs: Organization[]): string[] {
  const set = new Set<string>();
  orgs.forEach(o => o.modules.forEach(m => m.period && set.add(m.period)));
  return [...set].sort();
}

/** Opciones de filtro: todo, cada año y cada mes (más nuevo primero). */
export function periodOptions(orgs: Organization[]): { value: string; label: string }[] {
  const months = periodsOf(orgs);
  const years = [...new Set(months.map(m => m.slice(0, 4)))].sort().reverse();
  return [
    { value: '', label: 'Todo el período' },
    ...years.flatMap(y => [
      { value: y, label: `Año ${y}` },
      ...months.filter(m => m.startsWith(y)).reverse().map(m => ({ value: m, label: `   ${formatPeriod(m, true)}` })),
    ]),
  ];
}

// ---------- Cálculo ----------

export function moduleCO2(mod: ModuleInstance, org: Organization): number {
  const def = MODULE_CATALOG[mod.defId];
  if (!def) return 0;
  const r = def.calculateCO2(mod.value, mod.submoduleValues, org.country);
  return Number.isFinite(r) ? r : 0;
}

/** Huella de una planta; con `filter` solo cuenta las cargas de ese mes o año. */
export function computeFootprint(org: Organization, filter = ''): Footprint {
  const byScope = { 1: 0, 2: 0, 3: 0 };
  const byModule: Record<string, number> = {};
  let production = 0;

  for (const mod of org.modules) {
    if (!matchesPeriod(mod.period, filter)) continue;
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

/** Serie mensual (para el gráfico de evolución) de una o varias plantas, filtrada por año si se indica. */
export function monthlySeries(orgs: Organization[], filter = '') {
  const months = periodsOf(orgs).filter(m => matchesPeriod(m, filter.length === 7 ? filter.slice(0, 4) : filter));
  return months.map(m => {
    const fps = orgs.map(o => computeFootprint(o, m));
    const sum = (f: (x: Footprint) => number) => fps.reduce((a, x) => a + f(x), 0);
    const total = sum(x => x.total);
    const production = sum(x => x.production);
    return {
      period: m,
      label: formatPeriod(m),
      a1: sum(x => x.byScope[1]),
      a2: sum(x => x.byScope[2]),
      a3: sum(x => x.byScope[3]),
      total,
      production,
      intensity: production > 0 ? total / production : null,
    };
  });
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
