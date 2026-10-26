import { signal, effect } from "@preact/signals";

// Import your new JSON files
import en from './locales/en.json';
import es from './locales/es.json';

export type Language = 'es' | 'en';

const LANG_KEY = "geo-carbono-idioma";

function loadLang(): Language {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}
export const currentLang = signal<Language>(loadLang());

effect(() => {
  try {
    localStorage.setItem(LANG_KEY, currentLang.value);
  } catch {
    // sin almacenamiento disponible
  }
});

// Map the imported JSON files to our dictionary object
const dictionary: Record<Language, Record<string, string>> = { es, en };

export function t(key: string): string {
  return dictionary[currentLang.value]?.[key] || dictionary['es'][key] || key;
}