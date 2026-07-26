---
spec: core-game
artifact: tasks
version: 1.1.0
status: draft
requirements: .kiro/specs/core-game/requirements.md
design: .kiro/specs/core-game/design.md
date: 2026-07-26
---

# Chrono Defender – Implementation Tasks

---

## Universal Process Rules

These are not executable tasks. They apply to every task in this plan.

- Do not change approved gameplay behavior without human approval.
- Do not add a dependency not listed in the approved design without human approval.
- Do not change GitHub Actions permissions without human approval.
- Do not change the deployment architecture without human approval.
- Do not use `workflow_run`.
- Do not use a `gh-pages` branch.
- Do not change the Vite base path `/chrono-defender/` without human approval.
- Do not introduce AWS, backend services, authentication, accounts, databases, cloud storage, multiplayer, online leaderboards, analytics requiring private keys, or runtime secrets.
- Do not add background music.
- Do not publish screenshots, recordings, or presentation materials before privacy and content review.
- Do not commit when the current task's validation fails.
- Prefer one atomic commit per completed task.
- Do not combine tasks from different phases in one commit.
- Do not push or create a pull request unless explicitly authorized.
- Stop when a task reveals a requirement or design contradiction.
- Balance tuning is allowed without approval when it remains within approved configuration ranges and does not change approved behavior.

---

## Phase 1 — Repository and Tooling Foundation

- [ ] 1.1 Initialize package.json and Node configuration
  - **Objective:** Create the project manifest with approved dependencies, scripts, and engine constraints.
  - **Files:** `package.json`, `.nvmrc`, `.env.example`
  - **Requirements:** REQ-QUAL-011, REQ-QUAL-012, REQ-SEC-001, REQ-SEC-002
  - **Design references:** Section 6 (directory structure), Section 9 (config)
  - **Depends on:** Nothing
  - **Implementation notes:**
    - `engines: { "node": ">=20.0.0 <21.0.0" }`
    - `.nvmrc` contains `20`
    - Use exact or tilde versions for all dependencies
    - Dependencies: `phaser`
    - Dev dependencies: `typescript`, `vite`, `vitest`, `@vitest/coverage-v8`, `playwright`, `@playwright/test`, `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-import-x`, `prettier`, `eslint-config-prettier`
    - `.env.example` contains only `# No secrets required — this file is intentionally empty`
    - Define all npm scripts per tooling.md
  - **Validation:** `npm ci` completes without error
  - **Completion criteria:** `package.json` exists with all approved scripts and dependencies; `npm ci` installs without error; `.nvmrc` contains `20`; `.env.example` present and empty of secrets

- [ ] 1.2 Configure TypeScript
  - **Objective:** Create strict TypeScript configuration compatible with Vite.
  - **Files:** `tsconfig.json`
  - **Requirements:** REQ-QUAL-001
  - **Design references:** Section 6, architecture.md TypeScript Rules
  - **Depends on:** 1.1
  - **Implementation notes:**
    - `strict: true`
    - `target: "ES2020"`
    - `module: "ESNext"`, `moduleResolution: "Bundler"`
    - `noEmit: true` (Vite handles emit)
    - Include `src/`
  - **Validation:** `npm run typecheck` passes with empty `src/main.ts`
  - **Completion criteria:** `tsc --noEmit` exits 0

- [ ] 1.3 Configure Vite
  - **Objective:** Set up Vite as the dev server and production bundler with the approved base path.
  - **Files:** `vite.config.ts`, `index.html`
  - **Requirements:** REQ-QUAL-011, REQ-SEC-013
  - **Design references:** Section 22 (responsive canvas)
  - **Depends on:** 1.1, 1.2
  - **Implementation notes:**
    - `base: process.env.VITE_BASE_PATH ?? '/chrono-defender/'`
    - `build.sourcemap: true`
    - `build.outDir: 'dist'`
    - `index.html` contains a `<div id="game-container"></div>` and a `<script type="module" src="/src/main.ts"></script>`
  - **Validation:** `npm run build` produces non-empty `dist/`; `npm run dev` starts without error
  - **Completion criteria:** Production build outputs `dist/index.html` and JS bundle

- [ ] 1.4 Configure ESLint
  - **Objective:** Set up ESLint 10 flat config with TypeScript and import rules.
  - **Files:** `eslint.config.js`
  - **Requirements:** REQ-QUAL-002
  - **Design references:** Section 6 (module boundary rules), tooling.md
  - **Depends on:** 1.1, 1.2
  - **Implementation notes:**
    - ESLint 10 flat config format (only format supported in ESLint 10)
    - `@typescript-eslint/recommended`
    - `import-x/no-cycle` rule (from `eslint-plugin-import-x`)
    - `no-console: "warn"`
    - Ignore `dist/`, `node_modules/`, `coverage/`
  - **Validation:** `npm run lint` exits 0 on empty src
  - **Completion criteria:** `eslint .` produces zero errors

- [ ] 1.5 Configure Prettier
  - **Objective:** Define formatting rules; ensure ESLint does not conflict.
  - **Files:** `.prettierrc`, `.prettierignore`
  - **Requirements:** REQ-QUAL-003
  - **Design references:** tooling.md
  - **Depends on:** 1.1
  - **Implementation notes:**
    - Single quotes, 2-space indent, trailing commas `"all"`
    - `.prettierignore` includes `dist/`, `node_modules/`, `coverage/`, `package-lock.json`
  - **Validation:** `npm run format:check` exits 0
  - **Completion criteria:** Prettier reports no violations

- [ ] 1.6 Configure Vitest
  - **Objective:** Set up Vitest 4 unit-test runner compatible with the domain-layer testing strategy.
  - **Files:** `vitest.config.ts`
  - **Requirements:** REQ-QUAL-004, REQ-QUAL-007, REQ-QUAL-008
  - **Design references:** Section 25 (testing architecture)
  - **Depends on:** 1.1, 1.2
  - **Implementation notes:**
    - Vitest 4.x — test functions (`describe`, `it`, `expect`, `vi`) must be explicitly imported from `vitest`
    - `test.include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']`
    - `test.environment: 'node'` (default; no jsdom unless explicit)
    - Coverage via `@vitest/coverage-v8@4.x`
  - **Validation:** `npm run test` exits 0 (no tests yet = success)
  - **Completion criteria:** Vitest config loads without error

- [ ] 1.7 Configure Playwright
  - **Objective:** Set up E2E test runner targeting three browsers against vite preview.
  - **Files:** `playwright.config.ts`
  - **Requirements:** REQ-QUAL-009, REQ-QUAL-010
  - **Design references:** Section 25 (Playwright browsers)
  - **Depends on:** 1.3
  - **Implementation notes:**
    - Projects: Chromium, Firefox, WebKit
    - `webServer: { command: 'npm run preview', url: 'http://localhost:4173', reuseExistingServer: true }`
    - `testDir: 'tests/e2e'`
    - `use.baseURL: 'http://localhost:4173/chrono-defender/'`
  - **Validation:** `npx playwright install` succeeds; config loads without error
  - **Completion criteria:** Playwright config accepted by `playwright test --list`

