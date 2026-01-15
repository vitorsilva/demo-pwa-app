---
name: documentation-generation
description: Generate comprehensive documentation including learning notes, architecture diagrams, and API references
version: 1.0.0
author: Saberloop Project
usage: |
  Use this skill for documentation tasks:
  - Creating new epic/phase documentation templates
  - Generating learning notes from development sessions
  - Creating architecture diagrams and dependency graphs
  - Maintaining cross-references between documents
  - Generating API documentation from code comments
  
  Examples:
  "Create epic documentation using the documentation-generation skill"
  "Generate learning notes using the documentation-generation skill"
  "Create API docs using the documentation-generation skill"

# Documentation Generation Skill

## Overview

This skill automates the generation and maintenance of comprehensive documentation for Saberloop, including learning notes, epic/phase documentation, architecture diagrams, and API references, ensuring knowledge capture and project continuity.

## Documentation Structure

### Documentation Hierarchy

```
docs/
├── learning/                    # Learning and process documentation
│   ├── epic01_infrastructure/   # Infrastructure setup
│   ├── epic02_quizmaster_v1/  # Core quiz functionality
│   ├── epic06_sharing/         # Social/sharing features
│   ├── epic07_monetization/     # Monetization features
│   ├── epic10_hygiene/         # Code quality processes
│   └── parking_lot/            # Deferred features
├── api/                        # API documentation
├── architecture/                 # Architecture diagrams and decisions
└── product-info/               # Product screenshots and materials
```

### Document Types

| Type | Purpose | Template | Location |
|-------|---------|----------|----------|
| Epic Plan | Major feature planning | `EPIC*_PLAN.md` |
| Phase Plan | Specific implementation steps | `PHASE*_PLAN.md` |
| Learning Notes | Session learnings and metrics | `PHASE*_LEARNING_NOTES.md` |
| Feature Flags | Flag lifecycle documentation | `FLAG_*.md` |
| API Reference | Function documentation | `api/README.md` |
| Architecture | System design decisions | `architecture/README.md` |

## When to Use This Skill

Use this skill when ANY of these are true:
- [ ] Starting new epic or phase development
- [ ] Completing development sessions with learnings
- [ ] Creating new features requiring documentation
- [ ] Updating project knowledge base
- [ ] Onboarding new team members
- [ ] Preparing project handoffs

## Epic Documentation Templates

### Step 1: Epic Creation Template

**File:** `docs/learning/epicXX_epic-name/EPIC_XX_EPIC_NAME_PLAN.md`

```markdown
# Epic XX: Epic Name

**Status:** Planning/Active/Complete
**Created:** YYYY-MM-DD
**Parent:** [Link to parent epic or exploration document]

---

## Executive Summary

Brief (2-3 sentences) description of what this epic accomplishes and why it matters.

**Core insight**: Key technical insight that drives the epic approach.

---

## Scope

### What's IN

| Phase | Feature | Priority | Document |
|-------|---------|----------|
| **1** | Feature A description | P0 - Critical | [PHASE1_FEATURE_A.md](./PHASE1_FEATURE_A.md) |
| **2** | Feature B description | P1 - Important | [PHASE2_FEATURE_B.md](./PHASE2_FEATURE_B.md) |
| **3** | Feature C description | P2 - Nice to have | [PHASE3_FEATURE_C.md](./PHASE3_FEATURE_C.md) |

### What's OUT (Post-MVP)

- Feature D - Reason for exclusion
- Feature E - Technical complexity
- Feature F - Timeline constraints

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture pattern | Choice | Why this approach |
| Technology stack | Choice | Benefits and tradeoffs |
| Data model | Choice | Scalability considerations |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| User adoption | X users | Telemetry: `feature_used` |
| Performance | <3s load time | Performance monitoring |
| Error rate | <1% | Error tracking |
| Test coverage | >90% | Coverage reports |

---

## Timeline Philosophy

- No time estimates provided. Work in phases:
  1. Complete Phase 1, ship, measure
  2. If successful, proceed to Phase 2
  3. If successful, proceed to Phase 3

Each phase is independently valuable. Stop if metrics don't justify continuation.

---

## Development Standards

### Testing Requirements

| Requirement | Phase 1 | Phase 2 | Phase 3 |
|-------------|---------|---------|---------|
| Unit tests | ✅ | ✅ | ✅ |
| E2E tests | ✅ | ✅ | ✅ |
| Performance tests | - | ✅ | ✅ |
| Security tests | - | - | ✅ |

### Code Quality Requirements

| Requirement | Target |
|-------------|--------|
| Architecture compliance | Zero violations |
| Type checking | No errors |
| Test coverage | >90% |
| Bundle size | <5MB |

### Documentation Requirements

| Requirement | Frequency |
|-------------|----------|
| Learning notes | After each session |
| Phase documentation | At phase completion |
| Epic updates | Major milestones |
| API updates | Public API changes |

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Technical complexity | Medium | Timeline | Proof of concept first |
| User adoption | Low | Success | Beta testing with feedback |
| Performance | Low | Experience | Performance monitoring |
| Security | Low | Data | Security audit |

---

## Related Documentation

- [Parent Exploration](./EXPLORATION.md)
- [Architecture Overview](../../../architecture/README.md)
- [API Reference](../../../api/README.md)
- [Previous Epic](../epicXX_PREVIOUS/EPIC_XX_PLAN.md)

---

**Last Updated:** YYYY-MM-DD
**Next Review:** YYYY-MM-DD
```

