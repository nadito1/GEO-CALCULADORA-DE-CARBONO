import type { Organization } from '../types';
import { periodOptions } from '../data/footprint';
import { t } from '../i18n';

interface Props {
  orgs: Organization[];
  value: string;
  onChange: (v: string) => void;
}

/** Filtro de período: todo, un año o un mes. */
export function PeriodFilter({ orgs, value, onChange }: Props) {
  const options = periodOptions(orgs);
  return (
    <label class="flex items-center gap-2 text-sm">
      <span class="font-bold text-gray-700 whitespace-nowrap">📅 {t('periodFilter')}</span>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        class="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white min-w-0 flex-1 sm:flex-none"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
