# Saberloop Skills

This directory contains specialized skills for AI agents working in the Saberloop repository.

## Available Skills

### 1. [Feature Flag Management](./feature-flag-management/)
**Purpose:** Automate creation, lifecycle management, and removal of feature flags following Epic 10 hygiene standards.

**Usage:** 
```
"Create a new FEATURE_NAME flag using the feature-flag-management skill"
```

**When to Use:**
- Creating new feature flags for gradual rollout
- Updating flag phases (DISABLED → SETTINGS_ONLY → ENABLED)
- Removing deprecated flags
- Adding flag documentation

### 2. [Epic Hygiene Process Execution](./epic-hygiene-process/)
**Purpose:** Execute systematic code quality tasks following Epic 10 hygiene standards.

**Usage:**
```
"Execute dead code removal using the epic-hygiene-process skill"
"Perform architecture compliance cleanup using the epic-hygiene-process skill"
```

**When to Use:**
- Dead code removal and cleanup
- Architecture compliance fixes
- Performance optimization projects
- Technical debt reduction
- Code quality improvements

### 3. [Testing Suite Management](./testing-suite-management/)
**Purpose:** Manage comprehensive testing strategy across unit, E2E, and mutation testing.

**Usage:**
```
"Create tests for new utility using the testing-suite-management skill"
"Update test configuration using the testing-suite-management skill"
"Set up E2E tests for new feature using the testing-suite-management skill"
```

**When to Use:**
- Creating new modules/services/utilities
- Adding new views or components
- Updating test configurations
- Setting up CI/CD test pipelines
- Analyzing test coverage or quality

### 4. [Architecture Compliance Validation](./architecture-compliance/)
**Purpose:** Ensure code follows strict layer boundaries and dependency rules.

**Usage:**
```
"Validate new service architecture using the architecture-compliance skill"
"Check dependency rules for new component using the architecture-compliance skill"
"Fix architecture violations using the architecture-compliance skill"
```

**When to Use:**
- Adding new modules or files
- Refactoring existing code
- Moving code between layers
- Adding new dependencies
- Architecture violations detected

### 5. [PWA Feature Development](./pwa-feature-development/)
**Purpose:** Create progressive web app features following established patterns.

**Usage:**
```
"Create new results view using the pwa-feature-development skill"
"Implement P2P quiz sharing using the pwa-feature-development skill"
"Add service worker caching using the pwa-feature-development skill"
```

**When to Use:**
- Creating new views or screens
- Adding P2P or real-time features
- Implementing offline functionality
- Setting up service worker caching
- Creating sharing/import features

### 6. [CI/CD Pipeline Management](./cicd-pipeline-management/)
**Purpose:** Manage GitHub Actions workflows and deployment pipelines with multiple environments.

**Usage:**
```
"Create new workflow using the cicd-pipeline-management skill"
"Update deployment configuration using the cicd-pipeline-management skill"
"Set up staging pipeline using the cicd-pipeline-management skill"
```

**When to Use:**
- Creating new automated processes
- Setting up deployment for new environments
- Debugging CI/CD failures
- Optimizing workflow performance
- Adding new testing or quality gates

### 7. [Documentation Generation](./documentation-generation/)
**Purpose:** Generate comprehensive documentation including learning notes, architecture diagrams, and API references.

**Usage:**
```
"Create epic documentation using the documentation-generation skill"
"Generate learning notes using the documentation-generation skill"
"Create API docs using the documentation-generation skill"
```

**When to Use:**
- Starting new epic or phase development
- Completing development sessions with learnings
- Creating new features requiring documentation
- Updating project knowledge base
- Onboarding new team members

## Skill Structure

Each skill follows the Claude Skills standard:
- **SKILL.md** - Main skill documentation with implementation guide
- **scripts/** (optional) - Helper scripts and templates
- **templates/** (optional) - Code and documentation templates
- **examples/** (optional) - Usage examples and patterns

## Using Skills

Skills are automatically discovered by Claude and can be referenced by name in your prompts. Each skill provides:
- Step-by-step implementation guides
- Code templates and patterns
- Testing requirements
- Documentation requirements
- Quality checks and metrics

## Development Standards

All skills follow Saberloop project standards:
- Use worktrees for isolated development
- Include comprehensive testing
- Generate learning notes documentation
- Follow strict commit message conventions
- Validate against architecture rules

## Contributing

To add a new skill:
1. Create directory: `.claude/skills/skill-name/`
2. Create `SKILL.md` with proper frontmatter
3. Follow the established template structure
4. Include comprehensive documentation and examples
5. Test the skill before committing

---

**Last Updated:** 2026-01-15  
**Project:** Saberloop v2.0.0+