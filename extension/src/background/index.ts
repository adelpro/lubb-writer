// Background service worker

const isFirefox = navigator.userAgent.includes("Firefox");

const sendMessageToTab = (tabId: number, message: object) => {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, () => {
      if (chrome.runtime.lastError) {
        // Silently handle - content script might not be ready
      }
      resolve(null);
    });
  });
};

const injectContentScript = async (tabId: number): Promise<boolean> => {
  const file = "static/contents/inline.js";

  try {
    if (isFirefox) {
      // Firefox uses tabs.executeScript
      await chrome.tabs.executeScript(tabId, { file });
    } else {
      // Chrome uses scripting.executeScript
      if (chrome.scripting?.executeScript) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [file],
        });
      } else {
        await chrome.tabs.executeScript(tabId, { file });
      }
    }
    return true;
  } catch (err) {
    // Script might already be injected
    return false;
  }
};

const showModalInTab = async (tabId: number, message: object) => {
  // First inject the content script
  await injectContentScript(tabId);

  // Small delay to ensure script is ready
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Send the message
  await sendMessageToTab(tabId, message);
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: "enhanceWithLubb",
    title: "Enhance with Lubb Writer",
    contexts: ["selection"],
  });
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "enhanceWithLubb" && tab?.id) {
    const selectedText = info.selectionText?.trim() || "";
    if (selectedText) {
      showModalInTab(tab.id, {
        type: "SHOW_ENHANCE_MODAL",
        text: selectedText,
      });
    }
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "enhance-selection" && tab?.id) {
    showModalInTab(tab.id, {
      type: "GET_SELECTION_AND_SHOW_MODAL",
    });
  }
});