### Step 2: Phase Documentation Template

**File:** `docs/learning/epicXX_epic-name/PHASE*_PHASE_NAME.md`

```markdown
# Phase X: Phase Name

**Status:** Ready/In Progress/Complete
**Priority:** High/Medium/Low (Area)
**Estimated Effort:** X-Y sessions
**Created:** YYYY-MM-DD
**Updated:** YYYY-MM-DD

---

## Session Log

| Date | Status | Notes |
|------|--------|-------|
| YYYY-MM-DD | **Started** | Initial planning and setup |
| YYYY-MM-DD | **Progress** | Implemented core functionality |
| YYYY-MM-DD | **Complete** | Testing and documentation |

---

## Overview

Brief description of what this phase accomplishes and how it fits into the epic.

**Key Goal:** What success looks like for this phase.

---

## What You'll Learn

### New Technologies & Concepts

1. **Technology Name** - Brief description and why important
2. **Pattern Name** - Development pattern and benefits
3. **Tool Name** - New tool and learning objectives

---

## Prerequisites

Before starting this phase, you should have:

- ✅ **Previous Phase Complete** - What was delivered
- ✅ Required tools installed - Development environment
- ✅ Knowledge of dependencies - APIs, libraries
- ✅ Understanding of patterns - Established approaches

---

## Branching Strategy

### Branch Naming
```
feature/phaseX-phase-name
```

### Workflow
1. Create branch from `main`
2. Make small, focused commits
3. Push regularly to remote
4. Create PR when phase complete
5. Merge to `main` after review

### Commands
```bash
# Start phase
git checkout main
git pull origin main
git checkout -b feature/phaseX-phase-name

# During work
git add <files>
git commit -m "type(scope): description"

# Push regularly
git push -u origin feature/phaseX-phase-name

