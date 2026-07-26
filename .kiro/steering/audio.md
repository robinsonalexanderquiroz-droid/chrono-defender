---
inclusion: always
---

# Chrono Defender – Audio

## Required Sound Effects

The following discrete sound events must each have a unique audio cue:

| Event | Trigger |
|---|---|
| Player shoots | Each projectile fired by the player |
| Hit / damage | Any entity (player or core) receiving damage |
| Power-up collected | Player picks up a power-up item |
| Wave complete | All enemies in the current wave are cleared |
| Game over | The energy core reaches zero health |

## Background Music

- Background music is **outside the MVP scope**.
- Do not implement, load, or scaffold background music in the MVP.
- Background music may be listed as a future enhancement in the README.

## Graceful Degradation

- The game must be fully playable when audio is unavailable (browser autoplay policy blocked, Web Audio API unsupported, or user-muted).
- Audio failures must be caught silently; they must never throw uncaught errors or block gameplay.
- All critical game-state information communicated by audio must also be communicated visually (see `visual-style.md`).

## Mute and Volume Controls

- A mute toggle must be accessible from the HUD during active gameplay without pausing.
- A master volume control must be provided (slider or stepped control).
- The mute state and volume level must persist for the session (e.g. via a module-level singleton); persistence across sessions (localStorage) may be added later.
- Mute / volume state must apply immediately to all active audio including sound effects.

## Implementation Constraints

- Use Phaser's built-in Sound Manager; do not introduce a separate audio library in the MVP.
- All audio assets must be loaded during the Preload scene; no runtime fetches mid-gameplay.
- Sound effect files must be generated programmatically (e.g. via a script using the Web Audio API offline context) or sourced from a verified license-free library.
- Audio file format must include a fallback: provide both `.ogg` (preferred) and `.mp3` (Safari fallback) where browser support requires it.
- Audio asset filenames and paths must not contain credentials, personal information, or external hostnames.
- No copyrighted or unlicensed audio may enter the repository or build output.
