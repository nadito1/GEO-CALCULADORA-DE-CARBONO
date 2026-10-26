import arData from './factors/ar.json';

export type CountryCode = 'ar';

export type EmissionFactors = typeof arData;

export const FACTORS: Record<CountryCode, EmissionFactors> = {
  ar: arData,
};

export const COUNTRY_NAMES: Record<CountryCode, string> = {
  ar: 'Argentina',
};

export const DEFAULT_COUNTRY: CountryCode = 'ar';

/** Factor de un gas combustible o de la red, expresado en kg CO₂e por unidad (CO₂ + CH₄·PCG + N₂O·PCG). */
interface GasFactor {
  co2: number;
  ch4: number;
  n2o: number;
}

export function co2e(f: GasFactor, country: CountryCode): number {
  const { ch4, n2o } = FACTORS[country].gwp;
  return f.co2 + f.ch4 * ch4 + f.n2o * n2o;
}

export type FuelKey = keyof EmissionFactors['fuels'];
export type RefrigerantKey = keyof EmissionFactors['refrigerants'];
export type TransportKey = keyof EmissionFactors['transport'];
export type WasteKey = keyof EmissionFactors['waste'];

export function fuelFactor(key: FuelKey, country: CountryCode): number {
  return co2e(FACTORS[country].fuels[key], country);
}

export function gridFactor(country: CountryCode): number {
  return co2e(FACTORS[country].electricity.red, country);
}

export function refrigerantGwp(key: RefrigerantKey, country: CountryCode): number {
  return FACTORS[country].refrigerants[key].gwp;
}

export function transportFactor(key: TransportKey, country: CountryCode): number {
  return FACTORS[country].transport[key].value;
}

export function wasteFactor(key: WasteKey, country: CountryCode): number {
  const f = FACTORS[country].waste[key];
  const { ch4, n2o } = FACTORS[country].gwp;
  return f.ch4 * ch4 + f.n2o * n2o;
}

/** Normaliza un código de país guardado (datos viejos o importados) a uno soportado. */
export function normalizeCountry(code: string | undefined): CountryCode {
  return code && code in FACTORS ? (code as CountryCode) : DEFAULT_COUNTRY;
}
