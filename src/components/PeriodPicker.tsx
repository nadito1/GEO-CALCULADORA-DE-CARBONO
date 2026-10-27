import { MONTHS_LONG } from '../data/footprint';

interface Props {
  value: string; // "AAAA-MM"
  onChange: (v: string) => void;
  label: string;
}

const select = 'p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm bg-white';

/** Selector de mes y año para una carga. */
export function PeriodPicker({ value, onChange, label }: Props) {
  const [y, m] = (value || '').split('-');
  const thisYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = thisYear + 1; i >= thisYear - 4; i--) years.push(i);
  const year = y || String(thisYear);
  const month = m || String(new Date().getMonth() + 1).padStart(2, '0');

  return (
    <div class="mb-4">
      <label class="block text-xs sm:text-sm font-bold mb-2">{label}</label>
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          value={month}
          onChange={(e) => onChange(`${year}-${(e.target as HTMLSelectElement).value}`)}
          class={`${select} flex-1`}
        >
          {MONTHS_LONG.map((name, i) => {
            const v = String(i + 1).padStart(2, '0');
            return <option key={v} value={v}>{name.charAt(0).toUpperCase() + name.slice(1)}</option>;
          })}
        </select>
        <select
          aria-label="Año"
          value={year}
          onChange={(e) => onChange(`${(e.target as HTMLSelectElement).value}-${month}`)}
          class={`${select} w-28`}
        >
          {years.map(v => <option key={v} value={String(v)}>{v}</option>)}
        </select>
      </div>
    </div>
  );
}
