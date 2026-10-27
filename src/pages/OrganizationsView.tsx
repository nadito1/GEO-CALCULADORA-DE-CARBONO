import { useSignal } from '@preact/signals';
import { organizations, addOrganization, selectOrganization, deleteOrganization, periodFilter } from '../store';
import { PeriodFilter } from '../components/PeriodFilter';
import { OrganizationCard } from '../components/OrganizationCard';
import { AddOrganizationModal } from '../components/AddOrganizationModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { CountryCode } from '../data/factors';
import { t } from '../i18n';

export function OrganizationsView() {
  const showAddModal = useSignal(false);
  const deletingOrgId = useSignal<string | null>(null);

  const handleAddOrganization = (name: string, description: string, country: CountryCode) => {
    addOrganization(name, description, country);
    showAddModal.value = false;
  };

  const handleDeleteOrganization = () => {
    if (deletingOrgId.value) {
      deleteOrganization(deletingOrgId.value);
      deletingOrgId.value = null;
    }
  };

  return (
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">🏭 {t('yourOrganizations')}</h2>
      {organizations.value.length > 0 && (
        <div class="mb-6">
          <PeriodFilter orgs={organizations.value} value={periodFilter.value} onChange={(v) => (periodFilter.value = v)} />
        </div>
      )}
      
      {organizations.value.length === 0 ? (
        <div class="text-center py-12">
          <p class="text-gray-500 mb-6">{t('noOrganizationsMsg')}</p>
        </div>
      ) : (
        <div class="grid gap-4 sm:grid-cols-2 mb-12 auto-rows-max">
          {organizations.value.map(org => (
            <div key={org.id} class="relative min-w-0 h-full">
              <OrganizationCard 
                org={org} 
                onClick={() => selectOrganization(org.id)}
              />
              <button
                onClick={() => deletingOrgId.value = org.id}
                class="absolute top-2 right-2 p-2 text-accent-600 hover:bg-accent-50 rounded transition-colors"
                title={t('deleteOrgTitle')}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Centered Add Button */}
      <div class="flex justify-center mt-12">
        <button 
          onClick={() => showAddModal.value = true}
          class="px-6 sm:px-8 py-2 sm:py-3 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800 transition-colors shadow-lg text-sm sm:text-lg flex items-center gap-2"
        >
          ➕ {t('addOrganization')}
        </button>
      </div>

      {/* Add Organization Modal */}
      {showAddModal.value && (
        <AddOrganizationModal 
          onClose={() => showAddModal.value = false}
          onConfirm={handleAddOrganization}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrgId.value && (
        <ConfirmationModal
          title={t('deleteOrganization')}
          message={t('deleteOrgConfirm')}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          isDelete={true}
          onConfirm={handleDeleteOrganization}
          onCancel={() => deletingOrgId.value = null}
        />
      )}
    </div>
  );
}