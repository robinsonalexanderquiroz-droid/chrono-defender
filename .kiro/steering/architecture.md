---
inclusion: always
---

# Chrono Defender – Architecture

## Project Structure

```
chrono-defender/
├── .github/
│   └── workflows/          # CI and deployment workflow files
├── .kiro/
│   └── steering/           # Kiro steering documents
├── docs/
│   └── presentation-script.md
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/             # Audio files loaded by Vite; no binary art assets in MVP
│   ├── config/             # Game balance constants and scaling formulas (see below)
│   ├── entities/           # Game object classes: Player, Enemy, Projectile, Core, PowerUp
│   ├── scenes/             # Phaser Scene subclasses, one file per scene (see below)
│   ├── systems/            # Pure-ish logic: WaveManager, ScoreManager, AudioManager
│   ├── ui/                 # HUD components, overlays, menus (Phaser GameObjects, no DOM)
│   ├── utils/              # Pure helper functions with no Phaser or game-state dependencies
│   └── main.ts             # Entry point: constructs and starts Phaser.Game
├── tests/
│   ├── unit/               # Vitest: pure logic (utils, systems, config math)
│   └── e2e/                # Playwright: browser smoke tests
├── index.html              # Vite entry HTML
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── .nvmrc
└── package.json
```

## Scene List

| Scene key | Responsibility |
|---|---|
| `Boot` | Set render scale, load minimal assets needed before Preload |
| `Preload` | Load all game assets; show loading progress bar |
| `MainMenu` | Title screen; start game, view controls |
| `Game` | Primary gameplay loop |
| `GameOver` | Display score, highest wave, restart option |

- Each scene lives in its own file under `src/scenes/`.
- Scenes communicate via Phaser's event emitter or by passing data through `scene.start()` / `scene.launch()`; they must not import each other directly.

## Config Module (`src/config/`)

- All tunable numbers (speeds, health values, damage, fire rate, wave scaling formulas, intermission duration, active-enemy cap, power-up duration, score values) must be defined here.
- Each constant must have an inline comment explaining its unit and effect.
- Scaling formulas are pure functions of wave number; they must be independently unit-testable.
- No magic numbers may appear in entity, system, scene, or UI code.

## Entity Layer (`src/entities/`)

- Each entity class encapsulates game-state (position, health, velocity) and delegates all visual output to a view method or companion view class.
- Entity classes must not directly call `scene.add.graphics()` or equivalent; they must use the view-layer contract defined in `visual-style.md`.
- Entity classes are plain TypeScript classes; they receive a Phaser scene reference only where strictly necessary for physics or group membership.

## Systems Layer (`src/systems/`)

- Systems own cross-entity logic (wave orchestration, scoring, audio triggering).
- Systems must be instantiable without a running Phaser scene where possible, to allow Vitest unit testing.
- `WaveManager` owns the enemy-spawn schedule, active-enemy count, wave-complete detection, and intermission timer.
- `ScoreManager` owns score accumulation and session-high-score tracking.
- `AudioManager` wraps Phaser's Sound Manager; all audio calls go through it so graceful degradation is centralised.

## Utils Layer (`src/utils/`)

- Pure functions only: no Phaser imports, no game-state imports.
- Examples: math helpers, angle calculations, seedable PRNG wrapper, vector utilities.
- Every util function must have corresponding Vitest unit tests.

## Input Abstraction

- A single `InputManager` class in `src/systems/` (or `src/input/`) consumes raw Phaser input events and exposes a frame-state interface.
- Game logic reads input state from `InputManager`; it must not register its own Phaser key or pointer listeners.

## Module Boundary Rules

- `scenes/` may import from `entities/`, `systems/`, `ui/`, `config/`, `utils/`.
- `entities/` may import from `config/` and `utils/`.
- `systems/` may import from `config/` and `utils/`.
- `ui/` may import from `config/` and `utils/`.
- `utils/` must not import from any other src layer.
- Circular imports are forbidden; ESLint `import-x/no-cycle` rule enforces this.

## TypeScript Rules

- `strict: true` must be enabled in `tsconfig.json`.
- No use of `any` except in clearly justified, commented escape hatches.
- All public class members and function parameters must be explicitly typed.
- Prefer `interface` for data shapes, `type` for unions and mapped types.

## Vite Base Path

- The Vite `base` config option is set to `"/chrono-defender/"` for production builds.
- This value is derived from the confirmed GitHub repository name.
- Local development (`npm run dev`) should use `"/"` or the default; the base path applies to production builds only.
