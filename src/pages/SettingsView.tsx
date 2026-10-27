import { currentLang, t } from '../i18n';
import type { Language } from '../i18n';
import { useState } from 'preact/hooks';
import { organizations, mergeOrganizations, sanitizeOrganizations } from '../store';
import { syncConfig, saveSyncConfig, syncState, syncNow, isConfigured } from '../sync';

function RegistroSection() {
  const [url, setUrl] = useState(syncConfig.value.url);
  const [code, setCode] = useState(syncConfig.value.code);
  const [user, setUser] = useState(syncConfig.value.user);
  const s = syncState.value;
  const input = 'w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-500 text-sm';

  return (
    <div class="mb-6 sm:mb-8 p-4 sm:p-6 border-2 border-brand-200 rounded-lg bg-white mx-4">
      <h3 class="mt-0 mb-2 text-base sm:text-lg font-bold text-brand-700">☁️ {t('registroTitle')}</h3>
      <p class="text-gray-600 text-xs sm:text-sm mb-4">{t('registroDesc')}</p>
      <form
        class="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          saveSyncConfig({ url, code, user });
        }}
      >
        <div>
          <label class="block text-xs sm:text-sm font-bold mb-1">{t('registroUrl')}</label>
          <input type="url" value={url} onInput={(e) => setUrl((e.target as HTMLInputElement).value)} placeholder="https://script.google.com/macros/s/…/exec" class={input} />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs sm:text-sm font-bold mb-1">{t('registroCode')}</label>
            <input type="password" value={code} onInput={(e) => setCode((e.target as HTMLInputElement).value)} class={input} autoComplete="off" />
          </div>
          <div>
            <label class="block text-xs sm:text-sm font-bold mb-1">{t('registroUser')}</label>
            <input type="text" value={user} onInput={(e) => setUser((e.target as HTMLInputElement).value)} placeholder={t('registroUserPlaceholder')} class={input} />
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" class="px-4 py-2 rounded text-white bg-brand-700 hover:bg-brand-800 font-bold text-sm">{t('registroSave')}</button>
          {isConfigured() && (
            <button type="button" onClick={() => void syncNow()} class="px-4 py-2 rounded border border-brand-700 text-brand-700 hover:bg-brand-50 font-medium text-sm">
              {t('registroSyncNow')}
            </button>
          )}
          <span class={`text-xs ${s.state === 'error' ? 'text-accent-700' : 'text-gray-600'}`}>
            {s.state === 'off' && t('registroStatusOff')}
            {s.state === 'syncing' && t('syncing')}
            {s.state === 'ok' && `${t('syncOk')} · ${s.last ? new Date(s.last).toLocaleTimeString('es-AR') : ''}`}
            {s.state === 'error' && `${t('syncError')}: ${s.message}`}
          </span>
        </div>
      </form>
    </div>
  );
}

export function SettingsView() {
  
  // --- EXPORT LOGIC ---
  const handleExport = () => {
    // 1. Convert the data to a JSON string
    const dataStr = JSON.stringify(organizations.value, null, 2);
    // 2. Create a Blob (a file-like object)
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    // 3. Create a temporary anchor tag to trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.download = `huella_plantas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- IMPORT LOGIC ---
  const handleImport = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Formato simple: lista de plantas. Formato de carga masiva: { plants: [...], remove: [ids] }.
        const list = Array.isArray(parsed) ? parsed : parsed?.plants;
        const remove: string[] = Array.isArray(parsed?.remove) ? parsed.remove.map(String) : [];
        const imported = sanitizeOrganizations(list);
        if (imported.length > 0) {
          const { added, updated, removed } = mergeOrganizations(imported, remove);
          let msg = t('importResult').replace('{added}', String(added)).replace('{updated}', String(updated));
          if (removed > 0) msg += ' ' + t('importRemoved').replace('{removed}', String(removed));
          alert(msg);
        } else {
          alert(t('importInvalid'));
        }
      } catch (err) {
        alert(t('importError'));
      }
      input.value = ""; // Reset the input
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-900">⚙️ {t('settings')}</h2>

      <RegistroSection />

      {/* --- LANGUAGE SELECTOR --- */}
      <div class="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-white mx-4">
        <h3 class="mt-0 mb-4 text-base sm:text-lg font-bold">{t('language')}</h3>
        <select 
          value={currentLang.value} 
          onChange={(e) => currentLang.value = (e.target as HTMLSelectElement).value as Language}
          class="w-full sm:max-w-xs p-2 border border-gray-300 rounded text-sm"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* --- EXPORT DATA --- */}
      <div class="mb-6 sm:mb-8 p-4 sm:p-6 border border-gray-200 rounded-lg bg-white mx-4">
        <h3 class="mt-0 mb-4 text-base sm:text-lg font-bold">{t('exportData')}</h3>
        <p class="text-gray-600 text-xs sm:text-sm mb-4">{t('exportDesc')}</p>
        <button onClick={handleExport} class="px-4 py-2 rounded text-white bg-gray-800 hover:bg-gray-900 font-medium text-sm">
          {t('downloadBtn')}
        </button>
      </div>

      {/* --- IMPORT DATA --- */}
      <div class="p-4 sm:p-6 border border-gray-200 rounded-lg bg-white mx-4">
        <h3 class="mt-0 mb-4 text-base sm:text-lg font-bold">{t('importData')}</h3>
        <p class="text-gray-600 text-xs sm:text-sm mb-4">{t('importDesc')}</p>
        <input 
          type="file" 
          accept=".json" 
          onChange={handleImport} 
          class="block w-full text-xs sm:text-sm border border-gray-300 p-2 rounded"
        />
      </div>

    </div>
  );
}