- [ ] 1.8 Create .gitignore, .kiroignore, and initial directory structure
  - **Objective:** Establish the approved directory tree and prevent unwanted files from being committed.
  - **Files:** `.gitignore`, `.kiroignore`, `src/main.ts`, `src/config/index.ts`, `src/domain/.gitkeep`, `src/scenes/.gitkeep`, `src/systems/.gitkeep`, `src/entities/.gitkeep`, `src/ui/.gitkeep`, `src/persistence/.gitkeep`, `src/types/.gitkeep`, `src/utils/.gitkeep`, `src/assets/audio/.gitkeep`, `tests/unit/.gitkeep`, `tests/integration/.gitkeep`, `tests/e2e/.gitkeep`, `public/favicon.ico`
  - **Requirements:** REQ-SEC-001, REQ-SEC-002, REQ-SEC-014
  - **Design references:** Section 6 (directory structure), Section 26 (security)
  - **Depends on:** 1.1
  - **Implementation notes:**
    - `.gitignore` per Section 26: `node_modules/`, `dist/`, `.env`, `.env.*`, `*.pem`, `*.key`, `.DS_Store`, `coverage/`, `playwright-report/`, `test-results/`
    - `.kiroignore`: exclude `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `.env`, `.env.*`; keep `.kiro/steering/` and `.kiro/specs/` visible; no credentials or secrets in the file
    - `src/main.ts` exports nothing or logs a placeholder
    - `src/config/index.ts` is empty or re-exports nothing
  - **Validation:** `git status` shows no tracked ignored files; `.kiro/steering/` and `.kiro/specs/` remain visible to Kiro
  - **Completion criteria:** All directories exist; `.gitignore` blocks `node_modules/`, `dist/`, `.env`; `.kiroignore` excludes build artifacts

- [ ] 1.9 Create MIT LICENSE
  - **Objective:** Establish the repository's approved MIT license before implementation commits begin.
  - **Files:** `LICENSE`
  - **Requirements:** REQ-DEL-010, REQ-DEL-011
  - **Design references:** presentation.md
  - **Depends on:** Nothing
  - **Implementation notes:**
    - Standard MIT License text
    - Year: 2026
    - Copyright holder: repository owner or project name (no personal info unless consented)
    - Verify compatibility with Phaser (MIT) and all other dependencies
    - Third-party audio attribution, if later required, must be documented separately
  - **Validation:** `LICENSE` exists at root; contains full MIT text
  - **Completion criteria:** Repository is MIT-licensed before implementation proceeds

- [ ] 1.10 Validate full toolchain
  - **Objective:** Confirm the complete local dev loop works end to end.
  - **Files:** None (validation only)
  - **Requirements:** REQ-QUAL-001–REQ-QUAL-003, REQ-QUAL-011, REQ-QUAL-012
  - **Design references:** tooling.md (scripts table)
  - **Depends on:** 1.1–1.9
  - **Implementation notes:**
    - Run each command in sequence: `npm ci` → `npm run typecheck` → `npm run lint` → `npm run format:check` → `npm run test` → `npm run build`
    - All must exit 0
  - **Validation:** All six commands exit 0
  - **Completion criteria:** Green pipeline locally; `dist/` contains bundled output


---

## Phase 2 — Shared Types, Configuration, and Domain Foundation

- [ ] 2.1 Define shared type definitions
  - **Objective:** Create all shared interfaces, enums, and type aliases used across the codebase.
  - **Files:** `src/types/GameState.ts`, `src/types/EnemyTypes.ts`, `src/types/PowerUpTypes.ts`, `src/types/Events.ts`, `src/types/InputSnapshot.ts`
  - **Requirements:** REQ-PDEATH-001–020, REQ-ENEMY-001–018, REQ-POWERUP-001–023, REQ-COL-001–011, REQ-SCORE-001–012
  - **Design references:** Section 10 (data models)
  - **Depends on:** 1.2
  - **Implementation notes:**
    - `GameState` union type: `'LOADING' | 'MENU' | 'NEW_RUN_INIT' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'`
    - `PlayerLifecycleState`: `'ACTIVE' | 'INACTIVE' | 'INVULNERABLE'`
    - `EnemyType`: `'basic' | 'fast' | 'durable'`
    - `PowerUpType`: `'fire-rate' | 'move-speed' | 'health'`
    - All interfaces per Section 10: `RunState`, `PlayerState`, `CoreState`, `EnemyState`, `ProjectileState`, `WaveState`, `ScoreState`, `PowerUpState`, `ActivePowerUp`, `InputSnapshot`, `CollisionEvent`, `DamageEvent`, `DefeatEvent`, `DomainEvent`
  - **Validation:** `npm run typecheck` passes
  - **Completion criteria:** All interfaces compile; no `any` types used

- [ ] 2.2 Create utility functions
  - **Objective:** Implement pure math and helper utilities with tests.
  - **Files:** `src/utils/mathUtils.ts`, `src/utils/idGenerator.ts`, `src/utils/logger.ts`, `tests/unit/utils/mathUtils.test.ts`, `tests/unit/utils/idGenerator.test.ts`
  - **Requirements:** REQ-MOVE-005, REQ-MOVE-008, REQ-PDEATH-003, REQ-CORE-006
  - **Design references:** Section 6 (utils), Section 11 (diagonal normalization)
  - **Depends on:** 1.6, 2.1
  - **Implementation notes:**
    - `clamp(value, min, max)`, `normalizeVector(x, y)`, `angleBetween(x1, y1, x2, y2)`, `lerp(a, b, t)`
    - `idGenerator`: monotonic counter; `nextId(): number`; never reuses within process lifetime
    - `logger`: `log()`, `warn()`, `error()` — no-ops when `import.meta.env.PROD`
  - **Validation:** Unit tests pass; 100% branch coverage on math functions
  - **Completion criteria:** All utils tested; `npm run test` passes

- [ ] 2.3 Implement seeded PRNG
  - **Objective:** Create a deterministic pseudo-random number generator for wave generation.
  - **Files:** `src/domain/seededPrng.ts`, `tests/unit/domain/seededPrng.test.ts`
  - **Requirements:** REQ-WAVE-005
  - **Design references:** Section 16 (spawn positions)
  - **Depends on:** 1.6
  - **Implementation notes:**
    - Mulberry32 or equivalent; `createPrng(seed: number): () => number` returns values in [0, 1)
    - Same seed must produce identical sequence
  - **Validation:** Test: same seed → same 100 values; different seed → different values
  - **Completion criteria:** Determinism proven by test; `npm run test` passes

