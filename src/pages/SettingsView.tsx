import { currentLang, t } from '../i18n';
import type { Language } from '../i18n';
import { organizations, mergeOrganizations, sanitizeOrganizations } from '../store';

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
        const imported = sanitizeOrganizations(parsed);
        if (Array.isArray(parsed) && imported.length > 0) {
          const { added, updated } = mergeOrganizations(imported);
          alert(t('importResult').replace('{added}', String(added)).replace('{updated}', String(updated)));
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