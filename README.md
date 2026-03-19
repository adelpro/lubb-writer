# Lubb Writer

AI-powered text enhancement tool with multiple writing modes and multi-provider AI support. Includes both a REST API and browser extension.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Lubb Writer                          │
│                                                         │
│  ┌─────────────────┐         ┌──────────────────┐      │
│  │  Browser         │         │   REST API       │      │
│  │  Extension       │────>    │   (Express.js)   │      │
│  │  (Frontend)      │         │                  │      │
│  └─────────────────┘         └────────┬─────────┘      │
│                                        │                │
│                               ┌────────▼─────────┐      │
│                               │   AI Providers   │      │
│                               │   OpenAI, Gemini │      │
│                               │   Claude, MiniMax│      │
│                               └─────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

- **🔐 Secure API** - Bearer token authentication
- **📝 13 Writing Modes** - Rewrite, summarize, humanize, grammar, formal, casual, academic, SEO, persuasive, creative, Twitter, LinkedIn, story
- **🤖 Multi-Provider AI** - Use OpenAI, Anthropic Claude, Google Gemini, or MiniMax
- **🌐 Browser Extension** - Enhance text directly from any webpage
- **⌨️ Keyboard Shortcuts** - Enhance selected text with Ctrl+Shift+L
- **🐳 Docker Ready** - Deploy anywhere with Docker
- **📚 Interactive Docs** - Swagger UI at `/docs`

## 📦 Projects

### [API](./api/) - REST API Backend

Express.js API with TypeScript, featuring:

- RESTful endpoints for all enhancement modes
- Multi-provider AI integration
- Rate limiting and authentication
- Swagger documentation
- Docker deployment

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

Cross-browser extension (Chrome, Firefox, Edge) featuring:

- Popup UI for text enhancement
- Inline selection enhancement
- Theme support (light/dark/system)
- Multiple enhancement modes

**Quick Start:**

```bash
cd extension
yarn install
yarn dev
# Load the extension from build/chrome directory
```

## 🚀 Quick Start

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

## 📚 Documentation

- **API Documentation**: [api/README.md](./api/README.md)
- **Extension Documentation**: [extension/README.md](./extension/README.md)
- **Interactive API Docs**: Run the API and visit `/docs`

## 🛠️ Tech Stack

**Backend:**

- TypeScript
- Express.js
- OpenAI SDK
- Anthropic SDK
- Google Generative AI
- Swagger/OpenAPI

**Frontend:**

- TypeScript
- React
- TailwindCSS
- Plasmo (extension framework)

**Infrastructure:**

- Docker
- Docker Compose
- GitHub Actions (CI/CD)

## 📄 License

MIT License - see individual project folders for details.