- [ ] 2.4 Create typed game configuration with validation
  - **Objective:** Centralize all tunable and fixed values with runtime validation.
  - **Files:** `src/config/gameConfig.ts`, `src/config/playerConfig.ts`, `src/config/enemyConfig.ts`, `src/config/waveConfig.ts`, `src/config/powerUpConfig.ts`, `src/config/audioConfig.ts`, `src/config/storageConfig.ts`, `src/config/index.ts`, `src/domain/configValidator.ts`, `tests/unit/domain/configValidator.test.ts`
  - **Requirements:** REQ-PERF-007, REQ-MOVE-007, REQ-SHOOT-006, REQ-PDEATH-007, REQ-PDEATH-009, REQ-PDEATH-012, REQ-WAVE-008, REQ-WAVE-010, REQ-POWERUP-023, REQ-SCORE-012, REQ-ENEMY-001, REQ-ENEMY-002, REQ-ENEMY-009, REQ-ENEMY-010
  - **Design references:** Section 9 (configuration model)
  - **Depends on:** 2.1, 2.2
  - **Implementation notes:**
    - All config values per Section 9; `configValidator.ts` validates at import time
    - Throws descriptive `Error` on invalid config; `Object.freeze` after validation
    - Fixed values: `LOGICAL_WIDTH=1280`, `LOGICAL_HEIGHT=720`, `MIN_VIEWPORT_WIDTH=800`, `MIN_VIEWPORT_HEIGHT=450`, `PLAYER_INACTIVE_DURATION=3000`, `PLAYER_INVULN_DURATION=2000`, `POWERUP_DROP_INTERVAL=10`, `MAX_SCORE=Number.MAX_SAFE_INTEGER`
    - Cross-field: `fast.health < basic.health < durable.health`; `durable.speed < basic.speed < fast.speed`
  - **Validation:** Tests: valid config passes; missing field throws; out-of-range throws; cross-field violation throws; MAX_SCORE is MAX_SAFE_INTEGER
  - **Completion criteria:** `configValidator` runs without error on default config; throws on 5+ invalid scenarios

---

## Phase 3 — Clock, State Machines, and Run Lifecycle

- [ ] 3.1 Implement GameStateMachine
  - **Objective:** Create the domain-layer state machine governing overall game state transitions.
  - **Files:** `src/domain/GameStateMachine.ts`, `tests/unit/domain/GameStateMachine.test.ts`
  - **Requirements:** REQ-PAUSE-001–004, REQ-PAUSE-010–013, REQ-CORE-008, REQ-GAMEOVER-001, REQ-GAMEOVER-003, REQ-MENU-002, REQ-LOAD-003
  - **Design references:** Section 7 (game-state model)
  - **Depends on:** 2.1
  - **Implementation notes:**
    - States: LOADING, MENU, NEW_RUN_INIT, PLAYING, PAUSED, GAME_OVER
    - Allowed transitions per Section 7 diagram (including Paused→GameOver)
    - `transition(next)` validates; throws in dev on prohibited; no-op in production
    - Duplicate same-state transition is no-op
  - **Validation:** Tests: every allowed transition; every prohibited transition; duplicate request
  - **Completion criteria:** All transition paths tested; `npm run test` passes

- [ ] 3.2 Implement PlayerStateMachine
  - **Objective:** Create the player lifecycle state machine (ACTIVE/INACTIVE/INVULNERABLE).
  - **Files:** `src/domain/PlayerStateMachine.ts`, `tests/unit/domain/PlayerStateMachine.test.ts`
  - **Requirements:** REQ-PDEATH-004, REQ-PDEATH-011, REQ-PDEATH-015, REQ-PDEATH-020
  - **Design references:** Section 7, Section 12
  - **Depends on:** 2.1
  - **Implementation notes:**
    - Allowed: ACTIVE→INACTIVE, INACTIVE→INVULNERABLE, INVULNERABLE→ACTIVE
    - Duplicate INACTIVE transition is no-op (REQ-PDEATH-020)
    - `reset()` returns to ACTIVE
  - **Validation:** Happy path; duplicate death; prohibited transitions; reset
  - **Completion criteria:** All 3 transitions + guards tested

- [ ] 3.3 Implement GameStateController
  - **Objective:** Orchestrate state transitions with priority, pending-death handling, and run lifecycle.
  - **Files:** `src/systems/GameStateController.ts`, `tests/unit/systems/GameStateController.test.ts`
  - **Requirements:** REQ-PAUSE-001–013, REQ-CORE-008, REQ-PDEATH-004, REQ-GAMEOVER-003, REQ-RESTART-001–010
  - **Design references:** Section 7, Section 8 (steps 2 and 4)
  - **Depends on:** 3.1, 3.2, 2.4
  - **Implementation notes:**
    - Owns `GameStateMachine`; `processTransitions(snapshot, pendingDeath, pendingGameOver)` applies priority
    - Pending player-death processed on next frame; discarded if game-over is pending
    - `initRun()` resets RunState, PlayerState, CoreState, WaveState, ScoreState
    - Focus-loss → auto-pause; focus-restore does NOT auto-resume
    - Pause debounced one frame after death transition
  - **Validation:** Tests: pause toggle; focus-loss; game-over priority over death; pending death discarded; initRun resets; no auto-resume
  - **Completion criteria:** Priority logic verified; run lifecycle tested

---

## Phase 4 — Persistence

- [ ] 4.1 Implement HighScoreRepository
  - **Objective:** Create the localStorage abstraction, test mock, and safe parsing.
  - **Files:** `src/persistence/HighScoreRepository.ts`, `src/domain/highScoreParser.ts`, `tests/unit/persistence/HighScoreRepository.test.ts`, `tests/unit/domain/highScoreParser.test.ts`
  - **Requirements:** REQ-HSCORE-001–011, REQ-SEC-003
  - **Design references:** Section 18, Section 23
  - **Depends on:** 2.4
  - **Implementation notes:**
    - `IHighScoreRepository` interface; `LocalStorageHighScoreRepository`; `MockHighScoreRepository`
    - `parseStoredScore(raw)`: null, empty, whitespace, NaN, negative, non-integer, non-finite, >MAX_SCORE → 0
    - All localStorage in try/catch; write only if current > stored
  - **Validation:** Tests: all 6 invalid-value branches; read/write failures; valid write; comparison
  - **Completion criteria:** 100% branch coverage on `parseStoredScore`; mock supports failure simulation

---

## Phase 5 — Input System

- [ ] 5.1 Implement InputManager
  - **Objective:** Single input-capture point producing normalized InputSnapshots.
  - **Files:** `src/systems/InputManager.ts`, `tests/unit/systems/InputManager.test.ts`
  - **Requirements:** REQ-MOVE-001–016, REQ-SHOOT-001–015, REQ-PAUSE-001–003, REQ-PAUSE-012–013
  - **Design references:** Section 11 (input design)
  - **Depends on:** 2.1, 2.2
  - **Implementation notes:**
    - `capture(): InputSnapshot`; diagonal normalization; opposing cancellation; `pausePressed` one-frame; `pointerInCanvas`; `window.blur` clears keys; scroll prevention on gameplay keys; `destroy()` removes all listeners
  - **Validation:** Unit tests for pure computation logic (normalization, cancellation, pointer retention)
  - **Completion criteria:** Pure logic tested; Phaser adapter thin and reviewed; `npm run test` passes
  - **Cleanup:** `destroy()` removes keyboard listeners, pointer listeners, blur/focus listeners. Calling `destroy()` twice is safe.

