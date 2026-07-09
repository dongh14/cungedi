# Repository Guidelines

## Project Structure & Module Organization
This repository currently contains planning documents in `memory-bank/`:

- `prd.md`: product scope and V1 requirements
- `implementation-plan.md`: phased delivery plan
- `tech-stack.md`: recommended stack and service choices
- `progress.md`, `architecture.md`: ongoing design notes

Application code is not present yet. When implementation starts, keep the main app in a single Next.js codebase and colocate route logic, UI, and tests under that app rather than splitting into separate repos early.

## Build, Test, and Development Commands
There are no runnable app commands yet. Once the Next.js app is created, standardize on a small command set:

- `npm install`: install dependencies
- `npm run dev`: start the local development server
- `npm run build`: create a production build
- `npm run lint`: run static checks
- `npm test`: run automated tests

Document any new scripts in `package.json` as they are introduced and keep names conventional.

## Coding Style & Naming Conventions
Target stack from `memory-bank/tech-stack.md` is Next.js, TypeScript, Tailwind CSS, Supabase, and Mapbox. Use 2-space indentation for TypeScript, prefer strict typing, and keep components and server utilities small and single-purpose.

- React components: `PascalCase`
- Functions and variables: `camelCase`
- Route segments and utility files: lowercase, kebab-case when needed
- Database tables: plural snake_case such as `restaurants` and `restaurant_sources`

Run formatter and linter before opening a PR. Prefer repository-standard tooling once added, likely ESLint and Prettier.

## Testing Guidelines
No test framework is configured yet. For V1, add automated tests alongside implementation and cover the core flows from the PRD: auth, URL intake, extraction review, save, list, and map display.

Recommended naming:

- Unit tests: `*.test.ts`
- Component tests: `*.test.tsx`
- End-to-end tests: `e2e/*.spec.ts`

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so no existing commit convention can be inferred. Use short, imperative commit messages and prefer Conventional Commit prefixes such as `feat:`, `fix:`, and `docs:`.

PRs should include a clear summary, linked issue or task, testing notes, and screenshots for UI changes. Call out any schema, auth, or environment-variable changes explicitly.

## Security & Configuration Tips
Do not commit Supabase keys, Mapbox tokens, or `.env` files. Keep extraction best-effort only, require user confirmation before save, and preserve per-user access controls as a default design rule.
