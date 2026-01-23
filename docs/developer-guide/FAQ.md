# Frequently Asked Questions

## General

### What is Saberloop?

Saberloop is an AI-powered quiz application that generates questions on any topic. It's built as a Progressive Web App (PWA), meaning it works offline and can be installed on any device.

### Is it free to use?

The app itself is free. AI-generated questions use your own API key:

| Provider | Cost |
|----------|------|
| OpenRouter (default) | Free tier: 50 req/day, then pay-per-use |
| OpenAI | Pay-per-use (no free tier) |
| Anthropic | Pay-per-use (no free tier) |
| Google AI | Limited free tier |
| xAI | Pay-per-use (no free tier) |

- **Mock mode:** Development works without any API key

### Does it work offline?

Yes! Once you've loaded the app, it works offline:
- Sample quizzes available without internet
- Previously loaded quizzes accessible
- New AI-generated quizzes require internet

---

## Development

### How do I run the app locally?

```bash
git clone https://github.com/vitorsilva/saberloop.git
cd saberloop
npm install
npm run dev
```

See [Installation Guide](./INSTALLATION.md) for details.

### How do I test with real API?

1. Set `VITE_USE_REAL_API=true` in `.env`
2. Run `npm run dev`
3. Go to Settings in the app
4. Connect to your preferred AI provider (OpenRouter, OpenAI, Anthropic, Google AI, or xAI)
5. Your provider account provides the API access

### How do I add a new feature?

1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes
3. Write tests
4. Submit PR

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## Architecture

### Why Vanilla JavaScript (no React/Vue)?

This project started as a learning exercise for PWA fundamentals. Vanilla JS:
- No framework overhead
- Teaches core web APIs
- Smaller bundle size
- Better for understanding fundamentals

### Why client-side API calls (not a traditional backend)?

Multi-provider architecture benefits:
- User provides their own API key (OAuth for OpenRouter, manual entry for others)
- No server-side API key management needed
- User controls their own usage/costs
- Choice of AI provider

**Note:**
- **OpenRouter** calls go directly from browser (CORS supported)
- **OpenAI, Anthropic, Google AI, xAI** calls go through LLM Proxy for CORS bypass
- **Party Mode** uses a PHP backend for WebRTC signaling coordination

### Why IndexedDB (not localStorage)?

| Feature | localStorage | IndexedDB |
|---------|-------------|-----------|
| Storage limit | ~5MB | ~50MB+ |
| Data types | Strings only | Any (including blobs) |
| Queries | None | Indexed queries |
| Async | No | Yes |

IndexedDB is better for structured data and larger storage needs.

### How does the mock API work?

When `VITE_USE_REAL_API=false`:
- API calls return pre-defined responses
- No external network requests
- Useful for UI development
- Controlled testing scenarios

---

## PWA

### How do I install the app?

**Chrome (Desktop):**
1. Visit the site
2. Click install icon in address bar
3. Or: Menu → "Install Saberloop"

**Chrome (Mobile):**
1. Visit the site
2. Tap "Add to Home Screen" banner
3. Or: Menu → "Add to Home Screen"

**Safari (iOS):**
1. Visit the site
2. Tap Share button
3. Tap "Add to Home Screen"

### Why doesn't install prompt appear?

Requirements for install prompt:
- HTTPS (or localhost)
- Valid manifest.json
- Service worker registered
- Not already installed
- Chromium-based browser

Check DevTools → Application → Manifest for issues.

### How do I force service worker update?

1. DevTools → Application → Service Workers
2. Click "Update" or check "Update on reload"
3. Hard refresh: `Ctrl+Shift+R`

---

## API & AI

### Which AI models are used?

Saberloop supports multiple AI providers:

| Provider | Models |
|----------|--------|
| **OpenRouter** (default) | DeepSeek, Claude, GPT-4, Gemini, Llama, and more |
| **OpenAI** | GPT-4, GPT-4o, o1, GPT-3.5 Turbo |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku |
| **Google AI** | Gemini 1.5 Pro, Gemini 1.5 Flash |
| **xAI** | Grok 2, Grok 2 Mini |

### How accurate are the questions?

AI-generated questions are generally accurate but:
- May occasionally have errors
- Should not be used for critical assessments
- Quality improves with specific topics

### Can I use my own API key?

Yes! Go to Settings → LLM Providers to connect your preferred provider:

- **OpenRouter:** OAuth flow (click Connect, authorize, done)
- **OpenAI, Anthropic, Google AI, xAI:** Enter API key manually

Benefits:
- Control your own costs
- Choose your preferred AI model
- No middleman for direct providers

### What happens if API fails?

The app handles failures gracefully:
- Error message shown to user
- Sample quizzes available offline
- Can retry generation

---

## Party Mode

### What is Party Mode?

Party Mode allows multiple people to take the same quiz together in real-time:
- Host creates a room and gets a 6-character code
- Others join using the room code
- Everyone answers questions simultaneously
- Live scoreboard shows rankings

### How does Party Mode work technically?

- **Room coordination:** PHP signaling server manages rooms and participants
- **Real-time sync:** WebRTC peer-to-peer connections between participants
- **Fallback:** HTTP polling if WebRTC fails

### Does Party Mode require a server?

Yes, Party Mode requires the PHP backend (`php-api/party/`) for:
- Room creation and management
- WebRTC signaling (offer/answer/ICE exchange)
- Participant tracking

The backend is deployed to the VPS alongside the static frontend.

---

## Data & Privacy

### Where is my data stored?

All data is stored locally in your browser (IndexedDB):
- Quiz sessions
- Scores
- Settings
- API keys (if using OpenRouter)

### Is my data sent anywhere?

- **Quiz content:** Sent to AI provider for generation
- **Personal data:** Not collected or sent anywhere
- **Analytics:** None (no tracking)

### How do I delete my data?

**In the app:**
1. Go to Settings
2. Scroll to "Delete All Data"
3. Click the delete button and confirm

**Via browser DevTools:**
1. DevTools → Application → Storage
2. Click "Clear site data"

### Is my API key secure?

All API keys are stored locally in your browser's IndexedDB:
- **OpenRouter:** OAuth token stored locally
- **OpenAI, Anthropic, Google AI, xAI:** Keys stored locally

API calls:
- **OpenRouter:** Direct from browser to OpenRouter
- **Other providers:** Through LLM Proxy (your key is forwarded but not stored server-side)

---

## Troubleshooting

### The app is stuck loading

1. Check internet connection
2. Try hard refresh: `Ctrl+Shift+R`
3. Clear browser cache
4. Check browser console for errors

### Questions don't generate

1. Check API configuration
2. Verify API key is valid
3. Check for rate limiting
4. See [Troubleshooting Guide](./TROUBLESHOOTING.md)

### App doesn't work offline

1. Wait for service worker to install
2. Check Cache Storage in DevTools
3. Ensure you've visited pages before going offline

---

## Contributing

### How can I contribute?

- Report bugs via [GitHub Issues](https://github.com/vitorsilva/saberloop/issues)
- Submit pull requests for fixes/features
- Improve documentation
- Share feedback

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### What's the code style?

- ES6+ JavaScript
- No semicolons preference
- Meaningful variable names
- Comments for complex logic

### How do I run tests?

```bash
npm test          # Unit tests (watch mode)
npm test -- --run # Unit tests (single run)
npm run test:e2e  # E2E tests
```

---

## Related Documentation

- [Installation Guide](./INSTALLATION.md)
- [Configuration](./CONFIGURATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Architecture Overview](../architecture/SYSTEM_OVERVIEW.md)
