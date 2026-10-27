import type { ModuleInstance, Organization } from '../types';
import { MODULE_CATALOG, SCOPE_INFO } from '../data/moduleCatalog';
import { moduleCO2, formatCO2, formatNumber, formatPeriod } from '../data/footprint';
import { t } from '../i18n';

interface Props {
  moduleInstance: ModuleInstance;
  org: Organization;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ModuleCard({ moduleInstance, org, onEdit, onDelete }: Props) {
  const def = MODULE_CATALOG[moduleInstance.defId];
  if (!def) return null;

  const co2 = moduleCO2(moduleInstance, org);
  const scope = def.scope === 0 ? null : SCOPE_INFO[def.scope];

  // Solo mostramos los campos cargados (distintos de cero) para que la tarjeta sea legible.
  const filled = (def.submodules || []).filter(s => (moduleInstance.submoduleValues?.[s.id] || 0) !== 0);

  return (
    <div class="border border-gray-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm mb-4 transition-shadow hover:shadow-md">
      <div class="flex justify-between items-start gap-3 mb-3">
        <div class="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div class="text-2xl sm:text-3xl flex-shrink-0">{def.icon}</div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-white">📅 {formatPeriod(moduleInstance.period)}</span>
              <h3 class="m-0 text-base sm:text-lg font-bold text-gray-900">{def.title}</h3>
              {scope && (
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: scope.color }}>
                  {scope.label}{def.category ? ` · ${def.category}` : ''}
                </span>
              )}
            </div>
            <p class="m-0 text-gray-500 text-xs sm:text-sm break-words">{def.description}</p>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          {def.scope === 0 ? (
            <div class="text-lg sm:text-xl font-bold text-gray-700">{formatNumber(moduleInstance.value, 0)} {def.unit}</div>
          ) : (
            <div class="text-lg sm:text-xl font-bold text-accent-700">{formatCO2(co2)}</div>
          )}
        </div>
      </div>

      {def.submodules && def.submodules.length > 0 && (
        <div class="bg-gray-50 p-3 rounded-md text-sm">
          <p class="m-0 mb-2 text-xs font-bold text-gray-600">{t('breakdown')}:</p>
          {filled.length === 0 ? (
            <p class="m-0 text-xs text-gray-400">{t('noValuesLoaded')}</p>
          ) : (
            <div class="space-y-1">
              {filled.map(sub => (
                <div key={sub.id} class="flex justify-between gap-3 text-xs sm:text-sm text-gray-500">
                  <span>{sub.group && sub.group !== 'Datos generales' ? `${sub.group} – ` : ''}{sub.title}</span>
                  <span class="font-medium text-gray-700 whitespace-nowrap">
                    {formatNumber(moduleInstance.submoduleValues?.[sub.id] || 0)} {sub.unit ?? def.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div class="flex gap-2 mt-4 justify-end">
        <button onClick={onEdit} class="px-3 sm:px-4 py-1 sm:py-1.5 rounded text-gray-700 hover:bg-gray-100 font-medium transition-colors text-sm">
          {t('edit')}
        </button>
        <button onClick={onDelete} class="px-3 sm:px-4 py-1 sm:py-1.5 text-accent-600 border border-accent-600 rounded hover:bg-accent-50 font-medium transition-colors text-sm">
          {t('delete')}
        </button>
      </div>
    </div>
  );
}
