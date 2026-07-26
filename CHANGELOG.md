# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-26

### Added

- Initial playable prototype
- Horizontal scrolling shooter gameplay
- Upgrade Rail system with six slots (Thrust, Missile, Split, Beam, Echo, Shield)
- Echo Drone autonomous support orb
- Boss battle against the Epoch Warden with vulnerable temporal core
- Parallax multi-layer starfield background
- Three enemy types: Scouts, Heavy Drones, Epoch Warden
- Player invulnerability and respawn on damage
- Chrono Shard collectibles for upgrade progression
- Shield power-up with pulsing energy visual
- Explosion particle effects
- Title screen with controls display
- Victory and defeat end screens with final score
- GitHub Pages deployment workflow
- CI quality gate workflow

### Technical

- Phaser 3.90 game framework
- TypeScript 5.9 with strict mode
- Vite 6.4 build tooling
- ESLint 10 with flat config
- Prettier 3.9 formatting
- Vitest 4.1 unit testing
- Playwright 1.61 E2E testing
- GitHub Actions CI/CD pipelines
- Automated screenshot capture scripts

### Known Issues

- Placeholder procedural graphics (no sprite artwork yet)
- Single level with one boss encounter
- No audio or sound effects
- Difficulty balancing needs tuning
- MISSILE and BEAM upgrades map to existing effects (not unique)
- Large single JS bundle (Phaser not code-split)