---

## Phase 6 — Phaser Bootstrap and Scenes

- [ ] 6.1 Create application entry point and Phaser game instance
  - **Objective:** Bootstrap Phaser with approved game configuration.
  - **Files:** `src/main.ts`, `src/config/gameConfig.ts` (update)
  - **Requirements:** REQ-LOAD-001, REQ-PERF-007
  - **Design references:** Section 5, Section 9
  - **Depends on:** 1.3, 2.4
  - **Implementation notes:**
    - Call `configValidator` before Phaser.Game; `Phaser.AUTO`, `Scale.FIT`, `autoCenter: CENTER_BOTH`; 1280×720; register all scenes; mount into `#game-container`
  - **Validation:** `npm run build` succeeds; `npm run dev` shows canvas
  - **Completion criteria:** Phaser starts without error; canvas visible

- [ ] 6.2 Implement Boot and Preload scenes
  - **Objective:** Asset-loading pipeline with progress and failure handling.
  - **Files:** `src/scenes/Boot.ts`, `src/scenes/Preload.ts`
  - **Requirements:** REQ-LOAD-001–007, REQ-A11Y-002
  - **Design references:** Section 7, Section 24
  - **Depends on:** 6.1
  - **Implementation notes:**
    - Boot: viewport check; Preload: load audio, show numeric progress, catch loaderror, always transition to MainMenu
  - **Validation:** Manual: loading screen; asset-failure path
  - **Completion criteria:** Preload → MainMenu always; failed assets logged silently

- [ ] 6.3 Implement MainMenu scene
  - **Objective:** Title screen with Start, Controls, audio, high score, keyboard navigation.
  - **Files:** `src/scenes/MainMenu.ts`, `src/ui/MenuUI.ts`
  - **Requirements:** REQ-MENU-001–014, REQ-A11Y-005, REQ-A11Y-006, REQ-A11Y-010
  - **Design references:** Section 7, Section 21
  - **Depends on:** 6.2, 4.1, 5.1
  - **Implementation notes:**
    - MenuUI: Tab/Shift+Tab, Enter/Space, mouse click; initial focus on Start; Controls inline panel; high score from repository
  - **Validation:** Manual: Tab cycles; Enter activates; Start → Game; Controls panel shows
  - **Completion criteria:** All REQ-MENU criteria met; keyboard nav functional

- [ ] 6.4 Implement Game scene shell (progressive)
  - **Objective:** Build the Game scene lifecycle and deterministic update-loop structure as a progressive shell.
  - **Files:** `src/scenes/Game.ts`
  - **Requirements:** REQ-PAUSE-001, REQ-MOVE-015
  - **Design references:** Section 8 (update order)
  - **Depends on:** 3.3, 5.1, 6.1
  - **Implementation notes:**
    - Create Game scene with the approved 17-step update structure
    - Use typed optional references or a system registry with guarded calls for systems not yet implemented
    - Do not create fake production systems or large placeholder classes
    - Each later task from Phases 7–13 is responsible for: constructing its system, registering it with the Game scene, inserting its update call at the correct step, and registering its shutdown cleanup
    - Cap delta to configured maximum (100ms)
    - `shutdown()` calls `destroy()` on all registered systems
  - **Validation:** Scene starts; update loop skeleton runs without error; shutdown cleans up
  - **Completion criteria:** Game scene starts from MainMenu; update-loop executes; unimplemented systems are absent safely; pause and lifecycle wiring functional at shell level; later systems integrate without restructuring

- [ ] 6.5 Implement GameOver scene
  - **Objective:** Final score, highest wave, high score, Restart action, keyboard navigation.
  - **Files:** `src/scenes/GameOver.ts`
  - **Requirements:** REQ-GAMEOVER-001–008, REQ-A11Y-005, REQ-A11Y-006
  - **Design references:** Section 7, Section 21
  - **Depends on:** 6.1, 4.1
  - **Implementation notes:**
    - Receive data via `scene.start('GameOver', data)`; display score, wave, high score; Restart with focus; write high score; play game-over SFX via AudioManager; MenuUI navigation
  - **Validation:** Manual: score displays; Restart → wave 1; keyboard works
  - **Completion criteria:** All REQ-GAMEOVER criteria met

- [ ] 6.6 Add safe Phaser observability hooks for E2E tests
  - **Objective:** Provide stable, non-production-sensitive observability for Playwright tests without brittle canvas inspection or arbitrary timing.
  - **Files:** `src/scenes/Game.ts` (update), game container DOM integration, `src/types/TestHooks.ts`, applicable unit tests
  - **Requirements:** REQ-QUAL-009, REQ-QUAL-010, REQ-SEC-012, REQ-CICD-003
  - **Design references:** Section 25 (testing architecture), Section 17 (Phaser adapter boundary), Section 26 (security)
  - **Depends on:** 6.4, 2.1, 3.3
  - **Implementation notes:**
    - Set a stable `data-scene` attribute on the game container whenever the active scene changes. Use approved keys: `boot`, `preload`, `main-menu`, `game`, `game-over`.
    - Expose `window.__CHRONO_TEST__` only in development, test, or explicitly enabled E2E builds — not in the normal production build.
    - Define via a TypeScript interface (`TestHooks`).
    - Limit to minimum operations: read current game state, player lifecycle state, current wave, player health, core health, score, game-clock value; a controlled method for setting core health (validated and clamped).
    - Prefer read-only snapshots. Mutation methods validate input and route through domain rules.
    - Do not expose Phaser internals, storage, eval, or unrestricted state mutation.
    - Remove or tree-shake the hook in production builds.
    - Scene shutdown removes stale references. Repeated scene entry replaces (not duplicates) hook state.
  - **Validation:** Verify `data-scene` changes with transitions; test API exists in test mode; absent in production build; state reads return snapshots; invalid core-health rejected; no stale references after restart; no console errors
  - **Completion criteria:** Playwright can detect current scene; read approved state; trigger game-over setup without Phaser internals; production builds do not expose test API; tests pass


---

## Phase 7 — Player and Energy Core