# When complete
gh pr create --title "Phase X: Phase Name" --body "..."
```

---

## Objective

Clear statement of what this phase aims to achieve.

---

## Scope Overview

### Implementation Areas

| Component | Files | Complexity | Focus Areas |
|-----------|-------|------------|-------------|
| Service Layer | `src/services/*.js` | Medium | Business logic |
| UI Components | `src/components/*.js` | Low | User interface |
| API Integration | `src/api/*.js` | High | External communication |
| Testing | `*.test.js` | Medium | Test coverage |

---

## Implementation Plan

> **Important Reminders:**
> - 📝 Update `PHASE*_LEARNING_NOTES.md` after each session
> - ✅ Update step status (change `[ ]` to `[x]`)
> - 💾 Commit after logical changes
> - 🔄 Push to remote regularly

### Step 1: Setup and Foundation
**Status:** [ ] Not Started

1. Create feature branch
2. Update dependencies
3. Setup development environment
4. Initial project structure

**After completing:**
- [ ] Commit: "chore(setup): initial phase setup"
- [ ] Update learning notes with foundation details
- [ ] Mark this step complete

---

### Step 2: Core Implementation
**Status:** [ ] Not Started

[Detailed implementation steps with checklists]

---

### Step 3: Testing and Validation
**Status:** [ ] Not Started

1. Unit tests for new code
2. Integration tests
3. E2E test coverage
4. Performance validation
5. Security considerations

---

### Step 4: Documentation and Cleanup
**Status:** [ ] Not Started

1. Update API documentation
2. Create user guide
3. Update project README
4. Archive temporary files
5. Prepare for review

---

## Deliverables

### Initial Setup
- [ ] Feature branch created
- [ ] Development environment ready
- [ ] Phase documentation template

### Implementation
- [ ] Core functionality implemented
- [ ] Tests passing
- [ ] Code quality checks passing

### Documentation
- [ ] Phase documentation complete
- [ ] Learning notes updated
- [ ] Cross-references updated
- [ ] API documentation updated

### Final
- [ ] PR created and reviewed
- [ ] Epic documentation updated
- [ ] Integration testing passed
- [ ] Ready for deployment

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Core functionality | ✅ Working |
| Test coverage | >90% |
| Performance | <3s load time |
| Code quality | Zero violations |
| Documentation | 100% complete |

---

## Acceptance Criteria

- [ ] All functionality works as specified
- [ ] Tests pass in all environments
- [ ] Performance meets targets
- [ ] Documentation is comprehensive
- [ ] No regression in existing features
- [ ] Ready for production deployment

---

## Learning Objectives

1. **Technical Learning**
   - What technology or pattern will be learned
   - Why this is valuable for the project

2. **Process Learning**
   - What development process will be improved
   - How this can be applied to future phases

3. **Quality Learning**
   - What quality measures will be improved
   - How to maintain high standards

---

## Dependencies

- Previous phase completion
- External API availability
- Tool dependencies
- Environment setup requirements

---

## Notes

- Record important decisions and rationales
- Capture problems and solutions
- Document time estimates vs actual
- Note process improvements

---

**Last Updated:** YYYY-MM-DD
```

## Learning Notes Generation

### Step 1: Session Learning Notes Template

**File:** `docs/learning/epicXX_epic-name/PHASE*_LEARNING_NOTES.md`

```markdown
# Phase X: Session Learning Notes

**Date:** YYYY-MM-DD
**Type:** [development|testing|debugging|planning]
**Session:** X of Y
**Duration:** Z hours
**Participants:** [List if pair programming]

---

## Session Objective

What was planned to accomplish in this session.

---

## What Was Accomplished

### Completed Tasks
- [ ] Task 1 description
- [ ] Task 2 description
- [ ] Task 3 description

### Code Changes
- **Files Modified:** [List of files]
- **Lines Added:** [Number]
- **Lines Removed:** [Number]
- **Tests Added:** [Number]

---

## Problems Encountered

### Technical Issues
1. **Problem:** Clear description
   **Solution:** How it was resolved
   **Time Lost:** Estimate of time spent
   **Learning:** What to avoid in future

### Process Issues
1. **Problem:** Development process issue
   **Solution:** Process improvement
   **Root Cause:** Why it happened
   **Prevention:** How to prevent recurrence

---

## Key Learnings

### Technical Learnings
1. **Pattern Discovered:** New development pattern
   **Application:** Where and how to use it
   **Benefits:** Why this is valuable

2. **Tool Mastery:** New tool or feature
   **Usage:** How it was used effectively
   **Tips:** Best practices discovered

### Process Learnings
1. **Workflow Improvement:** Better way to work
   **Old Way:** Previous approach
   **New Way:** Improved approach
   **Efficiency Gain:** Time or effort saved

---

## Metrics and Results

### Performance Metrics
| Metric | Before | After | Improvement |
|--------|--------|--------|-------------|
| Test coverage | X% | Y% | +Z% |
| Build time | Xs | Ys | -Zs |
| Bundle size | Xkb | Ykb | +/-Zkb |

### Quality Metrics
| Metric | Before | After | Status |
|--------|--------|--------|-------|
| Architecture violations | X | Y | ✅ Improved |
| TypeScript errors | X | Y | ✅ Fixed |
| Linting issues | X | Y | ✅ Reduced |

---

## Next Steps

### Immediate (Next Session)
1. [ ] Task to continue
2. [ ] Issue to investigate
3. [ ] Test to write

### Upcoming (This Phase)
1. [ ] Remaining implementation tasks
2. [ ] Documentation to complete
3. [ ] Testing to perform

### Future (Next Phases)
1. [ ] Knowledge to apply to phase X+1
2. [ ] Process improvements to implement
3. [ ] Tools to master

---

## Screenshots and Evidence

[Attach screenshots of progress, test results, or important milestones]

---

## Session Reflection

### What Went Well
- Clear description of successful aspects
- Why it worked well
- How to replicate success

### What Could Be Improved
- Areas for improvement
- Specific suggestions
- Action items for improvement

### Unexpected Discoveries
- Surprising findings
- New opportunities identified
- Risks or concerns discovered

---

## Process Documentation Updates

### Templates Updated
- [ ] Phase template with new learnings
- [ ] Checklists with additional items
- [ ] Time estimates refined

### Cross-References Added
- [ ] Links to related documentation
- [ ] Updated architecture diagrams
- [ ] Added to project knowledge base

---

**Session Summary:**
**Duration:** X hours
**Tasks Completed:** Y of Z planned
**Progress:** Phase X is [percentage]% complete
**Next Session:** Focus on [priority items]

---

**Last Updated:** YYYY-MM-DD
```

## API Documentation Generation

### Step 1: JSDoc Configuration

**File:** `jsdoc.config.json`

```json
{
  "source": {
    "include": ["src/**/*.js"],
    "exclude": ["src/**/*.test.js", "src/version.js"],
    "includePattern": ".+\\.js(doc)?$"
  },
  "opts": {
    "destination": "./docs/api/",
    "recurse": true
  },
  "plugins": [
    "plugins/markdown",
    "plugins/summarize"
  ],
  "templates": {
    "cleverLinks": false,
    "monospaceLinks": false,
    "default": {
      "outputSourceFiles": true,
      "includeDate": true
    }
  },
  "markdown": {
    "parser": "gfm",
    "hardwrap": true,
    "idInHeadings": true
  }
}
```

### Step 2: API Documentation Template

**File:** `docs/api/README.md`

```markdown
# Saberloop API Documentation

