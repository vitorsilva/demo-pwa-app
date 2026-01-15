# Contributing to Saberloop

Thank you for your interest in contributing to Saberloop! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, collaborative, and constructive. We're all here to learn and build something useful together.

## Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/saberloop.git
cd saberloop

# Add upstream remote
git remote add upstream https://github.com/vitorsilva/saberloop.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Development Workflow

### Running Locally

```bash
# Start development server
npm run dev

# Access at http://localhost:8888
```

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm test -- --run && npm run test:e2e
```

### Code Style

- Use ES6+ modern JavaScript
- Follow existing code formatting
- Add comments for complex logic
- Use meaningful variable/function names

**Example:**
```javascript
// Good
async function generateQuizQuestions(topic, gradeLevel) {
  // Implementation
}

// Avoid
async function gen(t, g) {
  // Implementation
}
```

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(settings): add dark mode toggle

fix(quiz): correct score calculation for partial credit

docs(readme): update installation instructions
```

### Pull Request Process

1. **Update your fork:**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests:**
```bash
npm test -- --run && npm run test:e2e
```

3. **Push to your fork:**
```bash
git push origin feature/your-feature-name
```

4. **Create Pull Request:**
   - Go to GitHub and create a PR from your fork
   - Fill out the PR template
   - Link any related issues

5. **Review process:**
   - Address review comments
   - Update PR as needed
   - Maintain a clean commit history (squash if needed)

## Project Structure

```
src/
├── api/          # API clients (mock, real, OpenRouter)
├── core/         # Core infrastructure (db, router, state, settings)
├── features/     # Feature-specific modules (onboarding, samples)
├── views/        # UI views (SPA pages)
├── components/   # Reusable UI components
├── utils/        # Utility functions (logger, network, etc.)
├── styles/       # CSS files
└── main.js       # Entry point

php-api/          # PHP backend (Party Mode signaling, telemetry)

scripts/          # Build and deploy scripts

tests/
└── e2e/          # E2E tests

docs/
├── architecture/    # System architecture docs
├── developer-guide/ # Developer guides
├── learning/        # Learning journey notes
└── product-info/    # Product assets
```

## Areas to Contribute

### Bug Fixes

Found a bug? Great!

1. Check if it's already reported in [Issues](https://github.com/vitorsilva/saberloop/issues)
2. If not, create a new issue with:
   - Description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
3. Create a PR with the fix

### New Features

Have an idea for a new feature?

1. Open an issue first to discuss
2. Get feedback before starting work
3. Follow the PR process above

### Documentation

Documentation improvements are always welcome:

- Fix typos
- Clarify confusing sections
- Add missing documentation
- Improve examples

### Testing

- Add tests for uncovered code
- Improve existing tests
- Add E2E test scenarios

## Questions?

- Open an issue with the `question` label
- Start a discussion in GitHub Discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
