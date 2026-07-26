---
inclusion: always
---

# Chrono Defender – Project Overview

## Identity

**Chrono Defender** is a single-player 2D browser game in which the player protects a stationary energy core from increasingly difficult, endless waves of enemies. The run ends when the core is destroyed.

## Goals

- Ship a fully playable MVP that runs entirely in the browser with no backend.
- Produce a public GitHub repository, a professional README, a publicly accessible online demo, and a presentation video under five minutes.
- Keep the codebase clean, well-tested, and reproducibly buildable from a fresh clone.

## Non-Goals (MVP)

The following are explicitly out of scope for the initial release:

- AWS or any cloud backend
- Authentication, user accounts, or payments
- Multiplayer of any kind
- A database or persistent server state
- Private API keys or runtime secrets
- A finite campaign or final victory condition
- Gamepad support
- Multiple tower types, weapon inventories, or weapon selection
- External art packs (art is replaceable later)

## Technology Stack

| Concern | Tool |
|---|---|
| Language | TypeScript |
| Game framework | Phaser 3 |
| Build tool | Vite |
| Unit / integration tests | Vitest |
| End-to-end tests | Playwright |
| Linter | ESLint |
| Formatter | Prettier |
| CI / CD | GitHub Actions |
| Hosting | GitHub Pages |

## Key Constraints

- The game must run as a fully static site with zero server-side code.
- No runtime secrets, private URLs, credentials, or personal information may appear in the repository or build output.
- All dependency versions must be pinned (exact or tilde range) and committed via `package-lock.json`.
- The Vite `base` path must remain configurable until the GitHub repository name is confirmed; do not hard-code it prematurely.
- Do not create a GitHub remote, run `git remote add`, push, or publish without explicit user approval.