- [ ] 7.1 Implement Player entity with movement and health
  - **Objective:** Create the player entity, view, controller, and movement system with boundary clamping.
  - **Files:** `src/entities/PlayerEntity.ts`, `src/systems/PlayerController.ts`, `src/domain/vectorMath.ts`, `tests/unit/domain/vectorMath.test.ts`
  - **Requirements:** REQ-MOVE-001–016, REQ-PDEATH-001–003
  - **Design references:** Section 12, Section 11
  - **Depends on:** 5.1, 6.4, 2.4
  - **Implementation notes:**
    - PlayerEntity: circular physics body, PlayerView (triangle via Graphics)
    - PlayerController: reads InputSnapshot; computes velocity; clamps to boundaries; position set directly
    - Movement speed from config; skip when paused or inactive
  - **Validation:** Unit: vectorMath; boundary clamp; diagonal normalization speed
  - **Completion criteria:** Player moves correctly; never exits boundaries; diagonal speed = configured speed
  - **Cleanup:** `destroy()` removes movement/input subscriptions, destroys PlayerView Graphics object, nullifies physics body. Called from Game.shutdown(). Safe to call twice.

- [ ] 7.2 Implement RespawnSystem (death, inactive, respawn, invulnerability)
  - **Objective:** Handle full player death → inactive → respawn → invulnerable → active lifecycle.
  - **Files:** `src/systems/RespawnSystem.ts`, `src/ui/RespawnOverlay.ts`, `tests/unit/systems/RespawnSystem.test.ts`, `tests/integration/gameLoop/respawnChain.test.ts`
  - **Requirements:** REQ-PDEATH-004–020
  - **Design references:** Section 12, Section 7
  - **Depends on:** 3.2, 7.1, 2.4
  - **Implementation notes:**
    - Injectable `clock: { now: number }`; inactive timer 3000ms; invuln timer 2000ms; teleport to respawn; restore max health; flashing outline ≤3Hz + SHIELD label; duplicate death guard via PlayerStateMachine; timers auto-pause with scene
  - **Validation:** Unit: inactive elapses → respawn; invuln → active after 2s; pause suspends; duplicate death no-op. Integration: full chain with fake clock.
  - **Completion criteria:** All REQ-PDEATH verified; `npm run test` passes
  - **Cleanup:** `destroy()` cancels inactive and invulnerability timers, removes pending respawn callbacks, clears subscriptions. Calling twice is safe. Called from Game.shutdown().

- [ ] 7.3 Implement Energy Core entity
  - **Objective:** Stationary core with health, damage, game-over trigger.
  - **Files:** `src/entities/CoreEntity.ts`, `tests/unit/entities/CoreEntity.test.ts`
  - **Requirements:** REQ-CORE-001–012
  - **Design references:** Section 13
  - **Depends on:** 2.4, 6.4
  - **Implementation notes:**
    - Position: center, never mutates; health [0, max]; game-over at 0; CoreView: octagon + health arc + numeric label; `reset()` for new run
  - **Validation:** Unit: damage clamp; simultaneous damage; game-over at 0; health ≤ max; player death no effect
  - **Completion criteria:** Core health model tested; visual renders

---

## Phase 8 — Combat and Projectiles

- [ ] 8.1 Implement CombatSystem and ProjectileSystem
  - **Objective:** Fire cooldown, projectile spawning, lifetime, boundaries, active cap.
  - **Files:** `src/systems/CombatSystem.ts`, `src/systems/ProjectileSystem.ts`, `src/entities/ProjectileEntity.ts`, `tests/unit/systems/CombatSystem.test.ts`, `tests/unit/systems/ProjectileSystem.test.ts`
  - **Requirements:** REQ-SHOOT-001–015, REQ-PERF-002
  - **Design references:** Section 14
  - **Depends on:** 7.1, 5.1, 2.4
  - **Implementation notes:**
    - CombatSystem: `fireCooldownEnd`; effectiveCooldown from power-ups; hold-to-fire; cap check
    - ProjectileSystem: advance position; boundary/lifetime removal; `markedForRemoval`
  - **Validation:** Unit: cooldown; cap; lifetime; boundary; held fire; paused no fire; inactive no fire
  - **Completion criteria:** All REQ-SHOOT tested
  - **Cleanup:** `ProjectileSystem.destroyAll()` removes all active projectiles, cancels timers, removes physics registrations. `CombatSystem.destroy()` clears cooldown state. Both called from Game.shutdown(). Safe to call twice.

---

## Phase 9 — Enemies

- [ ] 9.1 Implement enemy entities and EnemySystem
  - **Objective:** Three config-driven enemy types with movement, contact, removal lifecycle.
  - **Files:** `src/entities/EnemyEntity.ts`, `src/systems/EnemySystem.ts`, `tests/unit/systems/EnemySystem.test.ts`
  - **Requirements:** REQ-ENEMY-001–018, REQ-PERF-001
  - **Design references:** Section 15
  - **Depends on:** 2.3, 2.4, 7.3, 6.4
  - **Implementation notes:**
    - Single class, config-driven; shapes: diamond/triangle/hexagon; movement toward core; `markedForRemoval` + `removalReason`; boundary removal; spawn on edges
  - **Validation:** Unit: config correct; movement direction; boundary; marked no-ops; health/speed ordering
  - **Completion criteria:** Three types render distinctly; movement tested; removal lifecycle tested
  - **Cleanup:** `EnemySystem.destroy()` removes all enemy entities, cancels any enemy timers, clears physics groups and contact handlers. Called from Game.shutdown(). Safe to call twice.

---

## Phase 10 — Wave System

- [ ] 10.1 Implement wave formulas
  - **Objective:** Pure deterministic functions for wave composition and difficulty.
  - **Files:** `src/domain/waveFormulas.ts`, `tests/unit/domain/waveFormulas.test.ts`
  - **Requirements:** REQ-WAVE-002–005, REQ-WAVE-014–015, REQ-QUAL-006
  - **Design references:** Section 16
  - **Depends on:** 2.3, 2.4
  - **Implementation notes:**
    - `enemyCount`, `spawnInterval`, `speedMultiplier`, `healthMultiplier`, `buildSpawnQueue`; type introduction thresholds; ceilings; zero-enemy edge case
  - **Validation:** Tests at wave 1, 10, 50; ceiling; zero-enemy; determinism; different seed
  - **Completion criteria:** All formula behaviors verified

- [ ] 10.2 Implement WaveSystem
  - **Objective:** Spawn queue, intermission, completion detection, cap enforcement.
  - **Files:** `src/systems/WaveSystem.ts`, `tests/unit/systems/WaveSystem.test.ts`, `tests/integration/gameLoop/waveProgression.test.ts`
  - **Requirements:** REQ-WAVE-001, REQ-WAVE-006–020
  - **Design references:** Section 16
  - **Depends on:** 10.1, 9.1, 3.3
  - **Implementation notes:**
    - Game-clock timers; pending queue (delayed not lost); wave complete condition; intermission → `ScoreSystem.recordWaveComplete(waveNumber)`; increment waveNumber at next wave; player death invisible; `destroy()` cancels timers without marking defeats
  - **Validation:** Unit: cap delays; completion; intermission; zero-enemy wave. Integration: wave 1→2 progression.
  - **Completion criteria:** Clear-triggered progression; cap enforcement; pause suspends
  - **Cleanup:** `WaveSystem.destroy()` cancels all wave spawn timers, intermission timer, clears pending spawn queue. Called from Game.shutdown(). Safe to call twice.

