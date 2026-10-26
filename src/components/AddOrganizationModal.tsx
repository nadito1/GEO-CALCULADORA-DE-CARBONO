import { useState } from 'preact/hooks';
import { DEFAULT_COUNTRY, type CountryCode } from '../data/factors';
import { t } from '../i18n';

interface Props {
  onClose: () => void;
  onConfirm: (name: string, description: string, country: CountryCode) => void;
}

export function AddOrganizationModal({ onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim(), description.trim(), DEFAULT_COUNTRY);
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
        <h2 class="text-lg sm:text-xl font-bold mb-4">{t('addNewOrganization')}</h2>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-xs sm:text-sm font-bold mb-2">{t('organizationNameRequired')}</label>
            <input
              type="text"
              required
              placeholder={t('organizationNamePlaceholder')}
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-sm"
            />
            <p class="text-[11px] text-gray-500 mt-1">{t('organizationNameHint')}</p>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-bold mb-2">{t('description')}</label>
            <input
              type="text"
              placeholder={t('descriptionPlaceholder')}
              value={description}
              onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
              class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} class="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium text-sm">
              {t('cancel')}
            </button>
            <button type="submit" class="px-3 sm:px-4 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-800 text-sm">
              {t('createOrganization')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
