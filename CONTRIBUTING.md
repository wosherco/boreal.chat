# Contributing to boreal.chat

First of all, thank you for your interest in contributing to boreal.chat! 🎉

Currently boreal.chat is in beta, and many things are still in flux. From broken things, needed refactors, or developing new features. Those are the main priorities for now.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Database Changes](#database-changes)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Prerequisites

To contribute to boreal.chat, you need to have the following tools installed:

- **Node.js** (v22+) - Check `.nvmrc` for the exact version, use of nvm is recommended
- **pnpm** - Package manager (v9.12.2+)
- **Docker** - For database and services
- **Caddy** - Web server for development

### Initial Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/wosherco/boreal.chat.git
   cd boreal.chat
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Start the required services**

   ```bash
   docker compose up -d
   ```

5. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

### Running the Development Server

1. **Start the Caddy server** (in a separate terminal)

   ```bash
   pnpm dev:caddy
   ```

2. **Start the development server**

   ```bash
   pnpm dev
   ```

3. **Access the application**

   Navigate to [https://localhost:5174](https://localhost:5174)

## 🔄 Development Workflow

### Before You Start

1. Check existing [issues](https://github.com/your-org/boreal.chat/issues) and [pull requests](https://github.com/your-org/boreal.chat/pulls)
2. Create an issue if one doesn't exist for your contribution
3. Comment on the issue to let others know you're working on it

### Making Changes

1. **Create a feature branch**

   ```bash
   git checkout -b your-username/your-feature-or-fix-name
   ```

2. **Make your changes**

   - Follow our [code standards](#code-standards)
   - Write tests for new functionality
   - Update documentation if needed

3. **Test your changes**

   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint:fix
   pnpm format:fix
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature" # Use conventional commits
   ```

## 📝 Code Standards

### Code Formatting

We use **Prettier** and **ESLint** to maintain consistent code style:

```bash
# Check formatting and linting
pnpm format
pnpm lint

# Auto-fix issues
pnpm format:fix
pnpm lint:fix
```

### TypeScript

- Use strict TypeScript settings
- Provide proper type annotations
- Avoid `any` types when possible
- Use type imports: `import type { ... }`

### Svelte Components

- Use TypeScript in `<script lang="ts">` blocks
- Follow Svelte 5 runes patterns
- Use proper component naming (PascalCase)
- Add appropriate JSDoc comments for props

### Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example:

```
feat(chat): add voice message support
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test
```

### Writing Tests

- Place tests next to the files they test with `.test.ts` extension
- Use Vitest for unit and integration tests
- Mock external dependencies appropriately
- Test both happy paths and error cases

Example test structure:

```typescript
import { describe, it, expect } from "vitest";
import { yourFunction } from "./yourFile";

describe("yourFunction", () => {
  it("should handle valid input correctly", () => {
    // Your test here
  });
});
```

## 🗄️ Database Changes

### Creating Migrations

1. **Make schema changes** in the appropriate schema files
2. **Generate migration**
   ```bash
   pnpm db:generate
   ```
3. **Review the generated migration** in the `drizzle/` directory
4. **Test the migration**
   ```bash
   pnpm db:migrate
   ```

### Client Database

For client-side database changes:

```bash
# Generate client migrations
pnpm db:client:generate

# Compile migrations
pnpm db:client:compile
```

## 📋 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**

   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

2. **Build the project**

   ```bash
   pnpm build
   ```

3. **Update documentation** if your changes affect the API or user interface

### Pull Request Template

When submitting a PR, please include:

- **Description**: Clear description of what the PR does
- **Type of Change**: Bug fix, new feature, breaking change, etc.
- **Testing**: How you tested your changes
- **Screenshots**: If UI changes are involved
- **Related Issues**: Link to related issues

### Review Process

1. Ensure your PR has a clear title and description
2. Request review from maintainers
3. Address feedback and make necessary changes
4. Ensure CI passes
5. Wait for approval and merge

## 📁 Project Structure

```
boreal.chat/
├── src/
│   ├── lib/
│   │   ├── client/          # Client-side code
│   │   ├── server/          # Server-side code
│   │   ├── common/          # Shared utilities
│   │   └── components/      # Svelte components
│   ├── routes/              # SvelteKit routes
│   └── app.html            # HTML template
├── static/                  # Static assets
├── tests/                   # Test files
├── drizzle/                # Database migrations
└── docs/                   # Documentation
```

## 🛠️ Available Scripts

### Development

- `pnpm dev` - Start development server
- `pnpm dev:caddy` - Start Caddy server
- `pnpm dev:stripe` - Start Stripe webhook listener

### Building

- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

### Database

- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:migrate` - Run migrations
- `pnpm db:generate` - Generate new migration
- `pnpm db:push` - Push schema changes

### Code Quality

- `pnpm format` - Check code formatting
- `pnpm format:fix` - Fix code formatting
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm typecheck` - Run TypeScript checks

### Testing

- `pnpm test` - Run tests
- `pnpm test --watch` - Run tests in watch mode

## 🤝 Community Guidelines

### Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

### Getting Help

- **Discord**: Join our [Discord community](https://discord.gg/boreal-chat)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions and ideas

### Reporting Bugs

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, browser
2. **Steps to reproduce**: Clear steps to reproduce the issue
3. **Expected behavior**: What you expected to happen
4. **Actual behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Additional context**: Any other relevant information

### Suggesting Features

Before suggesting a new feature:

1. Check if it's already on our [roadmap](https://docs.boreal.chat/beta-docs/roadmap/)
2. Search existing issues and discussions
3. Consider if it fits the project's goals
4. Provide a clear use case and rationale

## 🙏 Recognition

Contributors will be recognized in:

- Release notes for significant contributions
- Our contributors section (coming soon)
- Special mentions in our Discord community

---

Thank you for contributing to boreal.chat! Your efforts help make this project better for everyone. 🚀
