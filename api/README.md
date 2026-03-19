# Lubb Writer API

REST API for AI-powered text enhancement with multiple writing modes and multi-provider support.

## Features

- **Bearer Token Authentication**: Secure API access with optional token-based auth
- **13 Writing Modes**: Rewrite, summarize, humanize, grammar, formal, casual, academic, SEO, persuasive, creative, twitter, linkedin, story
- **Multi-Provider AI**: OpenAI, Anthropic (Claude), Google (Gemini), and custom OpenAI-compatible providers
- **Flexible Configuration**: Support for up to 10 custom OpenAI-compatible providers simultaneously
- **Docker Ready**: Production-ready container with healthcheck

## Quick Start

```bash
# 1. Copy config
cp .env.example .env

# 2. Add your API keys (see Configuration below)

# 3. Build and run
docker compose up -d

# 4. Test
curl http://localhost:3003/health
```

## Configuration

### Overview

Lubb Writer supports multiple AI providers through environment variables. At least one provider must be configured.

### Standard Providers

#### OpenAI

```bash
OPENAI_API_KEY=sk-your_openai_key_here
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional, defaults to OpenAI
OPENAI_MODELS=gpt-4o,gpt-4o-mini  # Optional, defaults to gpt-4o,gpt-4o-mini
```

#### Anthropic (Claude)

```bash
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
ANTHROPIC_MODELS=claude-3-5-sonnet,claude-3-opus  # Optional
```

#### Google (Gemini)

```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODELS=gemini-1.5-flash,gemini-1.5-pro  # Optional
```

### Custom OpenAI-Compatible Providers

You can configure up to 10 custom OpenAI-compatible providers (MiniMax, Ollama, LM Studio, Groq, Together AI, etc.).

Each provider requires:

- `BASE_URL` - The API endpoint
- `MODELS` - Comma-separated list of model names

Optional:

- `NAME` - Custom display name (auto-detected from baseURL if not provided)

#### MiniMax

```bash
CUSTOM_PROVIDER_1_API_KEY=your_minimax_key_here
CUSTOM_PROVIDER_1_BASE_URL=https://api.minimax.io/v1
CUSTOM_PROVIDER_1_NAME=MiniMax
CUSTOM_PROVIDER_1_MODELS=MiniMax-M2.1,MiniMax-M2.1-lightning
```

#### Ollama (Local)

```bash
CUSTOM_PROVIDER_2_API_KEY=  # Ollama doesn't require API key
CUSTOM_PROVIDER_2_BASE_URL=http://localhost:11434/v1
CUSTOM_PROVIDER_2_MODELS=llama2,mistral,qwen
```

#### LM Studio (Local)

```bash
CUSTOM_PROVIDER_3_API_KEY=sk-local  # May vary by setup
CUSTOM_PROVIDER_3_BASE_URL=http://localhost:1234/v1
CUSTOM_PROVIDER_3_MODELS=text-gen
```

#### Groq

```bash
CUSTOM_PROVIDER_4_API_KEY=gsk_your_key_here
CUSTOM_PROVIDER_4_BASE_URL=https://api.groq.com/openai/v1
CUSTOM_PROVIDER_4_MODELS=llama-3.1-70b-versatile,mixtral-8x7b-32768
```

#### Together AI

```bash
CUSTOM_PROVIDER_5_API_KEY=your_together_key_here
CUSTOM_PROVIDER_5_BASE_URL=https://api.together.xyz/v1
CUSTOM_PROVIDER_5_MODELS=meta-llama/Llama-3-70b-chat-hf
```

### Authentication (Optional)

```bash
API_TOKEN=your-secure-token
```

## Supported Models

### Default Models

If you don't specify model lists, these defaults are used:

| Provider | Default Model |
|----------|---------------|
| OpenAI | gpt-4o, gpt-4o-mini |
| Anthropic | claude-3-5-sonnet |
| Google | gemini-1.5-flash |

### Complete Model Reference

#### OpenAI Models

