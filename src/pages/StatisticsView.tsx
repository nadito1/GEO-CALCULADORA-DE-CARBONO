import { useSignal } from '@preact/signals';
import { organizations, selectOrganization } from '../store';
import { MODULE_CATALOG, SCOPE_INFO } from '../data/moduleCatalog';
import { computeFootprint, formatCO2, formatNumber } from '../data/footprint';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { t } from '../i18n';

const toT = (kg: number) => Math.round((kg / 1000) * 100) / 100;

export function StatisticsView() {
  const orgs = organizations.value;
  const compare1 = useSignal<string>(orgs[0]?.id || '');
  const compare2 = useSignal<string>('');

  const rows = orgs.map(org => ({ org, fp: computeFootprint(org) }));
  const total = rows.reduce(
    (acc, { fp }) => ({
      a1: acc.a1 + fp.byScope[1],
      a2: acc.a2 + fp.byScope[2],
      a3: acc.a3 + fp.byScope[3],
      all: acc.all + fp.total,
      prod: acc.prod + fp.production,
    }),
    { a1: 0, a2: 0, a3: 0, all: 0, prod: 0 },
  );

  const byPlant = rows.map(({ org, fp }) => ({
    name: org.name,
    a1: toT(fp.byScope[1]),
    a2: toT(fp.byScope[2]),
    a3: toT(fp.byScope[3]),
  }));

  // Comparación de dos plantas por módulo
  const o1 = orgs.find(o => o.id === compare1.value);
  const o2 = orgs.find(o => o.id === compare2.value);
  const f1 = o1 ? computeFootprint(o1) : null;
  const f2 = o2 ? computeFootprint(o2) : null;
  const compareData = Object.values(MODULE_CATALOG)
    .filter(d => d.scope !== 0)
    .map(d => ({ name: d.title, p1: toT(f1?.byModule[d.id] || 0), p2: toT(f2?.byModule[d.id] || 0) }))
    .filter(d => d.p1 > 0 || d.p2 > 0);

  if (orgs.length === 0) {
    return (
      <div class="p-4">
        <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">{t('analyticsComparison')}</h2>
        <p class="text-gray-500">{t('noOrganizationsMsg')}</p>
      </div>
    );
  }

  return (
    <div class="p-1 sm:p-4">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">{t('analyticsComparison')}</h2>

      {/* Total consolidado */}
      <div class="mb-6 p-4 sm:p-6 rounded-lg border border-gray-200 bg-white">
        <p class="m-0 text-xs sm:text-sm text-gray-600">{t('allPlantsTotal').replace('{n}', String(orgs.length))}</p>
        <h3 class="m-0 mt-1 text-2xl sm:text-3xl font-bold text-red-700">{formatCO2(total.all)}</h3>
        <div class="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs sm:text-sm">
          {([1, 2, 3] as const).map(s => (
            <span key={s} style={{ color: SCOPE_INFO[s].color }}>
              <b>{SCOPE_INFO[s].label}:</b> {formatCO2(s === 1 ? total.a1 : s === 2 ? total.a2 : total.a3)}
            </span>
          ))}
          {total.prod > 0 && (
            <span class="text-gray-700"><b>{t('intensityShort')}:</b> {formatNumber(total.all / total.prod, 3)} kg CO₂e/kg</span>
          )}
        </div>
      </div>

      {/* Huella por planta */}
      <div class="mb-6 bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
        <h3 class="mt-0 mb-3 text-sm sm:text-base font-bold">{t('footprintByPlant')}</h3>
        <div class="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byPlant} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit=" t" width={60} />
              <Tooltip formatter={(val: any) => `${formatNumber(Number(val))} t CO₂e`} cursor={{ fill: '#f3f4f6' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar isAnimationActive={false} dataKey="a1" stackId="s" name={SCOPE_INFO[1].label} fill={SCOPE_INFO[1].color} />
              <Bar isAnimationActive={false} dataKey="a2" stackId="s" name={SCOPE_INFO[2].label} fill={SCOPE_INFO[2].color} />
              <Bar isAnimationActive={false} dataKey="a3" stackId="s" name={SCOPE_INFO[3].label} fill={SCOPE_INFO[3].color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla por planta */}
      <div class="mb-8 overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table class="w-full text-left text-xs sm:text-sm border-collapse">
          <thead class="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th class="p-2 sm:p-3">{t('plant')}</th>
              <th class="p-2 sm:p-3 text-right">A1 (t)</th>
              <th class="p-2 sm:p-3 text-right">A2 (t)</th>
              <th class="p-2 sm:p-3 text-right">A3 (t)</th>
              <th class="p-2 sm:p-3 text-right">Total (t)</th>
              <th class="p-2 sm:p-3 text-right">kg CO₂e/kg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ org, fp }) => (
              <tr key={org.id} class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => selectOrganization(org.id)}>
                <td class="p-2 sm:p-3 font-medium text-green-800">{org.name}</td>
                <td class="p-2 sm:p-3 text-right">{formatNumber(toT(fp.byScope[1]))}</td>
                <td class="p-2 sm:p-3 text-right">{formatNumber(toT(fp.byScope[2]))}</td>
                <td class="p-2 sm:p-3 text-right">{formatNumber(toT(fp.byScope[3]))}</td>
                <td class="p-2 sm:p-3 text-right font-bold">{formatNumber(toT(fp.total))}</td>
                <td class="p-2 sm:p-3 text-right">{fp.intensity === null ? '–' : formatNumber(fp.intensity, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comparación por fuente */}
      <h3 class="text-base sm:text-lg font-bold mb-3">{t('compareTwoPlants')}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
        <div>
          <label class="block text-xs sm:text-sm font-bold mb-2 text-gray-700">{t('baselineOrganization')}</label>
          <select value={compare1.value} onChange={(e) => (compare1.value = (e.target as HTMLSelectElement).value)} class="w-full p-2 border border-gray-300 rounded text-sm">
            <option value="">{t('selectOrganization')}</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label class="block text-xs sm:text-sm font-bold mb-2 text-gray-700">{t('compareWith')}</label>
          <select value={compare2.value} onChange={(e) => (compare2.value = (e.target as HTMLSelectElement).value)} class="w-full p-2 border border-gray-300 rounded text-sm">
            <option value="">{t('singleView')}</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
      </div>

      <div class="h-80 mb-4 bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={compareData} margin={{ top: 5, right: 10, left: 0, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} unit=" t" width={60} />
            <Tooltip formatter={(val: any) => `${formatNumber(Number(val))} t CO₂e`} cursor={{ fill: '#f3f4f6' }} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px' }} />
            <Bar isAnimationActive={false} dataKey="p1" name={o1?.name || t('baselineOrg')} fill="#15803d" radius={[4, 4, 0, 0]} />
            {o2 && <Bar isAnimationActive={false} dataKey="p2" name={o2.name} fill="#64748b" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p class="text-[11px] text-gray-500">{t('kgCO2eNote')}</p>
    </div>
  );
}
