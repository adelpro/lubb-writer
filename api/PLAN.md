# AI Text Enhancer Extension Plan

## Project Overview

**Name:** OpenText AI (or similar)

**Purpose:** Browser extension that enhances text in any input field across websites — similar to Voila AI but focused on text editing.

---

## Core Features

### 1. Text Selection Enhancement
- Select any text in input fields, textareas, contenteditable
- Right-click context menu with enhancement options
- Floating toolbar on text selection

### 2. Enhancement Options
- **Rewrite** — Rephrase while keeping meaning
- **Shorten** — Condense text
- **Expand** — Elaborate on ideas
- **Formal** — Convert to formal tone
- **Casual** — Convert to casual tone
- **Fix Grammar** — Correct errors
- **Translate** — Translate to/from languages
- **Summarize** — Create brief summary

### 3. AI Integration
- Use OpenClaw's API or direct LLM (OpenAI/Anthropic)
- Streaming responses for real-time feedback
- Custom prompt templates

### 4. Input Field Support
- Standard `<input>` and `<textarea>`
- Contenteditable elements
- Rich text editors (Medium, Google Docs, etc.)
- Code editors

---

## Technical Stack

- **Framework:** Plasmo (like open-muezzin)
- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (persist settings)
- **Storage:** chrome.storage.local for settings/prompts
- **Build:** Vite + pnpm

---

## Architecture

```
src/
├── components/
│   ├── Popup/          # Extension popup UI
│   ├── Toolbar/        # Floating toolbar
│   ├── Settings/       # Options page
│   └── Sidebar/        # Slide-out panel
├── hooks/
│   ├── useSelection.ts # Detect text selection
│   └── useAI.ts        # AI API calls
├── lib/
│   ├── content-script.ts # Injected into pages
│   ├── ai-provider.ts    # LLM integration
│   └── storage.ts        # Chrome storage
├── stores/
│   └── settings.ts     # User preferences
└── background/
    └── service-worker.ts
```

---

## Key Implementation Details

### Content Script Injection
- Inject into all URLs (or specific patterns)
- Listen for `mouseup` events to detect selections
- Show floating toolbar near selection

### API Options
1. **OpenClaw Gateway** — Use existing AI infrastructure
2. **Direct OpenAI API** — GPT-4 for best results
3. **Anthropic API** — Claude for long-form

### Chrome Storage Schema
```typescript
interface Settings {
  apiKey: string;
  defaultTone: 'formal' | 'casual' | 'neutral';
  language: string;
  hotkey: string;
  savedPrompts: Prompt[];
}
```

---

## Development Phases

### Phase 1: MVP (1-2 weeks)
- Basic text selection detection
- Simple rewrite via API
- Popup UI with input
- Chrome storage for API key

### Phase 2: Features (2-3 weeks)
- Multiple enhancement modes
- Context menu integration
- Keyboard shortcuts
- Settings page

### Phase 3: Polish (1-2 weeks)
- Floating toolbar
- Animation/transitions
- Dark mode
- Cross-browser testing

---

## API Key Management

- User provides their own API key
- Stored securely in chrome.storage
- Optional: API key management page

---

## Differentiation from Voila

| Feature | Voila | Our Extension |
|---------|--------|---------------|
| Scope | General AI | Text-focused |
| UI | Sidebar | Inline + Toolbar |
| Price | Subscription | Free (user's API) |
| Privacy | Cloud processing | User controls data |

---

## Next Steps

1. Initialize project with Plasmo
2. Set up basic popup UI
3. Implement text selection detection
4. Connect to AI API
5. Build enhancement modes
6. Test across websites
