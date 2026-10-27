import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { Organization } from '../types';
import { monthlySeries, formatNumber } from '../data/footprint';
import { SCOPE_INFO } from '../data/moduleCatalog';
import { t } from '../i18n';

const toT = (kg: number) => Math.round(kg / 10) / 100;

/** Evolución mensual de la huella (t CO₂e) apilada por alcance. */
export function MonthlyChart({ orgs, filter, onSelect }: { orgs: Organization[]; filter: string; onSelect?: (period: string) => void }) {
  const data = monthlySeries(orgs, filter).map(d => ({ ...d, a1: toT(d.a1), a2: toT(d.a2), a3: toT(d.a3) }));
  if (data.length < 2) return null;

  return (
    <div class="mb-6 bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
      <h3 class="mt-0 mb-3 text-sm sm:text-base font-bold">{t('monthlyEvolution')}</h3>
      <div class="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            onClick={(e: any) => {
              const p = e?.activePayload?.[0]?.payload?.period;
              if (p && onSelect) onSelect(p);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e6e6" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit=" t" width={60} />
            <Tooltip formatter={(val: any) => `${formatNumber(Number(val))} t CO₂e`} cursor={{ fill: '#f3f3f3' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar isAnimationActive={false} dataKey="a1" stackId="s" name={SCOPE_INFO[1].label} fill={SCOPE_INFO[1].color} />
            <Bar isAnimationActive={false} dataKey="a2" stackId="s" name={SCOPE_INFO[2].label} fill={SCOPE_INFO[2].color} />
            <Bar isAnimationActive={false} dataKey="a3" stackId="s" name={SCOPE_INFO[3].label} fill={SCOPE_INFO[3].color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {onSelect && <p class="m-0 mt-1 text-[11px] text-gray-500">{t('monthlyClickHint')}</p>}
    </div>
  );
}
