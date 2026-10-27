import type { ModuleDef, Scope, SubmoduleDef } from '../types';
import {
  FACTORS,
  fuelFactor,
  gridFactor,
  refrigerantGwp,
  transportFactor,
  wasteFactor,
  type CountryCode,
  type FuelKey,
  type RefrigerantKey,
  type TransportKey,
  type WasteKey,
} from './factors';

const AR = FACTORS.ar;

const v = (sub: Record<string, number> | undefined, key: string) => Math.max(0, Number(sub?.[key]) || 0);

const fuelSub = (key: FuelKey): SubmoduleDef => ({
  id: key,
  title: AR.fuels[key].label,
  unit: AR.fuels[key].unit,
});

const sumFuels = (keys: FuelKey[]) => (_val: number, sub: Record<string, number> | undefined, country: CountryCode) =>
  keys.reduce((acc, k) => acc + v(sub, k) * fuelFactor(k, country), 0);

// --- Traslados del personal (Alcance 3, categoría 7) ---
// Para cada medio: personas que lo usan y km por trayecto (solo ida).
// Emisiones = personas × km × 2 (ida y vuelta) × días trabajados × factor.
// En autos el factor es por km de vehículo, así que se divide por la ocupación promedio.
const COMMUTE_MODES: { key: TransportKey; perVehicle: boolean }[] = [
  { key: 'auto_nafta', perVehicle: true },
  { key: 'auto_gasoil', perVehicle: true },
  { key: 'auto_gnc', perVehicle: true },
  { key: 'moto', perVehicle: false },
  { key: 'colectivo', perVehicle: false },
  { key: 'micro_empresa', perVehicle: false },
  { key: 'remis', perVehicle: false },
];

const commuteSubmodules: SubmoduleDef[] = [
  { id: 'dias', title: 'Días trabajados en el período', unit: 'días', group: 'Datos generales', hint: 'Ej. 22 para un mes, 250 para un año' },
  { id: 'ocupacion_auto', title: 'Personas por auto (promedio)', unit: 'pers.', group: 'Datos generales', default: 1, hint: 'Si comparten auto, ej. 2' },
  ...COMMUTE_MODES.flatMap(({ key }) => [
    { id: `${key}_personas`, title: 'Personas', unit: 'pers.', group: AR.transport[key].label },
    { id: `${key}_km`, title: 'Km por trayecto (solo ida)', unit: 'km', group: AR.transport[key].label },
  ]),
  { id: 'bici_personas', title: 'Personas', unit: 'pers.', group: 'Bicicleta / a pie (sin emisiones)' },
];

/** Personas totales cargadas en traslados (para indicadores). */
export function commutePeople(sub: Record<string, number> | undefined): number {
  return COMMUTE_MODES.reduce((acc, { key }) => acc + v(sub, `${key}_personas`), 0) + v(sub, 'bici_personas');
}

// --- Viajes de trabajo (Alcance 3, categoría 6) ---
const BUSINESS_TRAVEL: TransportKey[] = ['auto_nafta', 'auto_gasoil', 'avion_nacional', 'avion_internacional', 'micro_larga_distancia', 'remis'];

const REFRIGERANT_KEYS = Object.keys(AR.refrigerants) as RefrigerantKey[];
const WASTE_KEYS = Object.keys(AR.waste) as WasteKey[];

