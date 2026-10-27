import type { Organization } from '../types';
import { computeFootprint, formatCO2, formatNumber, formatPeriod, periodsOf } from '../data/footprint';
import { periodFilter } from '../store';
import { t } from '../i18n';

interface Props {
  org: Organization;
  onClick: () => void;
}

export function OrganizationCard({ org, onClick }: Props) {
  const filter = periodFilter.value;
  const fp = computeFootprint(org, filter);
  const months = periodsOf([org]);
  const range = months.length === 0 ? '' : months.length === 1 ? formatPeriod(months[0]) : `${formatPeriod(months[0])} – ${formatPeriod(months[months.length - 1])}`;
  const desc = org.description && org.description.length > 80 ? org.description.substring(0, 80).trim() + '…' : org.description;

  return (
    <div
      onClick={onClick}
      class="border border-gray-200 rounded-lg p-4 pr-12 cursor-pointer bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
    >
      <div class="flex-1">
        <h3 class="m-0 text-lg font-bold text-gray-900">🏭 {org.name}</h3>
        {desc && <p class="m-0 text-sm text-gray-600 mt-1 line-clamp-2">{desc}</p>}
        <p class="m-0 mt-3 text-[11px] text-gray-500">{formatPeriod(filter, true)}</p>
        <p class="m-0 text-xl font-bold text-accent-700">{formatCO2(fp.total)}</p>
        {fp.intensity !== null && (
          <p class="m-0 text-xs text-gray-600">{formatNumber(fp.intensity, 3)} kg CO₂e / kg {t('produced')}</p>
        )}
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500 mt-3">
        <span>🇦🇷 Argentina</span>
        <span>{range ? `📅 ${range} · ${months.length} ${months.length === 1 ? t('month') : t('months')}` : `${org.modules.length} ${org.modules.length === 1 ? t('entry') : t('entries')}`}</span>
      </div>
    </div>
  );
}
