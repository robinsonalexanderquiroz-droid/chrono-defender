---
inclusion: always
---

# Chrono Defender – Gameplay Rules

## Energy Core

- The energy core is stationary and positioned at the center of the playable area.
- The core has its own health pool, tracked independently from player health.
- Enemies primarily navigate toward and attack the core.
- The player intercepts and destroys enemies before they reach it.
- The core must be visually distinct from all other entities at all times (see `visual-style.md`).

## Player Health, Death, Respawn, and Invulnerability

- The player has an independent health pool separate from the core.
- The game does not end when player health reaches zero.
- When player health reaches zero, the player enters an **inactive** state for exactly three seconds of game time.
- During the inactive period, the player cannot move, aim, shoot, collect power-ups, receive additional damage, or collide with enemies.
- After three seconds, the player respawns at the defined safe position near the energy core.
- The player respawns with maximum configured health.
- After respawning, the player receives exactly two seconds of **invulnerability**.
- During invulnerability, all incoming damage is ignored.
- Invulnerability must have a visible indicator that does not rely only on color.
- Player death does not restore energy-core health.
- Player death does not reset the current wave.
- Player death does not remove active enemies.
- Player death does not reset the score.
- Player death does not reset the power-up defeat counter.
- All durations (inactive period, invulnerability period) use the game clock so pause behavior remains deterministic.
- The inactive duration, respawn position, maximum health, and invulnerability duration must be defined in the game config; they must not appear as unexplained inline numbers.

## Win and Loss Conditions

- The game is endless survival; there is no final victory condition in the MVP.
- A finite campaign mode is explicitly out of scope for the MVP.
- The run ends when the energy core health reaches zero.
- On game over, the following are displayed: final score and highest completed wave number.
- A game-over screen must provide an option to restart from wave 1.

## Scoring

- The player earns points for destroying enemies.
- Point values per enemy type are defined in the game config.
- The current score is always visible in the HUD during gameplay.
- High score for the current session may be tracked in memory; persistent high score is stored in localStorage (see `high-score` requirements).

## Wave System

- Waves are **clear-triggered**: a wave is considered complete only when every enemy assigned to that wave has been both spawned and removed (destroyed or otherwise exited the field).
- After a wave completes, a configurable intermission period begins before the next wave spawns.
- The intermission duration is defined in the game config.
- Wave composition and difficulty scaling must be derived from **deterministic, documented formulas or configuration tables** — no magic numbers inline in spawning code.
- A maximum active-enemy cap is enforced at all times; new spawns are delayed (not skipped) when the cap is reached.
- The active-enemy cap value is defined in the game config.
- Wave number, intermission countdown, and "Wave N incoming!" notifications must be shown in the HUD.

## Difficulty Scaling

- Difficulty increases with wave number in a documented, reproducible way.
- Parameters that may scale include: enemy count per wave, enemy move speed, enemy health, spawn rate, and enemy type distribution.
- All scaling formulas must be defined in `src/config/` with inline comments explaining each parameter.
- Randomness in wave generation must use a seedable PRNG so waves can be reproduced for testing.

## Weapons

- The player has exactly one ranged weapon in the MVP.
- Fire rate can be temporarily increased by collecting a power-up.
- Power-up duration and the boosted fire-rate multiplier are defined in the game config.
- Multiple weapons, towers, weapon selection, and weapon inventories are out of MVP scope.

## Power-Ups

### Drop Mechanic

- One power-up is generated after every ten valid enemy defeats within the current run.
- Only defeats credited through the approved enemy-defeat system count toward the ten-defeat interval.
- Removing an enemy for cleanup, reset, scene shutdown, or invalid state must not count as a defeat.
- Defeat progress carries across waves within the same run.
- Defeat progress resets when a new run starts.
- A player death does not reset the defeat progress counter.

### Type Sequence

Power-ups cycle in the following fixed order, repeating indefinitely:

1. Fire-rate increase
2. Movement-speed increase
3. Health restoration

After health restoration, the cycle returns to fire-rate increase.

No random selection is used for power-up type selection in the MVP.

### Spawn Position

- The power-up appears at the world position of the enemy that completed the ten-defeat interval.
- If that position is outside the valid playable area, it is clamped to the nearest valid position within the playable area.

### Active Power-Up Display

- A visible indicator must show the active power-up type and its remaining duration.
- The indicator must not rely only on color to identify the power-up type.

### Future Enhancements (out of MVP scope)

- Additional power-up types (shield, damage boost) are deferred to post-MVP.

## Entity Removal

An entity is considered "removed" from the wave when any of the following occur:

- It is destroyed by the player (counts as a defeat; awards points).
- It reaches the core and deals its damage (and is then destroyed; does not count as a defeat; does not award points).
- It exits the playable boundary (counts as removed; does not count as a defeat; does not award points).
