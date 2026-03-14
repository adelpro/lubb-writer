// Options page script
import { getSettings, saveSettings, Settings } from '../utils/api';

const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
const apiTokenInput = document.getElementById('apiToken') as HTMLInputElement;
const defaultModeSelect = document.getElementById('defaultMode') as HTMLSelectElement;
const defaultModelSelect = document.getElementById('defaultModel') as HTMLSelectElement;
const showInlineIconCheckbox = document.getElementById('showInlineIcon') as HTMLInputElement;
const historyEnabledCheckbox = document.getElementById('historyEnabled') as HTMLInputElement;
const themeSelect = document.getElementById('theme') as HTMLSelectElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const savedMsg = document.getElementById('savedMsg') as HTMLSpanElement;

// Load settings
async function loadSettings() {
  const settings = await getSettings();
  
  apiUrlInput.value = settings.apiUrl || '';
  apiTokenInput.value = settings.apiToken || '';
  defaultModeSelect.value = settings.defaultMode || 'humanize';
  defaultModelSelect.value = settings.defaultModel || 'MiniMax-M2.1';
  showInlineIconCheckbox.checked = settings.showInlineIcon !== false;
  historyEnabledCheckbox.checked = settings.historyEnabled !== false;
  themeSelect.value = settings.theme || 'system';
}

// Save settings
async function handleSave() {
  const settings: Partial<Settings> = {
    apiUrl: apiUrlInput.value.trim(),
    apiToken: apiTokenInput.value,
    defaultMode: defaultModeSelect.value,
    defaultModel: defaultModelSelect.value,
    showInlineIcon: showInlineIconCheckbox.checked,
    historyEnabled: historyEnabledCheckbox.checked,
    theme: themeSelect.value as 'light' | 'dark' | 'system',
  };

  await saveSettings(settings);
  
  savedMsg.classList.remove('hidden');
  setTimeout(() => {
    savedMsg.classList.add('hidden');
  }, 2000);
}

// Event listeners
saveBtn.addEventListener('click', handleSave);

// Load on start
loadSettings();
