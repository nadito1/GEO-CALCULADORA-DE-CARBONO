import { useState } from 'preact/hooks';
import type { ModuleInstance } from '../types';
import { MODULE_CATALOG } from '../data/moduleCatalog';
import { ModuleFields } from './ModuleFields';
import { PeriodPicker } from './PeriodPicker';
import { currentPeriod } from '../data/footprint';
import { t } from '../i18n';

interface Props {
  moduleInstance: ModuleInstance;
  onClose: () => void;
  onSave: (updated: ModuleInstance) => void;
}

export function EditModuleModal({ moduleInstance, onClose, onSave }: Props) {
  const def = MODULE_CATALOG[moduleInstance.defId];
  const [mainValue, setMainValue] = useState(moduleInstance.value);
  const [subValues, setSubValues] = useState<Record<string, number>>(moduleInstance.submoduleValues || {});

  const [period, setPeriod] = useState(moduleInstance.period || currentPeriod());

  if (!def) return null;

  const handleSave = () => {
    onSave({ ...moduleInstance, value: mainValue, submoduleValues: subValues, period });
    onClose();
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg sm:text-xl font-bold mb-2">{def.icon} {def.title}</h2>
        <p class="text-gray-600 text-xs sm:text-sm mb-6">{def.description}</p>

        <PeriodPicker label={t('periodLabel')} value={period} onChange={setPeriod} />

        <ModuleFields
          def={def}
          mainValue={mainValue}
          subValues={subValues}
          onMainChange={setMainValue}
          onSubChange={(id, val) => setSubValues(prev => ({ ...prev, [id]: val }))}
        />

        <div class="flex justify-end gap-2 sm:gap-3 mt-8">
          <button onClick={onClose} class="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium text-sm">{t('cancel')}</button>
          <button onClick={handleSave} class="px-3 sm:px-4 py-2 bg-brand-700 text-white font-bold rounded hover:bg-brand-800 text-sm">
            {t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
