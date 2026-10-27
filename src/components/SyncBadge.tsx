import { syncState, syncNow, isConfigured, syncConfig } from '../sync';
import { currentView } from '../store';
import { t } from '../i18n';

/** Indicador del estado del registro central en la barra superior. */
export function SyncBadge() {
  void syncConfig.value; // re-render cuando cambia la configuración
  const s = syncState.value;

  if (!isConfigured()) {
    return (
      <button
        onClick={() => (currentView.value = 'settings')}
        class="px-2 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
        title={t('syncOffTitle')}
      >
        ☁️ <span class="hidden sm:inline">{t('syncOff')}</span>
      </button>
    );
  }

  const styles: Record<string, string> = {
    syncing: 'bg-brand-50 text-brand-700',
    ok: 'bg-brand-50 text-brand-700',
    error: 'bg-accent-50 text-accent-700',
    off: 'bg-gray-100 text-gray-600',
  };
  const label =
    s.state === 'syncing' ? t('syncing') : s.state === 'error' ? t('syncError') : t('syncOk');
  const icon = s.state === 'syncing' ? '⏳' : s.state === 'error' ? '⚠️' : '✅';

  return (
    <button
      onClick={() => void syncNow()}
      class={`px-2 py-1 rounded-md text-[11px] font-medium ${styles[s.state]}`}
      title={s.state === 'error' ? `${s.message} – ${t('syncRetry')}` : t('syncRetry')}
    >
      {icon} <span class="hidden sm:inline">{label}</span>
    </button>
  );
}