## Overview

This document describes the internal API used by Saberloop views, services, and components.

## Architecture

The API is organized into logical modules:

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| Core | State management and database | `initDatabase()`, `state` |
| Services | Business logic layer | `quizService`, `partyService` |
| API | External communication | `generateQuiz()`, `saveQuiz()` |
| Utils | Helper functions | `shuffle()`, `formatScore()` |

## Module Documentation

### Core Module (`src/core/`)

#### Database (`db.js`)
```javascript
/**
 * Initialize the IndexedDB database and create object stores
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function initDatabase() {
  // Implementation
}

/**
 * Save a quiz to the database
 * @param {Quiz} quiz - Quiz object to save
 * @returns {Promise<string>} Quiz ID
 */
export async function saveQuiz(quiz) {
  // Implementation
}
```

#### State Management (`state.js`)
```javascript
/**
 * Get current value from global state
 * @param {string} key - State key to retrieve
 * @returns {any} Current value
 */
export function get(key) {
  // Implementation
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  // Implementation
}
```

### Services Module (`src/services/`)

#### Quiz Service (`quiz-service.js`)
```javascript
/**
 * Create a new quiz with AI-generated questions
 * @param {string} topic - Quiz topic
 * @param {Object} options - Quiz options
 * @returns {Promise<Quiz>} Generated quiz
 */
export async function createQuiz(topic, options = {}) {
  // Implementation
}

/**
 * Validate quiz answers and calculate score
 * @param {Quiz} quiz - Quiz object
 * @param {Array} answers - User answers
 * @returns {QuizResult} Score and results
 */
export function calculateScore(quiz, answers) {
  // Implementation
}
```

### API Module (`src/api/`)

#### Quiz Generation (`api.real.js`)
```javascript
/**
 * Generate quiz questions using AI
 * @param {string} topic - Topic for questions
 * @param {number} questionCount - Number of questions to generate
 * @param {string} language - Language for questions
 * @returns {Promise<Object>} Generated questions and metadata
 */
export async function generateQuiz(topic, questionCount, language = 'en') {
  // Implementation
}
```

## Usage Examples