export const MODULE_CATALOG: Record<string, ModuleDef> = {
  // ===== ALCANCE 1 =====
  gas_natural: {
    id: 'gas_natural',
    title: 'Gas natural',
    description: 'Consumo de gas natural de calderas, hornos, tostadores, etc. (dato de la factura).',
    unit: 'm³',
    icon: '🔥',
    scope: 1,
    calculateCO2: (value, _sub, country) => Math.max(0, value) * fuelFactor('gas_natural', country),
  },
  combustibles_fijos: {
    id: 'combustibles_fijos',
    title: 'Otros combustibles en planta',
    description: 'Gasoil de grupos electrógenos, GLP de hornos o autoelevadores, fuel oil.',
    unit: 'varios',
    icon: '🛢️',
    scope: 1,
    submodules: [fuelSub('gasoil_fijo'), fuelSub('glp'), fuelSub('fuel_oil')],
    calculateCO2: sumFuels(['gasoil_fijo', 'glp', 'fuel_oil']),
  },
  flota_propia: {
    id: 'flota_propia',
    title: 'Vehículos propios de la planta',
    description: 'Combustible cargado en vehículos de la empresa (utilitarios, camionetas, camiones propios).',
    unit: 'varios',
    icon: '🚚',
    scope: 1,
    submodules: [fuelSub('gasoil_movil'), fuelSub('nafta'), fuelSub('gnc')],
    calculateCO2: sumFuels(['gasoil_movil', 'nafta', 'gnc']),
  },
  refrigerantes: {
    id: 'refrigerantes',
    title: 'Recarga de refrigerantes',
    description: 'Kg de gas refrigerante repuestos en cámaras, túneles de frío y aires acondicionados (lo que se recarga es lo que se fugó).',
    unit: 'kg',
    icon: '❄️',
    scope: 1,
    submodules: REFRIGERANT_KEYS.map(k => ({ id: k, title: AR.refrigerants[k].label, unit: 'kg' })),
    calculateCO2: (_val, sub, country) =>
      REFRIGERANT_KEYS.reduce((acc, k) => acc + v(sub, k) * refrigerantGwp(k, country), 0),
  },

  // ===== ALCANCE 2 =====
  electricidad: {
    id: 'electricidad',
    title: 'Electricidad',
    description: 'Energía eléctrica comprada (dato de la factura). La energía renovable con certificado se carga aparte y no suma emisiones.',
    unit: 'kWh',
    icon: '⚡',
    scope: 2,
    submodules: [
      { id: 'red', title: 'Energía de la red', unit: 'kWh' },
      { id: 'renovable', title: 'Energía renovable certificada', unit: 'kWh' },
    ],
    calculateCO2: (_val, sub, country) => v(sub, 'red') * gridFactor(country),
  },

  // ===== ALCANCE 3 =====
  traslados_personal: {
    id: 'traslados_personal',
    title: 'Traslados del personal',
    description: 'Viaje diario casa–planta–casa del personal. Cargá cuántas personas usan cada medio y cuántos km hacen por trayecto.',
    unit: 'varios',
    icon: '🚗',
    scope: 3,
    category: 'Cat. 7',
    submodules: commuteSubmodules,
    calculateCO2: (_val, sub, country) => {
      const dias = v(sub, 'dias');
      const ocupacion = v(sub, 'ocupacion_auto') || 1;
      return COMMUTE_MODES.reduce((acc, { key, perVehicle }) => {
        const pkm = v(sub, `${key}_personas`) * v(sub, `${key}_km`) * 2 * dias;
        const f = transportFactor(key, country);
        return acc + pkm * (perVehicle ? f / ocupacion : f);
      }, 0);
    },
  },
  viajes_trabajo: {
    id: 'viajes_trabajo',
    title: 'Viajes de trabajo',
    description: 'Viajes por trabajo entre plantas, a proveedores o clientes, en vehículos que no son de la empresa. Cargá los km totales recorridos.',
    unit: 'km',
    icon: '✈️',
    scope: 3,
    category: 'Cat. 6',
    submodules: BUSINESS_TRAVEL.map(k => ({
      id: k,
      title: AR.transport[k].label,
      unit: k.startsWith('auto') ? 'km' : 'pasajero-km',
    })),
    calculateCO2: (_val, sub, country) =>
      BUSINESS_TRAVEL.reduce((acc, k) => acc + v(sub, k) * transportFactor(k, country), 0),
  },
  residuos: {
    id: 'residuos',
    title: 'Residuos',
    description: 'Kg de residuos generados según su destino final.',
    unit: 'kg',
    icon: '🗑️',
    scope: 3,
    category: 'Cat. 5',
    submodules: WASTE_KEYS.map(k => ({ id: k, title: AR.waste[k].label, unit: 'kg' })),
    calculateCO2: (_val, sub, country) =>
      WASTE_KEYS.reduce((acc, k) => acc + v(sub, k) * wasteFactor(k, country), 0),
  },

  // ===== INFORMATIVO =====
  produccion: {
    id: 'produccion',
    title: 'Producción',
    description: 'Kg producidos en el período. No suma emisiones: se usa para calcular la intensidad (kg CO₂e por kg producido).',
    unit: 'kg',
    icon: '🏭',
    scope: 0,
    calculateCO2: () => 0,
  },
};

export const SCOPE_INFO: Record<Exclude<Scope, 0>, { label: string; short: string; desc: string; color: string }> = {
  1: { label: 'Alcance 1', short: 'A1', desc: 'Emisiones directas: combustibles y refrigerantes', color: '#e2231a' },
  2: { label: 'Alcance 2', short: 'A2', desc: 'Electricidad comprada', color: '#6a2c91' },
  3: { label: 'Alcance 3', short: 'A3', desc: 'Traslados del personal, viajes y residuos', color: '#595959' },
};