- `gpt-4o` - GPT-4 Omni
- `gpt-4o-mini` - GPT-4 Omni Mini
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-3.5-turbo` - GPT-3.5 Turbo

#### Anthropic Models

- `claude-3-5-sonnet` - Claude 3.5 Sonnet
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (latest)
- `claude-3-opus` - Claude 3 Opus
- `claude-3-sonnet` - Claude 3 Sonnet
- `claude-3-haiku` - Claude 3 Haiku

#### Google Models

- `gemini-2.0-flash` - Gemini 2.0 Flash
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash
- `gemini-1.5-flash-8b` - Gemini 1.5 Flash 8B

#### MiniMax Models

- `MiniMax-M2.1` - MiniMax M2.1 (default)
- `MiniMax-M2.1-lightning` - MiniMax M2.1 Lightning
- `MiniMax-M2.5` - MiniMax M2.5

#### Ollama Models

- `llama2` - Llama 2
- `llama3` - Llama 3
- `mistral` - Mistral
- `mixtral` - Mixtral
- `qwen` - Qwen
- `codellama` - Code Llama

## API Reference

### Authentication

```bash
Authorization: Bearer your-token
```

### Endpoints

#### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "ok",
  "version": "1.1.0",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### List Available Models

```bash
GET /models
```

Response:

```json
{
  "models": [
    {
      "name": "gpt-4o",
      "provider": "openai",
      "providerName": "OpenAI",
      "baseURL": "https://api.openai.com/v1"
    },
    {
      "name": "MiniMax-M2.1",
      "provider": "openai",
      "providerName": "MiniMax",
      "baseURL": "https://api.minimax.io/v1"
    },
    {
      "name": "claude-3-5-sonnet",
      "provider": "anthropic",
      "providerName": "Anthropic",
      "baseURL": "https://api.anthropic.com"
    }
  ]
}
```

#### Enhance Text

```bash
POST /enhance
```

Request:

```json
{
  "text": "Your text here",
  "mode": "humanize",
  "model": "gpt-4o"
}
```

Response:

```json
{
  "result": "Enhanced text...",
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 150,
    "total_tokens": 250
  }
}
```

#### Custom Enhancement

```bash
POST /custom
```

Request:

```json
{
  "text": "Your text here",
  "systemPrompt": "Your custom system prompt",
  "model": "gpt-4o"
}
```

### Writing Modes

Available modes: `rewrite`, `summarize`, `humanize`, `grammar`, `formal`, `casual`, `academic`, `seo`, `persuasive`, `creative`, `twitter`, `linkedin`, `story`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `API_TOKEN` | No | Bearer token for authentication |
| `OPENAI_API_KEY` | Conditional | OpenAI API key (required if no other provider) |
| `OPENAI_BASE_URL` | No | OpenAI base URL (default: <https://api.openai.com/v1>) |
| `OPENAI_MODELS` | No | Comma-separated model list |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `ANTHROPIC_MODELS` | No | Comma-separated model list |
| `GOOGLE_API_KEY` | No | Google API key |
| `GOOGLE_MODELS` | No | Comma-separated model list |
| `CUSTOM_PROVIDER_N_API_KEY` | No | API key for custom provider N |
| `CUSTOM_PROVIDER_N_BASE_URL` | Conditional | Base URL for custom provider N |
| `CUSTOM_PROVIDER_N_NAME` | No | Display name (auto-detected from baseURL) |
| `CUSTOM_PROVIDER_N_MODELS` | Conditional | Models for custom provider N |
| `DEFAULT_MODEL` | No | Default model (auto-selected if not set) |

## Examples

### Example 1: Basic Setup

```bash
# .env
OPENAI_API_KEY=sk-...
API_TOKEN=my-secret-token
```

### Example 2: Multiple Providers

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

### Example 3: Local + Cloud

```bash
# .env
OPENAI_API_KEY=sk-...

# Local Ollama (auto-detects as "Local")
CUSTOM_PROVIDER_1_BASE_URL=http://localhost:11434/v1
CUSTOM_PROVIDER_1_MODELS=llama2,mistral

# Local LM Studio (custom name)
CUSTOM_PROVIDER_2_BASE_URL=http://localhost:1234/v1
CUSTOM_PROVIDER_2_NAME=LM Studio
CUSTOM_PROVIDER_2_MODELS=text-gen

# MiniMax (custom name)
CUSTOM_PROVIDER_3_API_KEY=your-minimax-key
CUSTOM_PROVIDER_3_BASE_URL=https://api.minimax.io/v1
CUSTOM_PROVIDER_3_NAME=MiniMax
CUSTOM_PROVIDER_3_MODELS=MiniMax-M2.1
```

### Example 4: Production Setup

```bash
# .env
API_TOKEN=secure-production-token

# Primary
OPENAI_API_KEY=sk-prod-key
OPENAI_MODELS=gpt-4o,gpt-4o-mini

# Fallback
ANTHROPIC_API_KEY=sk-ant-prod-key
ANTHROPIC_MODELS=claude-3-5-sonnet

# Cost-effective option
CUSTOM_PROVIDER_1_API_KEY=groq-key
CUSTOM_PROVIDER_1_BASE_URL=https://api.groq.com/openai/v1
CUSTOM_PROVIDER_1_MODELS=llama-3.1-70b-versatile,mixtral-8x7b-32768

DEFAULT_MODEL=gpt-4o
```
