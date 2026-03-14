# Lubb Writer API

AI-powered text enhancement API with multiple writing modes and multi-provider AI support.

## Features

- 🔐 **Bearer Token Auth** - Secure API authentication
- 📝 **13 Writing Modes** - Rewrite, summarize, humanize, grammar, formal, casual, academic, SEO, persuasive, creative, twitter, linkedin, story
- 🤖 **Multi-Provider AI** - OpenAI, MiniMax, Anthropic (Claude), Google (Gemini)
- 🐳 **Docker** - Production-ready container with healthcheck
- ⚡ **Fast** - Choose your preferred AI provider

## Quick Start

```bash
# 1. Copy config
cp .env.example .env

# 2. Add your API key (see Configuration below)

# 3. Build and run
docker compose up -d

# 4. Test
curl http://localhost:3003/health
```

## Configuration

### Required: API Key

Lubb Writer supports multiple AI providers. Configure **at least one**:

| Provider               | Key                 | Get Key From          |
| ---------------------- | ------------------- | --------------------- |
| **OpenAI/MiniMax**     | `OPENAI_API_KEY`    | OpenAI or MiniMax     |
| **Anthropic (Claude)** | `ANTHROPIC_API_KEY` | console.anthropic.com |
| **Google (Gemini)**    | `GOOGLE_API_KEY`    | aistudio.google.com   |

Example `.env`:

```bash
# Choose one or more
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_API_KEY=AIza...
```

### Optional: API Token

```bash
API_TOKEN=your-secure-token
```

## Supported Models

### OpenAI / MiniMax

- `gpt-4o` - GPT-4 Omni
- `gpt-4o-mini` - GPT-4 Omni Mini
- `MiniMax-M2.1` - MiniMax (default)
- `MiniMax-M2.5` - MiniMax v2.5

### Anthropic (Claude)

- `claude-3-5-sonnet` - Claude 3.5 Sonnet
- `claude-3-opus` - Claude 3 Opus
- `claude-3-haiku` - Claude 3 Haiku

### Google (Gemini)

- `gemini-2.0-flash` - Gemini 2.0 Flash
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

## Custom Models (OpenAI-Compatible)

You can use **any OpenAI-compatible endpoint** with Lubb Writer:

### Supported

- **Ollama** - Local AI models
- **LM Studio** - Local LLM hosting
- **KoboldCPP** - Local AI
- **Text Generation WebUI** - Local LLM
- **MiniMax** - Cloud AI
- **Any OpenAI-compatible API**

### Configuration

Add to your `.env`:

```bash
# Custom OpenAI-compatible endpoint
OPENAI_API_KEY=any-key-or-leave-blank
OPENAI_BASE_URL=http://localhost:11434/v1

# Use any model name your endpoint supports
```

### Examples

#### Ollama (Local)

```bash
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
```

Then use model: `llama3`, `mistral`, `codellama`, etc.

#### LM Studio

```bash
OPENAI_API_KEY=local
OPENAI_BASE_URL=http://localhost:1234/v1
```

#### MiniMax

```bash
OPENAI_API_KEY=your-minimax-key
OPENAI_BASE_URL=https://api.minimax.io/v1
```

#### Custom Cloud API

```bash
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://your-endpoint.com/v1
```

### Usage

```bash
curl -X POST http://localhost:3003/enhance \
  -H "Authorization: Bearer token" \
  -d '{"text": "hello", "mode": "humanize", "model": "llama3"}'
```

## API Reference

### Authentication

```bash
Authorization: Bearer your-token
```

### Endpoints

#### Health Check

```bash
curl http://localhost:3003/health
```

#### List Available Models

```bash
curl http://localhost:3003/models -H "Authorization: Bearer your-token"
```

#### Enhance Text

```bash
curl -X POST http://localhost:3003/enhance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "mode": "humanize",
    "text": "Your text here",
    "model": "MiniMax-M2.1"
  }'
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to transform |
| `mode` | string | Yes* | Transformation mode |
| `prompt` | string | Yes* | Custom prompt with {text} |
| `model` | string | No | AI model (default: MiniMax-M2.1) |

#### Available Modes

| Mode       | Description        |
| ---------- | ------------------ |
| rewrite    | Clearer, engaging  |
| summarize  | Concise            |
| humanize   | Remove AI patterns |
| grammar    | Fix errors         |
| formal     | Professional       |
| casual     | Friendly           |
| academic   | Academic style     |
| seo        | SEO optimized      |
| persuasive | Argument + CTA     |
| creative   | Creative writing   |
| twitter    | Under 280 chars    |
| linkedin   | LinkedIn format    |
| story      | Narrative          |

#### Custom Prompt

```bash
curl -X POST http://localhost:3003/custom \
  -H "Authorization: Bearer your-token" \
  -d '{"prompt": "Translate to French: {text}", "text": "Hello"}'
```

## Deployment

### Docker Compose

```yaml
services:
  lubb-writer-api:
    build: .
    ports:
      - "3003:3001"
    env_file:
      - .env
```

### Expose to Internet

Use any reverse proxy (Nginx, Cloudflare Tunnel, Traefik, Caddy). Point to: `http://localhost:3003`

## Rate Limits

- AI endpoints: 10/min
- General: 30/min

## License

MIT License
