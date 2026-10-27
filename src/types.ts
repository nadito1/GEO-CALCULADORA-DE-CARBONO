import type { CountryCode } from './data/factors';

/**
 * Alcances del GHG Protocol:
 * 1 = emisiones directas (combustibles, refrigerantes)
 * 2 = energía eléctrica comprada
 * 3 = cadena de valor (traslados del personal, viajes, residuos)
 * 0 = dato informativo, no suma emisiones (ej. producción)
 */
export type Scope = 0 | 1 | 2 | 3;

export interface SubmoduleDef {
  id: string;
  title: string;
  /** Unidad propia del campo; si falta se usa la del módulo. */
  unit?: string;
  /** Título de sección para agrupar campos en el formulario. */
  group?: string;
  /** Valor inicial al agregar el módulo. */
  default?: number;
  /** Ayuda corta debajo del campo. */
  hint?: string;
}

export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  unit: string;
  icon: string;
  scope: Scope;
  /** Etiqueta de categoría (ej. "Alcance 3 – Cat. 7"). */
  category?: string;
  submodules?: SubmoduleDef[];
  calculateCO2: (value: number, submoduleValues: Record<string, number> | undefined, country: CountryCode) => number;
}

export interface ModuleInstance {
  id: string;
  defId: string;
  value: number;
  submoduleValues?: Record<string, number>;
}

/** Una planta (en el código heredado se llama "organización"). */
export interface Organization {
  id: string;
  name: string;
  description?: string;
  country: CountryCode;
  modules: ModuleInstance[];
}
