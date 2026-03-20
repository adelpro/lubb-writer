# Lubb - Writer - Browser Extension

AI-powered text enhancement extension for Chrome and Firefox.

## Features

- **Popup UI**: Enter text and enhance with AI
- **Multiple Modes**: Humanize, rewrite, summarize, grammar, formal, casual, academic, SEO, persuasive, creative, Twitter, LinkedIn, story
- **Multi-Provider**: Supports MiniMax, OpenAI, Claude, Gemini
- **Keyboard Shortcut**: Ctrl+Shift+Y to enhance selected text
- **Theme Support**: Light, dark, and system themes
- **Privacy**: All processing done via your own API

## Development

```bash
# Install dependencies
yarn install

# Run in development (Chrome)
yarn dev

# Run in development (Firefox)
yarn dev:firefox

# Build for Chrome
yarn build:chrome

# Build for Firefox
yarn build:firefox
```

## Keyboard Shortcut

- Windows/Linux: Ctrl+Shift+Y
- Mac: Command+Shift+Y

## API Configuration

The extension requires a Lubb - Writer API endpoint. You can:

1. Use the hosted version: `https://lubb-writer-api.adelpro.us.kg`
2. Run locally: `http://localhost:3001`
3. Deploy your own using the `api/` folder

## Browser Support

- Chrome (Manifest V3)
- Firefox (Manifest V3)
- Edge (Chromium-based)
