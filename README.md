# Saberloop - AI-Powered Quiz Application

> Test your knowledge on any topic with AI-generated questions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-enabled-blue.svg)](https://web.dev/progressive-web-apps/)

[Live Demo](https://saberloop.com/app/) | [Documentation](./docs/) | [Contributing](./CONTRIBUTING.md)

## Features

- **AI-Generated Questions** - Powered by Claude API via OpenRouter
- **Party Mode** - Play quizzes together in real-time with friends
- **Progressive Web App** - Install on any device, works offline
- **Local Progress Tracking** - Your data stays on your device
- **Adaptive Difficulty** - Questions tailored to your grade level
- **Multi-language Support** - 9 languages supported (EN, PT, ES, FR, DE, IT, NL, NO, RU)
- **Privacy-First** - No tracking, no data collection

## Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- API key from [OpenRouter](https://openrouter.ai/) (for AI-generated questions)

### Installation

```bash
# Clone the repository
git clone https://github.com/vitorsilva/saberloop.git
cd saberloop

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your configuration
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:8888
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

### For Developers

- [Installation Guide](./docs/developer-guide/INSTALLATION.md)
- [Configuration](./docs/developer-guide/CONFIGURATION.md)
- [Troubleshooting](./docs/developer-guide/TROUBLESHOOTING.md)
- [FAQ](./docs/developer-guide/FAQ.md)

### Architecture

- [System Overview](./docs/architecture/SYSTEM_OVERVIEW.md)
- [Database Schema](./docs/architecture/DATABASE_SCHEMA.md)
- [API Design](./docs/architecture/API_DESIGN.md)
- [Deployment Guide](./docs/architecture/DEPLOYMENT.md)

### Learning Journey

This project was built as a learning experience across 10 epics covering PWA fundamentals, AI integration, internationalization, real-time multiplayer, and more. See the [Learning Documentation](./docs/learning/) for detailed notes on each epic.

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

Built with:
- [Claude](https://www.anthropic.com/claude) by Anthropic - AI powering the questions
- [Claude Code](https://claude.ai/code) - AI pair programming assistant
- [OpenRouter](https://openrouter.ai/) - AI API gateway
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## About This Project

Saberloop started as a learning project to explore PWA development, IndexedDB, serverless architecture, and AI integration. It has evolved into a production-ready application that demonstrates modern web development best practices.

The entire development journey is documented in the `docs/learning/` directory, showing the progression from basic PWA concepts to a full-stack AI-powered application.

---

Made with [Claude Code](https://claude.ai/code)