---

## Phase 11 — Collision and Damage Resolution

- [ ] 11.1 Implement CollisionResolution system
  - **Objective:** Record Phaser overlap events as normalized CollisionEvent candidates.
  - **Files:** `src/systems/CollisionResolution.ts`
  - **Requirements:** REQ-COL-001–011
  - **Design references:** Section 17
  - **Depends on:** 8.1, 9.1, 7.1, 7.3
  - **Implementation notes:**
    - 4 overlap groups; callbacks check `markedForRemoval` and player lifecycle; append CollisionEvent only; `resolve()` returns and clears frame list; `destroy()` removes all colliders
  - **Validation:** Manual review; integration tests in 11.2
  - **Completion criteria:** Callbacks only record; `markedForRemoval` prevents duplicates
  - **Cleanup:** `CollisionResolution.destroy()` removes all registered overlap/collider handlers, clears the normalized event queue and deduplication state. Called from Game.shutdown() before entity destruction. Safe to call twice.

- [ ] 11.2 Implement HealthDamageSystem
  - **Objective:** Process collision events deterministically; apply damage, emit defeats, handle game-over.
  - **Files:** `src/systems/HealthDamageSystem.ts`, `tests/unit/systems/HealthDamageSystem.test.ts`, `tests/integration/gameLoop/collisionResolution.test.ts`
  - **Requirements:** REQ-COL-001–011, REQ-CORE-004–008, REQ-PDEATH-003–004, REQ-ENEMY-005–008, REQ-SCORE-001–003
  - **Design references:** Section 17
  - **Depends on:** 11.1, 7.2, 7.3, 9.1
  - **Implementation notes:**
    - Insertion-order processing; `Set<string>` pair deduplication; emit DefeatEvent on enemy defeat; emit core-game-over; set pending death flag; `removeMarked()` destroys entities
  - **Validation:** Unit: duplicate pair ignored; defeated no further damage; core-game-over exits; invulnerable no-op. Integration: simultaneous collisions; projectile one-enemy limit.
  - **Completion criteria:** All REQ-COL verified

---

## Phase 12 — Score System

- [ ] 12.1 Implement ScoreSystem
  - **Objective:** Track score, highest completed wave, prevent duplicate awards.
  - **Files:** `src/systems/ScoreSystem.ts`, `src/domain/scoreHelpers.ts`, `tests/unit/systems/ScoreSystem.test.ts`, `tests/unit/domain/scoreHelpers.test.ts`
  - **Requirements:** REQ-SCORE-001–012, REQ-RESTART-001
  - **Design references:** Section 18
  - **Depends on:** 11.2, 2.4, 4.1
  - **Implementation notes:**
    - Owns ScoreState; per-run ID Set; `addScore` clamped to MAX_SCORE; `recordWaveComplete`; `reset()`; player death no effect
  - **Validation:** Unit: valid defeat; duplicate blocked; overflow; reset; death no change; wave tracked
  - **Completion criteria:** All REQ-SCORE verified

---

## Phase 13 — Power-Up System

- [ ] 13.1 Implement PowerUpSystem
  - **Objective:** Defeat counting, type cycling, spawning, collection, effects, expiration.
  - **Files:** `src/systems/PowerUpSystem.ts`, `src/entities/PowerUpEntity.ts`, `src/domain/powerUpHelpers.ts`, `tests/unit/systems/PowerUpSystem.test.ts`, `tests/unit/domain/powerUpHelpers.test.ts`
  - **Requirements:** REQ-POWERUP-001–023
  - **Design references:** Section 19
  - **Depends on:** 11.2, 7.2, 2.4
  - **Implementation notes:**
    - Every 10 defeats → spawn at clamped position; cycle fire-rate→speed→health; collection if ACTIVE/INVULNERABLE; same type resets duration; health restore clamped; lazy effect read; progress survives death; resets on new run; `destroy()` removes entities and timers
  - **Validation:** Unit: threshold; cycle; clamping; inactive blocks; invuln allows; same-type reset; health clamp; expiry; death no reset; new run resets. Integration: expiry and duration via fake clock.
  - **Completion criteria:** All REQ-POWERUP verified
  - **Cleanup:** `PowerUpSystem.destroy()` removes all power-up entities, cancels effect-expiration timers, clears collection callbacks and defeat-progress state. Called from Game.shutdown(). Safe to call twice.

---

## Phase 14 — HUD, Menus, Responsive UI, and Accessibility

- [ ] 14.1 Implement HUD
  - **Objective:** Display all gameplay state in a fixed-camera overlay scene.
  - **Files:** `src/ui/HUD.ts`, `src/ui/PauseOverlay.ts`
  - **Requirements:** REQ-CORE-009–010, REQ-SCORE-004, REQ-WAVE-011, REQ-WAVE-020, REQ-PDEATH-014, REQ-POWERUP-019, REQ-PAUSE-008, REQ-A11Y-001, REQ-A11Y-007–009
  - **Design references:** Section 21
  - **Depends on:** 6.4, 7.2, 12.1, 13.1, 10.2
  - **Implementation notes:**
    - Overlay scene; score, wave, HP bars+numbers, power-up indicators, respawn countdown, invuln label, PauseOverlay, audio controls; all WCAG AA; non-color indicators; ≤3Hz flash
  - **Validation:** Manual visual review
  - **Completion criteria:** All HUD requirements met visually
  - **Manual testing required:** Yes

- [ ] 14.2 Implement responsive canvas and viewport handling
  - **Objective:** Proper scaling, centering, below-minimum fallback.
  - **Files:** `src/scenes/Boot.ts` (update)
  - **Requirements:** REQ-A11Y-002–004, REQ-PERF-006
  - **Design references:** Section 22
  - **Depends on:** 6.2
  - **Implementation notes:**
    - Scale.FIT + CENTER_BOTH; below 800×450 show message; state in domain objects only
  - **Validation:** Manual: resize; letterboxing; below-minimum message
  - **Completion criteria:** Canvas scales; state preserved; below-minimum handled
  - **Manual testing required:** Yes

---

## Phase 15 — Audio

- [ ] 15.1 ⚠️ HUMAN APPROVAL REQUIRED: Select audio asset source
  - **Objective:** Choose and verify the audio asset source before any files are committed.
  - **Files:** None (decision only)
  - **Requirements:** REQ-AUDIO-015, REQ-SEC-001
  - **Design references:** Section 20
  - **Depends on:** None
  - **Implementation notes:**
    - Choose: procedural (Web Audio offline), CC0, or CC-BY with attribution
    - Verify MIT compatibility; document source and license
    - CC-BY requires attribution file
  - **Completion criteria:** Human approves; license documented
  - **⚠️ Do not proceed to 15.2 without explicit approval**

