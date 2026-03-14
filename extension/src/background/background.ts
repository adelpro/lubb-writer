// Background service worker
import { getSettings, saveSettings } from '../utils/api';

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'enhance-selection') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) return;

    // Get selected text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ''
    });

    const selectedText = results[0]?.result;

    if (selectedText && selectedText.length > 0) {
      // Open popup with selected text
      chrome.action.openPopup();
    }
  }
});

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'enhanceWithLubb',
    title: '✨ Enhance with Lubb Writer',
    contexts: ['selection', 'editable']
  });
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'enhanceWithLubb' && tab?.id) {
    // Get the text
    let text = info.selectionText || '';
    
    if (!text && info.editable) {
      // For editable fields, inject script to get value
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
          return el?.value || '';
        }
      });
      text = results[0]?.result || '';
    }

    if (text) {
      // Store in storage to pass to popup
      await chrome.storage.session.set({ pendingText: text });
      chrome.action.openPopup();
    }
  }
});

// Listen for messages from popup/content
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'getSettings') {
    getSettings().then(sendResponse);
    return true;
  }
  
  if (message.type === 'saveSettings') {
    saveSettings(message.settings).then(() => sendResponse({ success: true }));
    return true;
  }
});