### Basic Quiz Creation
```javascript
import { quizService } from '@/services/quiz-service.js';

// Create a science quiz with 10 questions
const quiz = await quizService.createQuiz('Science', {
  questionCount: 10,
  difficulty: 'medium',
  language: 'en'
});

console.log('Quiz created:', quiz.id);
```

### State Management
```javascript
import { state, subscribe } from '@/core/state.js';

// Get current user settings
const settings = state.get('userSettings');

// Subscribe to changes
const unsubscribe = subscribe((newState) => {
  console.log('State changed:', newState);
});

// Later: stop listening
unsubscribe();
```

### Database Operations
```javascript
import { saveQuiz, loadQuiz } from '@/core/db.js';

// Save a quiz
await saveQuiz({
  id: 'quiz-123',
  topic: 'History',
  questions: [...]
});

// Load a quiz
const quiz = await loadQuiz('quiz-123');
```

## Error Handling

### Common Error Types

| Error Type | Description | Solution |
|------------|-------------|----------|
| `DatabaseError` | IndexedDB operation failed | Check browser compatibility |
| `NetworkError` | API request failed | Check network connectivity |
| `ValidationError` | Invalid input data | Validate inputs before API calls |

### Error Handling Pattern

```javascript
try {
  const result = await apiCall(data);
  return result;
} catch (error) {
  logger.error('API call failed', { error: error.message });
  throw new Error(handleApiError(error));
}
```

## Version History

| Version | Date | Changes |
|---------|-------|---------|
| 1.0.0 | 2026-01-15 | Initial documentation |
| 1.1.0 | TBD | Next release changes |

---

**Generated:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD
```

## Automation Scripts

### Step 1: Documentation Generation Scripts

**File:** `scripts/generate-docs.cjs`

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Generate API documentation from JSDoc comments
 */
function generateApiDocs() {
  console.log('📚 Generating API documentation...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run docs', { stdio: 'inherit' });
    console.log('✅ API documentation generated');
  } catch (error) {
    console.error('❌ Failed to generate API docs:', error.message);
    process.exit(1);
  }
}

/**
 * Generate learning notes template
 */
function generateLearningNotes(phaseName) {
  const template = `
# Phase: ${phaseName} Learning Notes

**Date:** ${new Date().toISOString().split('T')[0]}
**Status:** In Progress

## Session Objectives
[Add objectives here]

## What Was Accomplished
[Track progress here]

## Problems Encountered
[Document issues here]

## Key Learnings
[Capture learnings here]
`;

  const filename = `docs/learning/epicXX_epic-name/PHASE*_LEARNING_NOTES.md`;
  fs.writeFileSync(filename, template);
  console.log(`✅ Learning notes template created: ${filename}`);
}

// CLI interface
const command = process.argv[2];
const phaseName = process.argv[3];

switch (command) {
  case 'api':
    generateApiDocs();
    break;
  case 'notes':
    generateLearningNotes(phaseName);
    break;
  default:
    console.log('Usage: node scripts/generate-docs.cjs [api|notes] [phase-name]');
    process.exit(1);
}
```

### Step 2: Package.json Scripts

```json
{
  "scripts": {
    "docs": "jsdoc -c jsdoc.config.json",
    "docs:open": "jsdoc -c jsdoc.config.json && start docs/api/index.html",
    "docs:generate": "node scripts/generate-docs.cjs",
    "docs:notes": "node scripts/generate-docs.cjs notes"
  }
}
```

## Quality Assurance

### Documentation Quality Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| All public APIs documented | ✅ | Complete coverage |
| Examples provided | ✅ | Usage patterns included |
| Cross-references working | ✅ | Links validated |
| Consistent formatting | ✅ | Markdown linting passed |
| Search-friendly | ✅ | Structure optimized |

### Review Process

1. **Content Review**
   - Technical accuracy
   - Completeness of examples
   - Clarity of explanations

2. **Format Review**
   - Markdown syntax
   - Link validation
   - Consistency checks

3. **Usability Review**
   - Navigation ease
   - Search effectiveness
   - Mobile compatibility

## Integration with Other Skills

This skill integrates with:
- **epic-hygiene-process** - For documenting hygiene learnings
- **pwa-feature-development** - For documenting PWA features
- **testing-suite-management** - For documenting test strategies
- **architecture-compliance** - For documenting architectural decisions

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Compatible with:** Saberloop v2.0.0+