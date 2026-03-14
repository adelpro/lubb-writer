// Content script - Grammarly-style inline icon
import { getSettings } from '../utils/api';

let iconElement: HTMLElement | null = null;
let popupElement: HTMLElement | null = null;
let currentInput: HTMLInputElement | HTMLTextAreaElement | null = null;

async function init() {
  const settings = await getSettings();
  
  if (!settings.showInlineIcon) {
    return;
  }

  // Watch for text inputs
  document.addEventListener('focusin', handleFocus, true);
  document.addEventListener('focusout', handleBlur, true);
}

function handleFocus(e: Event) {
  const target = e.target as HTMLElement;
  
  if (target.matches('input[type="text"], input[type="email"], input[type="search"], textarea')) {
    currentInput = target as HTMLInputElement | HTMLTextAreaElement;
    
    // Don't show on password fields
    if (currentInput.type === 'password') {
      return;
    }

    // Check if input has meaningful content
    if (currentInput.value.length > 10) {
      showIcon(currentInput);
    }
  }
}

function handleBlur(e: Event) {
  // Delay to allow clicking on icon
  setTimeout(() => {
    if (!popupElement?.contains(e.relatedTarget as Node)) {
      hidePopup();
    }
  }, 200);
}

function showIcon(input: HTMLElement) {
  if (iconElement) {
    iconElement.remove();
  }

  iconElement = document.createElement('span');
  iconElement.className = 'lubb-icon';
  iconElement.innerHTML = '✨';
  iconElement.title = 'Enhance with Lubb Writer';
  
  // Position next to input
  const rect = input.getBoundingClientRect();
  iconElement.style.cssText = `
    position: absolute;
    right: ${rect.width - 30}px;
    top: ${rect.top + 5}px;
    z-index: 999999;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    background: #6366f1;
    border-radius: 4px;
    color: white;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;

  iconElement.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showPopup(input);
  });

  // Position relative if needed
  const parent = input.parentElement;
  if (parent && getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  document.body.appendChild(iconElement);
}

function hideIcon() {
  if (iconElement) {
    iconElement.remove();
    iconElement = null;
  }
}

function showPopup(input: HTMLInputElement | HTMLTextAreaElement) {
  hidePopup();

  popupElement = document.createElement('div');
  popupElement.className = 'lubb-popup';
  popupElement.innerHTML = `
    <div class="lubb-popup-header">
      <span>✨ Lubb Writer</span>
      <button class="lubb-close">&times;</button>
    </div>
    <div class="lubb-popup-content">
      <textarea class="lubb-input" placeholder="Enter text...">${input.value}</textarea>
      <div class="lubb-options">
        <select class="lubb-mode">
          <option value="humanize">Humanize</option>
          <option value="rewrite">Rewrite</option>
          <option value="summarize">Summarize</option>
          <option value="grammar">Grammar</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </select>
      </div>
      <button class="lubb-enhance">✨ Enhance</button>
      <div class="lubb-result hidden">
        <textarea class="lubb-result-text" readonly></textarea>
        <button class="lubb-copy">📋 Copy</button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .lubb-popup {
      position: absolute;
      top: ${input.getBoundingClientRect().top + window.scrollY + 40}px;
      left: ${input.getBoundingClientRect().left + window.scrollX}px;
      width: 320px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 1000000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .lubb-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
    }
    .lubb-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
    }
    .lubb-popup-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .lubb-input, .lubb-result-text {
      width: 100%;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      resize: vertical;
    }
    .lubb-options select {
      width: 100%;
      padding: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
    }
    .lubb-enhance {
      padding: 10px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .lubb-enhance:hover {
      background: #4f46e5;
    }
    .lubb-result {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lubb-result.hidden {
      display: none;
    }
    .lubb-copy {
      padding: 8px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(popupElement);

  // Event handlers
  popupElement.querySelector('.lubb-close')?.addEventListener('click', hidePopup);
  popupElement.querySelector('.lubb-enhance')?.addEventListener('click', handleEnhance);
  popupElement.querySelector('.lubb-copy')?.addEventListener('click', handleCopy);
}

function hidePopup() {
  if (popupElement) {
    popupElement.remove();
    popupElement = null;
  }
  hideIcon();
}

async function handleEnhance() {
  const input = popupElement?.querySelector('.lubb-input') as HTMLTextAreaElement;
  const mode = popupElement?.querySelector('.lubb-mode') as HTMLSelectElement;
  const resultDiv = popupElement?.querySelector('.lubb-result') as HTMLElement;
  const resultText = popupElement?.querySelector('.lubb-result-text') as HTMLTextAreaElement;
  const enhanceBtn = popupElement?.querySelector('.lubb-enhance') as HTMLButtonElement;

  if (!input?.value.trim()) return;

  enhanceBtn.textContent = '⏳ Enhancing...';
  enhanceBtn.disabled = true;

  try {
    // Import dynamically to avoid issues
    const { enhanceText } = await import('../utils/api');
    const result = await enhanceText(input.value, mode.value);
    
    resultText.value = result.result;
    resultDiv.classList.remove('hidden');
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to enhance');
  } finally {
    enhanceBtn.textContent = '✨ Enhance';
    enhanceBtn.disabled = false;
  }
}

async function handleCopy() {
  const resultText = popupElement?.querySelector('.lubb-result-text') as HTMLTextAreaElement;
  const copyBtn = popupElement?.querySelector('.lubb-copy') as HTMLButtonElement;
  
  await navigator.clipboard.writeText(resultText.value);
  copyBtn.textContent = '✅ Copied!';
  setTimeout(() => {
    copyBtn.textContent = '📋 Copy';
  }, 2000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
