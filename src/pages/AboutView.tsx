import { FACTORS, co2e, wasteFactor, type FuelKey, type WasteKey } from '../data/factors';
import { formatNumber } from '../data/footprint';
import { t } from '../i18n';

const AR = FACTORS.ar;

function Row({ label, value, unit, source }: { label: string; value: string; unit: string; source: string }) {
  return (
    <tr class="border-b border-gray-100 align-top">
      <td class="p-2">{label}</td>
      <td class="p-2 text-right whitespace-nowrap font-medium">{value}</td>
      <td class="p-2 whitespace-nowrap text-gray-600">{unit}</td>
      <td class="p-2 text-gray-500 text-[11px]">{source}</td>
    </tr>
  );
}

function Table({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return (
    <div class="mb-6">
      <h4 class="text-sm font-bold text-gray-800 mb-2">{title}</h4>
      <div class="overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table class="w-full text-xs sm:text-sm border-collapse">
          <thead class="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th class="p-2">{t('concept')}</th>
              <th class="p-2 text-right">{t('factor')}</th>
              <th class="p-2">{t('unit')}</th>
              <th class="p-2">{t('source')}</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AboutView() {
  const fuelKeys = Object.keys(AR.fuels) as FuelKey[];
  const wasteKeys = Object.keys(AR.waste) as WasteKey[];

  return (
    <div class="max-w-3xl mx-auto">
      <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-brand-800">{t('aboutTitle')}</h2>
      <p class="text-gray-700 text-sm sm:text-base leading-relaxed mb-3">{t('aboutDescription')}</p>
      <p class="text-gray-600 text-sm leading-relaxed mb-8">{t('aboutDescriptionExtra')}</p>

      <h3 class="text-lg sm:text-xl font-bold mb-3 text-gray-900">{t('methodology')}</h3>
      <ul class="list-disc pl-5 space-y-1 text-sm text-gray-700 mb-6">
        <li>{t('methodScopes')}</li>
        <li>{t('methodGwp').replace('{gwp}', AR.meta.gwpSet).replace('{ch4}', String(AR.gwp.ch4)).replace('{n2o}', String(AR.gwp.n2o))}</li>
        <li>{t('methodBiogenic')}</li>
        <li>{t('methodCommute')}</li>
      </ul>

      <p class="text-sm text-gray-700 mb-1">
        <b>{t('mainSource')}:</b>{' '}
        <a class="text-brand-700 underline" href={AR.meta.mainSourceUrl} target="_blank" rel="noopener noreferrer">{AR.meta.mainSource}</a>
      </p>
      <p class="text-sm text-gray-700 mb-6">
        <b>{t('transportSource')}:</b>{' '}
        <a class="text-brand-700 underline" href={AR.meta.transportSourceUrl} target="_blank" rel="noopener noreferrer">{AR.meta.transportSource}</a>
      </p>

      <Table title={t('fuelsAndPower')}>
        {fuelKeys.map(k => (
          <Row key={k} label={AR.fuels[k].label} value={formatNumber(co2e(AR.fuels[k], 'ar'), 4)} unit={`kg CO₂e / ${AR.fuels[k].unit}`} source={AR.fuels[k].source} />
        ))}
        <Row label={AR.electricity.red.label} value={formatNumber(co2e(AR.electricity.red, 'ar'), 4)} unit="kg CO₂e / kWh" source={AR.electricity.red.source} />
      </Table>

      <Table title={t('refrigerantsGwp')}>
        {Object.values(AR.refrigerants).map(r => (
          <Row key={r.label} label={r.label} value={formatNumber(r.gwp, 2)} unit="kg CO₂e / kg" source={AR.refrigerantsSource} />
        ))}
      </Table>

      <Table title={t('transportFactors')}>
        {Object.values(AR.transport).map(f => (
          <Row key={f.label} label={f.label} value={formatNumber(f.value, 5)} unit={f.unit} source={f.source} />
        ))}
      </Table>

      <Table title={t('wasteFactors')}>
        {wasteKeys.map(k => (
          <Row key={k} label={AR.waste[k].label} value={formatNumber(wasteFactor(k, 'ar'), 4)} unit="kg CO₂e / kg" source={AR.waste[k].source} />
        ))}
      </Table>

      <div class="mb-8 p-4 rounded-lg border border-amber-200 bg-amber-50 text-xs sm:text-sm text-amber-900">
        {t('disclaimer')}
      </div>

      <div class="mb-8 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 text-sm text-gray-600">
        <h3 class="text-base font-bold mb-2 text-gray-900">{t('credits')}</h3>
        <p class="m-0">{t('creditsText')}</p>
      </div>
    </div>
  );
}
