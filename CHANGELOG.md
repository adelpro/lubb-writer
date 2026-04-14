# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fixed a bug when the api is configured the first time, the models list is not refreshed
- Fixed api config key sharing security enforcement

### Added

- Added a refresh button in popup/options to refresh the models list from the api

## [1.0.0] - 2026-04-14

### Added

- 13 writing modes: rewrite, summarize, humanize, grammar, formal, casual, academic, SEO, persuasive, creative, Twitter, LinkedIn, story
- Multi-provider AI support (OpenAI, Anthropic Claude, Google Gemini)
- Custom OpenAI-compatible providers support (up to 10 providers: MiniMax, Ollama, LM Studio, Groq, etc.)
- Browser extension for Chrome, Firefox, Edge, and Brave
- Inline text enhancement with selection
- Extension popup for manual text input
- Keyboard shortcuts (Ctrl+Shift+Y) for enhancing selected text
- Manual model refresh button in popup/options
- Auto-refresh model on settings change
- Dark mode support for inline enhancement modal
- Interactive Swagger API documentation at `/docs`
- Docker deployment with docker-compose
- Swagger/OpenAPI integration

### Changed

- Default model fallback to unconfigured model
- Firefox minimum version updated
- Removed API settings from Firefox version
- Edge installation link updated

### Fixed

- Prevention of API key exposure in settings
- Improved model validation
- Removed all host permissions from extension
- Removed redundant description fields from manifest

### Removed

- Removed outdated API extension plan document

### Documentation

- Updated README with badges and demo
- Added screenshots for API documentation, extension modal, popup, and settings
- Updated Chrome and Firefox extension links
- Updated contact email and GitHub reference
- Added extension manifest description and long description

### Security

- Enhanced API key protection mechanisms
- Improved model validation to prevent unauthorized access

---

## [Unreleased]

### Notes

- Edge browser support coming soon
- Additional AI providers planned
- More platform-specific content modes in development
