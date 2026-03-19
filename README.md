# Lubb Writer

AI-powered text enhancement tool that transforms your writing with multiple modes and multi-provider AI support. Includes both a REST API and browser extension.

## Overview

Lubb Writer helps you improve any text with AI. Choose from 13 different writing modes, connect to your preferred AI provider, and enhance text directly from your browser or via API.

## Architecture

```
Browser Extension  ─────>  REST API  ─────>  AI Providers
    (Frontend)              (Express)         OpenAI, Gemini
                                                     Claude, Custom
```

## Features

- **13 Writing Modes**: Rewrite, summarize, humanize, grammar, formal, casual, academic, SEO, persuasive, creative, Twitter, LinkedIn, story
- **Multi-Provider AI**: Use OpenAI, Anthropic Claude, Google Gemini, or add up to 10 custom OpenAI-compatible providers (MiniMax, Ollama, LM Studio, Groq, etc.)
- **Browser Extension**: Enhance text directly from any webpage with inline selection or popup
- **Keyboard Shortcuts**: Enhance selected text with Ctrl+Shift+L
- **Docker Ready**: Deploy the API anywhere with Docker
- **Interactive Docs**: Swagger UI documentation at `/docs`

## Projects

### [API](./api/) - REST API Backend

Express.js API with TypeScript for text enhancement.

**Quick Start:**

```bash
cd api
cp .env.example .env
# Edit .env with your API keys
yarn dev
# API available at http://localhost:3001
# Docs at http://localhost:3001/docs
```

### [Extension](./extension/) - Browser Extension

Cross-browser extension for Chrome, Firefox, and Edge.

**Quick Start:**

```bash
cd extension
yarn install
yarn dev
# Load the extension from build/chrome directory
```

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn 4+
- Docker (optional, for containerized deployment)

### Local Development

```bash
# Install all dependencies
yarn install

# Start API (requires .env configuration)
yarn dev:api

# OR start extension (requires API running)
yarn dev:extension
```

### Production Deployment

```bash
# API only
cd api
docker compose up -d

# Full stack deployment
# Deploy API and configure extension with your endpoint
```

## Documentation

- [API Documentation](./api/README.md)
- [Extension Documentation](./extension/README.md)
- **Interactive API Docs**: Run the API and visit `/docs`

## Tech Stack

**Backend:**

- TypeScript, Express.js, OpenAI SDK, Anthropic SDK, Google Generative AI, Swagger/OpenAPI

**Frontend:**

- TypeScript, React, TailwindCSS, Plasmo (extension framework)

**Infrastructure:**

- Docker, Docker Compose, GitHub Actions (CI/CD)

## License

MIT License - see individual project folders for details.