- [ ] 15.2 Implement AudioManager and sound effects
  - **Objective:** Audio wrapper with graceful degradation, mute/volume.
  - **Files:** `src/systems/AudioManager.ts`, `src/assets/audio/` (approved files), `tests/unit/systems/AudioManager.test.ts`
  - **Requirements:** REQ-AUDIO-001–017
  - **Design references:** Section 20
  - **Depends on:** 15.1 (approval), 6.2, 2.4
  - **Implementation notes:**
    - Singleton; no-op mode; `flushEvents`; mute/volume persist; 5 events; .ogg+.mp3; no music
  - **Validation:** Unit: no-op mode; mute/volume; queue flush; pause/resume
  - **Completion criteria:** All REQ-AUDIO met; game playable without audio

---

## Phase 16 — Error Handling and Resource Cleanup

- [ ] 16.1 Implement error handling and production safety
  - **Objective:** Safe behavior for all failure modes; no sensitive data exposed.
  - **Files:** `src/utils/logger.ts` (update), scene `create()` methods, `src/scenes/Boot.ts`
  - **Requirements:** REQ-PERF-007, REQ-SEC-012, REQ-LOAD-004–005, REQ-AUDIO-011–012, REQ-HSCORE-009–010
  - **Design references:** Section 24
  - **Depends on:** 6.2, 4.1, 15.2
  - **Implementation notes:**
    - Logger no-ops in production; scene try/catch; generic error message; no stack traces to player
  - **Validation:** Manual: trigger failure; verify safe behavior
  - **Completion criteria:** All error paths safe; no sensitive exposure

- [ ] 16.2 Verify resource lifecycle and cleanup (integration)
  - **Objective:** Validate that cleanup already implemented by Phase 7–13 tasks functions correctly across restarts and scene transitions.
  - **Files:** `tests/integration/gameLoop/cleanup.test.ts`
  - **Requirements:** REQ-PERF-004–005, REQ-COL-010, REQ-POWERUP-021
  - **Design references:** Section 29
  - **Depends on:** All Phase 7–13 tasks
  - **Implementation notes:**
    - This task validates cleanup — it does not introduce new `destroy()` methods (those exist from earlier tasks)
    - Test: start run → wave 2 → game over → restart → verify no orphan timers/listeners
    - Spy on destroy() calls; verify timer removal; verify collider removal
    - Repeated scene entry: verify no duplicate registrations
  - **Validation:** Integration test passes; no duplicate-listener warnings
  - **Completion criteria:** Cleanup verified for all systems

---

## Phase 17 — Test Completion and Coverage

- [ ] 17.1 Complete unit and integration test suite
  - **Objective:** Fill coverage gaps; ensure all domain logic and systems fully tested.
  - **Files:** All `tests/unit/` and `tests/integration/` files
  - **Requirements:** REQ-QUAL-004–008
  - **Design references:** Section 25
  - **Depends on:** All Phase 2–13 tasks
  - **Implementation notes:**
    - Review coverage; wave formulas at 1, 10, 50; score overflow; highScoreParser branches; collision dedup; state machine guards; no real-time sleeps
  - **Validation:** `npm run test -- --coverage`; all pass
  - **Completion criteria:** All systems tested; zero failures; no setTimeout sleeps

---

## Phase 18 — Playwright E2E

- [ ] 18.1 Implement Playwright smoke test suite
  - **Objective:** Verify core user flows in real browsers against production build.
  - **Files:** `tests/e2e/smoke.spec.ts`
  - **Requirements:** REQ-QUAL-009–010
  - **Design references:** Section 25
  - **Depends on:** 1.7, 6.6, all gameplay systems
  - **Implementation notes:**
    - Run against `vite preview`; Chromium, Firefox, WebKit
    - Use `data-scene` attribute and `window.__CHRONO_TEST__` interface from task 6.6
    - Do not inspect private Phaser internals or add ad hoc test-only globals
    - Scenarios: page load + canvas; menu Tab nav; Start → game; WASD no scroll; Escape → pause overlay visible + game-time suspended → Escape → overlay removed + run continues; set core health to 0 → GameOver; Restart → wave 1; high-score persistence; base path `/chrono-defender/` resolves; no console errors
    - No arbitrary sleeps; use `waitForSelector`/`waitForFunction`
  - **Validation:** `npm run test:e2e` passes on all three browsers
  - **Completion criteria:** All scenarios pass; no flaky tests

---

## Phase 19 — Security Automation

- [ ] 19.1 Create Dependabot configuration
  - **Objective:** Automated dependency update PRs.
  - **Files:** `.github/dependabot.yml`
  - **Requirements:** REQ-SEC-008
  - **Design references:** Section 26
  - **Depends on:** 1.1
  - **Implementation notes:** `package-ecosystem: "npm"`, weekly, limit 10
  - **Completion criteria:** Valid YAML; Dependabot recognizes config

- [ ] 19.2 Create CodeQL workflow
  - **Objective:** GitHub code scanning for JS/TS.
  - **Files:** `.github/workflows/codeql.yml`
  - **Requirements:** REQ-SEC-007
  - **Design references:** Section 26
  - **Depends on:** 1.1
  - **Implementation notes:** `javascript-typescript`; push to main + PRs; SHA-pinned codeql-action; `permissions: security-events: write, contents: read`
  - **Completion criteria:** Valid workflow YAML

- [ ] 19.3 Security review checklist
  - **Objective:** Manual verification of credentials, unsafe patterns, policy violations.
  - **Files:** None (review only)
  - **Requirements:** REQ-SEC-001–014
  - **Depends on:** All Phase 1–18
  - **Implementation notes:** Grep for eval, Function, innerHTML, .env, keys, paths; verify .gitignore; verify no pull_request_target; verify SHA-pinned; verify npm audit; verify source maps
  - **Completion criteria:** Zero violations
  - **Manual testing required:** Yes

---

## Phase 20 — CI Workflow

- [ ] 20.1 Implement CI workflow (ci job)
  - **Objective:** Quality-gate job on PRs and pushes to main.
  - **Files:** `.github/workflows/ci.yml`
  - **Requirements:** REQ-CICD-001–006, REQ-SEC-006, REQ-SEC-009, REQ-SEC-011
  - **Design references:** Section 27
  - **Depends on:** 1.10, 17.1, 18.1, 19.1, 19.2
  - **Implementation notes:**
    - Single workflow; ci job; triggers: push main, PR main; `permissions: read-all`; Node 20.10.0; cache npm; steps: npm ci → typecheck → lint → format:check → test → build → test:e2e → npm audit; concurrency cancel PRs; SHA-pinned actions per ci-cd.md
  - **Validation:** Push feature branch; CI passes all 8 steps
  - **Completion criteria:** CI green; read-only permissions confirmed

---

## Phase 21 — GitHub Pages Deployment

