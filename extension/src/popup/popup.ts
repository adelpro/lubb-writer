// Popup script
import { enhanceText, getSettings } from '../utils/api';

const inputText = document.getElementById('inputText') as HTMLTextAreaElement;
const resultText = document.getElementById('resultText') as HTMLTextAreaElement;
const modeSelect = document.getElementById('mode') as HTMLSelectElement;
const modelSelect = document.getElementById('model') as HTMLSelectElement;
const enhanceBtn = document.getElementById('enhanceBtn') as HTMLButtonElement;
const copyBtn = document.getElementById('copyBtn') as HTMLButtonElement;
const resultSection = document.getElementById('resultSection')!;
const loading = document.getElementById('loading')!;
const errorDiv = document.getElementById('error')!;
const settingsLink = document.getElementById('settingsLink') as HTMLAnchorElement;

// Load saved settings
async function loadSettings() {
  const settings = await getSettings();
  if (settings.defaultMode) {
    modeSelect.value = settings.defaultMode;
  }
  if (settings.defaultModel) {
    modelSelect.value = settings.defaultModel;
  }
}

// Handle enhance
async function handleEnhance() {
  const text = inputText.value.trim();
  if (!text) {
    showError('Please enter some text');
    return;
  }

  showLoading(true);
  hideError();
  resultSection.classList.add('hidden');

  try {
    const result = await enhanceText(text, modeSelect.value, modelSelect.value);
    resultText.value = result.result;
    resultSection.classList.remove('hidden');
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Failed to enhance text');
  } finally {
    showLoading(false);
  }
}

// Copy result
async function copyResult() {
  await navigator.clipboard.writeText(resultText.value);
  copyBtn.textContent = '✅ Copied!';
  setTimeout(() => {
    copyBtn.textContent = '📋 Copy';
  }, 2000);
}

function showLoading(show: boolean) {
  if (show) {
    loading.classList.remove('hidden');
    enhanceBtn.disabled = true;
  } else {
    loading.classList.add('hidden');
    enhanceBtn.disabled = false;
  }
}

function showError(msg: string) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  errorDiv.classList.add('hidden');
}

// Open settings
settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});

// Event listeners
enhanceBtn.addEventListener('click', handleEnhance);
copyBtn.addEventListener('click', copyResult);

// Handle keyboard shortcuts
document.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    
    // Get selected text from active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection()?.toString()
      });
      
      if (results[0]?.result) {
        inputText.value = results[0].result;
        handleEnhance();
      }
    }
  }
});

// Load settings on start
loadSettings();
