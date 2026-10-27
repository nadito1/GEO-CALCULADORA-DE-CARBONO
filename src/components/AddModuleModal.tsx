import { useState } from 'preact/hooks';
import { MODULE_CATALOG, SCOPE_INFO } from '../data/moduleCatalog';
import type { ModuleInstance, Scope } from '../types';
import { ModuleFields, defaultSubValues } from './ModuleFields';
import { PeriodPicker } from './PeriodPicker';
import { currentPeriod } from '../data/footprint';
import { t } from '../i18n';

interface Props {
  onClose: () => void;
  onConfirm: (moduleInstance: ModuleInstance) => void;
  /** Mes propuesto (el que se está viendo en la planta). */
  defaultPeriod?: string;
}

const scopeLabel = (s: Scope) => (s === 0 ? 'Datos de producción' : `${SCOPE_INFO[s].label} – ${SCOPE_INFO[s].desc}`);

export function AddModuleModal({ onClose, onConfirm, defaultPeriod }: Props) {
  const firstId = Object.keys(MODULE_CATALOG)[0];
  const [selectedDefId, setSelectedDefId] = useState(firstId);
  const [mainValue, setMainValue] = useState(0);
  const [subValues, setSubValues] = useState<Record<string, number>>(defaultSubValues(MODULE_CATALOG[firstId]));

  const [period, setPeriod] = useState(defaultPeriod && defaultPeriod.length === 7 ? defaultPeriod : currentPeriod());
  const def = MODULE_CATALOG[selectedDefId];
  const scopes: Scope[] = [1, 2, 3, 0];

  const handleAdd = () => {
    onConfirm({ id: crypto.randomUUID(), defId: selectedDefId, value: mainValue, submoduleValues: subValues, period });
    onClose();
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg sm:text-xl font-bold mb-2">{t('addModule')}</h2>
        <p class="text-gray-600 text-xs sm:text-sm mb-6">{t('selectModuleDesc')}</p>

        <PeriodPicker label={t('periodLabel')} value={period} onChange={setPeriod} />

        <div class="mb-4">
          <label class="block text-xs sm:text-sm font-bold mb-2">{t('selectModuleType')}</label>
          <select
            value={selectedDefId}
            onChange={(e) => {
              const id = (e.target as HTMLSelectElement).value;
              setSelectedDefId(id);
              setMainValue(0);
              setSubValues(defaultSubValues(MODULE_CATALOG[id]));
            }}
            class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm"
          >
            {scopes.map(scope => (
              <optgroup key={scope} label={scopeLabel(scope)}>
                {Object.values(MODULE_CATALOG)
                  .filter(m => m.scope === scope)
                  .map(m => <option key={m.id} value={m.id}>{m.icon} {m.title}</option>)}
              </optgroup>
            ))}
          </select>
          <p class="text-gray-500 text-xs mt-2">{def?.description}</p>
        </div>

        {def && (
          <ModuleFields
            def={def}
            mainValue={mainValue}
            subValues={subValues}
            onMainChange={setMainValue}
            onSubChange={(id, val) => setSubValues(prev => ({ ...prev, [id]: val }))}
          />
        )}

        <div class="flex justify-end gap-2 sm:gap-3 mt-8">
          <button onClick={onClose} class="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium text-sm">
            {t('cancel')}
          </button>
          <button onClick={handleAdd} class="px-3 sm:px-4 py-2 bg-brand-700 text-white font-bold rounded hover:bg-brand-800 text-sm">
            {t('addModuleBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
