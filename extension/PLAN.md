# Lubb Writer Extension - Development Plan

## Overview

Browser extension that enhances text anywhere in the browser using Lubb Writer API.

## Features

### Phase 1: Core Functionality
1. **Inline Enhancement Icon (Grammarly-style)**
   - Floating icon appears near text inputs/areas
   - Click icon → enhancement popup appears
   - Shows suggestions inline

2. **Text Selection Enhancement**
   - Right-click context menu → "Enhance with Lubb Writer"
   - Keyboard shortcut: Ctrl+Shift+E
   - Selected text sent to API

3. **Popup Interface**
   - Input textarea for text
   - Mode selector (humanize, rewrite, summarize, etc.)
   - Model selector (MiniMax, Claude, Gemini)
   - Enhance button
   - Copy result button

4. **API Integration**
   - Connect to lubb-writer-api (local or cloud)
   - Support custom endpoints
   - Handle authentication

### Phase 2: Advanced Features
5. **Options Page**
   - API endpoint configuration
   - Default mode selection
   - Default model selection
   - Theme (light/dark/system)
   - Enable/disable inline icon
   - Keyboard shortcuts configuration

6. **History**
   - Store last 50 enhancements
   - View and copy from history
   - Clear history option

### Phase 3: Platform Support
7. **Multi-Browser**
   - Chrome/Edge (Manifest V3)
   - Firefox (Manifest V2 compatible)

## Technical Stack

- **Framework:** WXT (modern Chrome extension tool)
- **UI:** Vanilla JS + CSS (lightweight)
- **Build:** Vite
- **Icons:** Lucide icons

## Project Structure

```
extension/
├── src/
│   ├── main.ts            # Entry point
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── content/
│   │   ├── content.ts     # Content script
│   │   ├── inlineIcon.ts  # Grammarly-style inline icon
│   │   └── styles.css
│   ├── background/
│   │   └── background.ts  # Service worker
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   └── utils/
│       ├── api.ts         # API client
│       ├── storage.ts     # Chrome storage
│       └── constants.ts
├── wxt.config.ts
├── package.json
└── tsconfig.json
```

## UI/UX Design

### Inline Icon (Grammarly-style)
```
┌─────────────────────────────────────────┐
│  Some text input here                   │
│                              ✨ icon     │  ← Floating icon
│  more text...                           │
└─────────────────────────────────────────┘

Click icon → Popup:
┌────────────────────────────┐
│ ✨ Lubb Writer        [X] │
├────────────────────────────┤
│ Your text here...         │
│                            │
│ Mode: [humanize ▼]        │
│ Model: [MiniMax ▼]        │
│                      [Enhance] │
├────────────────────────────┤
│ Enhanced result...         │
│                      [Copy] │
└────────────────────────────┘
```

### Color Palette
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Background: #ffffff / #1e1e2e
- Text: #1f2937 / #e5e7eb

## User Flows

### Flow 1: Inline Icon
1. User focuses on text input
2. ✨ icon appears on the right side
3. Click icon → popup opens
4. Select mode → click Enhance
5. Result shown → copy

### Flow 2: Selection
1. User selects text anywhere
2. Right-click → "Enhance with Lubb Writer"
3. OR press Ctrl+Shift+E
4. Popup with selected text
5. Continue from step 4 above

### Flow 3: Popup Direct
1. Click extension icon in toolbar
2. Enter/paste text manually
3. Select mode → enhance
4. Copy result

## API Integration

```typescript
// Enhance text
POST {API_URL}/enhance
{
  text: string,
  mode: string,
  model?: string
}

// Response
{
  result: string,
  model: string,
  usage: {...}
}
```

## Configuration Options

| Option | Type | Default |
|--------|------|---------|
| apiUrl | string | https://lubb-writer-api.adelpro.us.kg |
| apiToken | string | (user's token) |
| defaultMode | string | humanize |
| defaultModel | string | MiniMax-M2.1 |
| showInlineIcon | boolean | true |
| theme | light/dark/system | system |
| historyEnabled | boolean | true |

## Browser Support

| Browser | Manifest | Status |
|---------|----------|--------|
| Chrome | V3 | Primary |
| Edge | V3 | Compatible |
| Firefox | V2 | Supported from start |

## Milestones

| Milestone | Features |
|-----------|----------|
| M1 | Popup UI + API connection + Context menu |
| M2 | Inline icon (Grammarly-style) + Keyboard shortcuts |
| M3 | Options page |
| M4 | History feature |
| M5 | Firefox build |

## Next Steps

1. Initialize WXT project
2. Create popup UI
3. Add inline icon feature
4. Connect to Lubb Writer API
5. Test in Chrome
6. Build for Firefox
