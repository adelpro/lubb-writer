// Background service worker
import type { PlasmoMessaging } from "@plasmohq/messaging";

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "enhance-selection") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) return;

    // Get selected text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || "",
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
    id: "enhanceWithLubb",
    title: "✨ Enhance with Lubb Writer",
    contexts: ["selection", "editable"],
  });
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "enhanceWithLubb" && tab?.id) {
    let text = info.selectionText || "";

    if (!text && info.editable) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
          return el?.value || "";
        },
      });
      text = results[0]?.result || "";
    }

    if (text) {
      await chrome.storage.session.set({ pendingText: text });
      chrome.action.openPopup();
    }
  }
});

// Message handler
export const handler: PlasmoMessaging.MessageHandler = async (req) => {
  if (req.body?.type === "getSettings") {
    const settings = await chrome.storage.sync.get(null);
    return { data: settings };
  }
  
  if (req.body?.type === "saveSettings") {
    await chrome.storage.sync.set(req.body.settings);
    return { success: true };
  }
};
