import type { ModuleDef } from '../types';
import { t } from '../i18n';

interface Props {
  def: ModuleDef;
  mainValue: number;
  subValues: Record<string, number>;
  onMainChange: (v: number) => void;
  onSubChange: (id: string, v: number) => void;
}

const inputClass = 'p-1.5 border border-gray-300 rounded text-right text-sm focus:ring-2 focus:ring-green-500';

const toNumber = (raw: string) => {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Campos de carga de un módulo, agrupados por sección y con la unidad de cada campo. */
export function ModuleFields({ def, mainValue, subValues, onMainChange, onSubChange }: Props) {
  if (!def.submodules || def.submodules.length === 0) {
    return (
      <div class="mb-6">
        <label class="block text-xs sm:text-sm font-bold mb-2">{t('value')} ({def.unit})</label>
        <input
          type="number" min="0" step="any" inputMode="decimal"
          value={mainValue}
          onInput={(e) => onMainChange(toNumber((e.target as HTMLInputElement).value))}
          class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-sm"
          placeholder={t('enterValue')}
        />
      </div>
    );
  }

  let lastGroup: string | undefined;
  return (
    <div class="space-y-2 mb-6">
      {def.submodules.map(sub => {
        const header = sub.group && sub.group !== lastGroup ? sub.group : null;
        lastGroup = sub.group;
        return (
          <div key={sub.id}>
            {header && <p class="font-bold text-xs sm:text-sm text-gray-800 mt-4 mb-1 border-b border-gray-200 pb-1">{header}</p>}
            <div class="flex justify-between items-center gap-3">
              <label class="text-xs sm:text-sm text-gray-600 flex-1" for={`f-${sub.id}`}>
                {sub.title}
                {sub.hint && <span class="block text-[11px] text-gray-400">{sub.hint}</span>}
              </label>
              <input
                id={`f-${sub.id}`}
                type="number" min="0" step="any" inputMode="decimal"
                value={subValues[sub.id] ?? 0}
                onInput={(e) => onSubChange(sub.id, toNumber((e.target as HTMLInputElement).value))}
                class={`w-24 sm:w-28 ${inputClass}`}
              />
              <span class="w-14 text-xs text-gray-500">{sub.unit ?? def.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Valores iniciales de los campos de un módulo. */
export function defaultSubValues(def: ModuleDef | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  def?.submodules?.forEach(s => {
    if (s.default !== undefined) out[s.id] = s.default;
  });
  return out;
}
