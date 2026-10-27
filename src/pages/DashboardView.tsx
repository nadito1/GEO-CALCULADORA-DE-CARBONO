import { useSignal } from '@preact/signals';
import { activeOrg, addModuleInstanceWithValues, updateModuleInstance, deleteModuleInstance } from '../store';
import { MODULE_CATALOG, SCOPE_INFO, commutePeople } from '../data/moduleCatalog';
import { computeFootprint, formatCO2, formatNumber } from '../data/footprint';
import { ModuleCard } from '../components/ModuleCard';
import { AddModuleModal } from '../components/AddModuleModal';
import { EditModuleModal } from '../components/EditModuleModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import type { ModuleInstance, Scope } from '../types';
import { t } from '../i18n';

const SCOPES = [1, 2, 3] as const;

export function DashboardView() {
  const showAddModal = useSignal(false);
  const editingModule = useSignal<string | null>(null);
  const deletingModule = useSignal<string | null>(null);

  const org = activeOrg.value;
  if (!org) return <p class="text-gray-500 p-4">{t('noOrganizationsMsg')}</p>;

  const fp = computeFootprint(org);

  // Indicador por persona para traslados
  const commuteMods = org.modules.filter(m => m.defId === 'traslados_personal');
  const people = commuteMods.reduce((acc, m) => acc + commutePeople(m.submoduleValues), 0);
  const commuteKg = fp.byModule['traslados_personal'] || 0;

  const handleAddModule = (m: ModuleInstance) => {
    addModuleInstanceWithValues(m.defId, m.value, m.submoduleValues);
    showAddModal.value = false;
  };

  const editModule = org.modules.find(m => m.id === editingModule.value);
  const modulesOfScope = (s: Scope) => org.modules.filter(m => MODULE_CATALOG[m.defId]?.scope === s);

  return (
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold mb-1">{org.name}</h2>
      {org.description && <p class="text-gray-600 text-xs sm:text-sm mb-1">{org.description}</p>}
      {org.updatedAt && (
        <p class="text-gray-400 text-[11px] mb-6">
          {t('lastUpdate')} {new Date(org.updatedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
          {org.updatedBy ? ` · ${org.updatedBy}` : ''}
        </p>
      )}
      {!org.updatedAt && <div class="mb-6" />}

      {/* Total */}
      <div class="mb-4 bg-gradient-to-r from-accent-50 to-brand-50 p-4 sm:p-6 rounded-lg border border-accent-200">
        <p class="text-gray-600 text-xs sm:text-sm mb-1">{t('totalCO2')}</p>
        <h3 class="text-2xl sm:text-4xl font-bold text-accent-700 m-0">{formatCO2(fp.total)}</h3>
        {fp.intensity !== null && (
          <p class="m-0 mt-2 text-sm text-gray-700">
            <b>{formatNumber(fp.intensity, 3)} kg CO₂e</b> {t('perKgProduced')} ({formatNumber(fp.production, 0)} kg)
          </p>
        )}
      </div>

      {/* Alcances */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {SCOPES.map(s => {
          const kg = fp.byScope[s];
          const pct = fp.total > 0 ? (kg / fp.total) * 100 : 0;
          const info = SCOPE_INFO[s];
          return (
            <div key={s} class="p-3 sm:p-4 rounded-lg border border-gray-200 bg-white">
              <p class="m-0 text-xs font-bold" style={{ color: info.color }}>{info.label}</p>
              <p class="m-0 text-[11px] text-gray-500 mb-2">{info.desc}</p>
              <p class="m-0 text-lg font-bold text-gray-900">{formatCO2(kg)}</p>
              <div class="h-1.5 bg-gray-100 rounded mt-2 overflow-hidden">
                <div class="h-full rounded" style={{ width: `${pct}%`, background: info.color }} />
              </div>
              <p class="m-0 mt-1 text-[11px] text-gray-500">{formatNumber(pct, 1)} %</p>
            </div>
          );
        })}
      </div>

      {people > 0 && (
        <div class="mb-6 p-3 sm:p-4 rounded-lg border border-brand-200 bg-brand-50 text-sm text-brand-900">
          🚗 {t('commuteSummary')
            .replace('{kg}', formatCO2(commuteKg))
            .replace('{people}', formatNumber(people, 0))
            .replace('{perPerson}', formatCO2(commuteKg / people))}
        </div>
      )}

      {fp.intensity === null && org.modules.length > 0 && (
        <p class="mb-6 text-xs text-gray-500">💡 {t('addProductionHint')}</p>
      )}

      {/* Módulos agrupados por alcance */}
      <div class="mb-8">
        {org.modules.length === 0 ? (
          <p class="text-gray-500 text-sm">{t('noModulesMsg')}</p>
        ) : (
          ([1, 2, 3, 0] as Scope[]).map(s => {
            const mods = modulesOfScope(s);
            if (mods.length === 0) return null;
            return (
              <section key={s} class="mb-6">
                <h3 class="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                  {s === 0 ? t('productionData') : `${SCOPE_INFO[s].label} – ${SCOPE_INFO[s].desc}`}
                </h3>
                {mods.map(m => (
                  <ModuleCard
                    key={m.id}
                    moduleInstance={m}
                    org={org}
                    onEdit={() => (editingModule.value = m.id)}
                    onDelete={() => (deletingModule.value = m.id)}
                  />
                ))}
              </section>
            );
          })
        )}
      </div>

      <div class="flex justify-center py-6 sm:py-8 border-t border-gray-200">
        <button
          onClick={() => (showAddModal.value = true)}
          class="px-6 sm:px-8 py-2 sm:py-3 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800 transition-colors shadow-lg text-sm sm:text-lg flex items-center gap-2"
        >
          ➕ {t('addModuleBtn')}
        </button>
      </div>

      {showAddModal.value && <AddModuleModal onClose={() => (showAddModal.value = false)} onConfirm={handleAddModule} />}

      {editingModule.value && editModule && (
        <EditModuleModal
          moduleInstance={editModule}
          onClose={() => (editingModule.value = null)}
          onSave={(updated) => {
            updateModuleInstance(updated);
            editingModule.value = null;
          }}
        />
      )}

      {deletingModule.value && (
        <ConfirmationModal
          title={t('deleteModule')}
          message={t('deleteModuleConfirm')}
          confirmText={t('delete')}
          cancelText={t('cancel')}
          isDelete={true}
          onConfirm={() => {
            if (deletingModule.value) deleteModuleInstance(deletingModule.value);
            deletingModule.value = null;
          }}
          onCancel={() => (deletingModule.value = null)}
        />
      )}
    </div>
  );
}