- [ ] 21.1 Implement deploy job
  - **Objective:** Add deploy job to `ci.yml`; deploys only from main after CI passes.
  - **Files:** `.github/workflows/ci.yml` (append deploy job)
  - **Requirements:** REQ-CICD-007–011, REQ-SEC-009–011, REQ-DEL-004, REQ-DEL-006
  - **Design references:** Section 28
  - **Depends on:** 20.1
  - **Implementation notes:**
    - `deploy` job; `needs: ci`; `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`; permissions: contents read, pages write, id-token write; environment: github-pages; concurrency: pages, no cancel; steps: checkout → setup-node → npm ci → build → configure-pages → upload-pages-artifact (dist) → deploy-pages; all SHA-pinned; no workflow_run; no gh-pages branch; no secrets
  - **Validation:** Merge to main → site live at approved URL
  - **Completion criteria:** Game accessible at Pages URL; PRs do not deploy
  - **⚠️ HUMAN APPROVAL REQUIRED: First public deployment**

- [ ] 21.2 Configure repository Pages settings
  - **Objective:** Set Pages source to "GitHub Actions."
  - **Files:** None (GitHub UI)
  - **Requirements:** REQ-DEL-004
  - **Depends on:** 21.1
  - **Implementation notes:** Settings → Pages → Source: GitHub Actions; verify github-pages environment
  - **Completion criteria:** Live site accessible
  - **⚠️ HUMAN APPROVAL REQUIRED**

---

## Phase 22 — Documentation

- [ ] 22.1 Create README.md
  - **Objective:** Professional README with all required sections.
  - **Files:** `README.md`
  - **Requirements:** REQ-DEL-002–003, REQ-DEL-009
  - **Design references:** presentation.md
  - **Depends on:** 21.1
  - **Implementation notes:**
    - Sections: description, demo link, tech stack, setup, scripts, testing, controls, browser support, accessibility, security, CI/CD, architecture, audio attribution, license
    - Demo: `https://robinsonalexanderquiroz-droid.github.io/chrono-defender/`
    - No credentials, private URLs, paths, personal info
  - **Completion criteria:** All sections present; no sensitive content

- [ ] 22.2 Create documentation files
  - **Objective:** Architecture, testing, security, traceability docs.
  - **Files:** `docs/architecture.md`, `docs/testing.md`, `docs/security.md`, `docs/traceability.md`
  - **Requirements:** REQ-DEL-001, REQ-QUAL-001–012, REQ-SEC-001–014
  - **Depends on:** 22.1
  - **Implementation notes:** No credentials, personal info, or absolute paths
  - **Completion criteria:** All four docs present and accurate

---

## Phase 23 — Presentation

- [ ] 23.1 Create presentation script
  - **Objective:** Under-5-minute script covering gameplay, code, tests, security.
  - **Files:** `docs/presentation-script.md`
  - **Requirements:** REQ-DEL-007–009
  - **Design references:** presentation.md
  - **Depends on:** 22.1, 21.1
  - **Implementation notes:**
    - Sections: intro (30s), gameplay demo (90s), code walkthrough (60s), tests (45s), CI/deployment (30s), security (30s), closing (15s)
    - No credentials, personal info, or local paths; safe snippets only
  - **Completion criteria:** Script under 5 minutes when rehearsed
  - **⚠️ HUMAN APPROVAL REQUIRED: Before publishing presentation materials**

---

## Phase 24 — Final Audit and Release

- [ ] 24.1 Full quality gate verification
  - **Objective:** Complete local CI pipeline passes.
  - **Files:** None
  - **Requirements:** All REQ-QUAL, REQ-SEC, REQ-CICD
  - **Depends on:** All previous phases
  - **Implementation notes:** npm ci → typecheck → lint → format:check → test (coverage) → build → test:e2e → npm audit; all exit 0
  - **Completion criteria:** Full pipeline green

- [ ] 24.2 Security and content scan
  - **Objective:** Final scan for secrets, PII, unsafe patterns, license compliance.
  - **Files:** None (review)
  - **Requirements:** REQ-SEC-001–014, REQ-DEL-003, REQ-DEL-009
  - **Depends on:** 24.1
  - **Implementation notes:** Search keys/tokens/paths/emails; verify audio licenses; verify CodeQL clean; verify Pages live; verify README links
  - **Completion criteria:** Zero findings
  - **Manual testing required:** Yes

- [ ] 24.3 Browser compatibility and accessibility review
  - **Objective:** Manual testing in supported browsers.
  - **Files:** None (review)
  - **Requirements:** REQ-A11Y-001–010
  - **Depends on:** 24.1
  - **Implementation notes:** Chrome, Firefox, Safari latest two; keyboard nav; focus indicators; no color-only; ≤3Hz flash; below-minimum viewport
  - **Completion criteria:** Game playable in all browsers; accessibility met
  - **Manual testing required:** Yes

- [ ] 24.4 ⚠️ HUMAN APPROVAL REQUIRED: Tag public release
  - **Objective:** Tagged release after all verification.
  - **Files:** None (git tag)
  - **Requirements:** REQ-DEL-001
  - **Depends on:** 24.1, 24.2, 24.3
  - **Implementation notes:** Verify CI green; Pages live; create tag `v1.0.0`; GitHub release
  - **Completion criteria:** Public release complete
  - **⚠️ Do not tag without explicit human approval**

---

## Traceability Matrix — Task to Requirements

| Requirement Group | Covered by Tasks |
|---|---|
| REQ-LOAD | 6.2 |
| REQ-MENU | 6.3, 14.1 |
| REQ-MOVE | 5.1, 7.1, 14.2 |
| REQ-SHOOT | 8.1 |
| REQ-CORE | 7.3, 11.2 |
| REQ-PDEATH | 7.2, 11.2, 3.2, 3.3 |
| REQ-ENEMY | 9.1, 10.1 |
| REQ-WAVE | 10.1, 10.2 |
| REQ-COL | 11.1, 11.2 |
| REQ-SCORE | 12.1 |
| REQ-POWERUP | 13.1 |
| REQ-HSCORE | 4.1, 6.5, 12.1 |
| REQ-PAUSE | 3.1, 3.3, 14.1, 18.1 |
| REQ-GAMEOVER | 6.5, 3.3 |
| REQ-RESTART | 3.3, 12.1, 13.1 |
| REQ-AUDIO | 15.1, 15.2 |
| REQ-A11Y | 14.1, 14.2, 24.3 |
| REQ-PERF | 2.4, 8.1, 9.1, 10.2, 16.2 |
| REQ-QUAL | 1.2–1.10, 6.6, 17.1, 18.1 |
| REQ-SEC | 1.8, 6.6, 19.1–19.3, 20.1, 21.1, 24.2 |
| REQ-CICD | 20.1, 21.1 |
| REQ-DEL | 1.9, 21.1, 22.1, 22.2, 23.1, 24.4 |
