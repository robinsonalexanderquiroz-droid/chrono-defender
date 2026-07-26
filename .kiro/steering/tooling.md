---
inclusion: always
---

# Chrono Defender – Tooling

## Node.js

- Supported major version: **Node 20**.
- `.nvmrc` contains `20`.
- `package.json` `engines` field: `"node": ">=20.0.0 <21.0.0"`.
- Do not upgrade to another Node major version automatically.
- CI must pin the same major version (see `ci-cd.md`).

## Package Management

- Use **npm** with `package-lock.json` committed to the repository.
- CI must use `npm ci` (not `npm install`) to guarantee reproducible installs.
- All direct dependencies must use exact or tilde (`~`) version ranges — no caret (`^`) ranges for runtime or build dependencies.
- Run `npm audit --audit-level=high` as part of every CI run; a high or critical vulnerability must block the build.

## Build Tool — Vite

- Vite is the dev server and production bundler.
- The production build outputs to `dist/`.
- The `base` config option must remain `"/"` or read from an environment variable until the GitHub repository name is confirmed.
- Source maps must be emitted for production builds to aid debugging.
- Do not introduce additional bundler plugins unless approved.

## TypeScript

- `strict: true` is required (see `architecture.md` for full TypeScript rules).
- `tsconfig.json` targets ES2020 or later; set `module` to `ESNext` and `moduleResolution` to `Bundler` (Vite-compatible).
- Type-check (`tsc --noEmit`) must pass as a CI step.

## Linter — ESLint

- Use the flat config format (`eslint.config.js`).
- Required rule sets: `@typescript-eslint/recommended`, `import/no-cycle`.
- `no-console` should warn (not error) to allow temporary debug logging during development.
- ESLint must pass with zero errors before merging any branch.
- ESLint warnings are allowed but must not accumulate unchecked — a warning count ceiling may be added later.

## Formatter — Prettier

- Prettier is the sole formatter; ESLint must not duplicate formatting rules.
- `.prettierrc` defines project-wide formatting (e.g. single quotes, 2-space indent, trailing commas).
- `prettier --check` must pass as a CI step.
- Developers format on save (IDE) or via `npm run format`; CI only checks, never auto-formats.

## Unit and Integration Tests — Vitest

- Test files live under `tests/unit/` and use the `.test.ts` suffix.
- Tests run with `vitest --run` (single-pass, no watch) in CI.
- Coverage is collected but a minimum threshold is not enforced in the MVP; thresholds may be added later.
- Tests must not import Phaser or rely on a browser DOM; use `jsdom` environment only where unavoidable.
- Systems and utils must have tests before their corresponding feature is considered complete.

## End-to-End Tests — Playwright

- E2E test files live under `tests/e2e/` and use the `.spec.ts` suffix.
- CI runs Playwright against a `vite preview` server started from the production build.
- The MVP E2E suite must cover: page load, canvas render, keyboard input reaching the game, and basic navigation (start → gameplay → game-over).
- Do not test pixel-exact visuals in E2E; test observable DOM/canvas state and Phaser scene transitions.

## Scripts (`package.json`)

The following npm scripts must be defined:

| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `tsc --noEmit && vite build` |
| `preview` | `vite preview` |
| `test` | `vitest --run` |
| `test:e2e` | `playwright test` |
| `lint` | `eslint .` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `typecheck` | `tsc --noEmit` |
| `audit` | `npm audit --audit-level=high` |
