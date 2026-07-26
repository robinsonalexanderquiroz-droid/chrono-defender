---
inclusion: always
---

# Chrono Defender – Controls

## Movement

- **WASD** and **Arrow Keys** both control player movement.
- Both key sets must work simultaneously (diagonal movement is allowed).
- Movement speed is defined in the game config; it must not be hard-coded in input handlers.

## Aiming

- The player ship always aims toward the current mouse cursor position in world-space.
- Aiming is continuous — the ship rotates every frame to track the cursor.
- Aiming must account for camera offset if the camera ever moves.

## Firing

- **Left mouse button** fires the player's weapon.
- Holding the button fires repeatedly, subject to the configured fire-rate cooldown.
- The cooldown duration is defined in the game config; it must not be hard-coded in the input handler.
- Each press that passes the cooldown check spawns exactly one projectile; no burst is emitted per event.

## Pause / Resume

- **Escape** and **P** both toggle pause and resume.
- Either key must work regardless of which was used to enter the paused state.
- Pause state is binary (paused / unpaused); nested pausing is not required.
- When paused, all game-world updates must halt (physics, timers, enemy movement, projectiles).
- Audio behavior during pause is defined in `audio.md`.

## Menu Navigation

- Menu screens (main menu, game-over screen, pause overlay) must be navigable by keyboard where practical.
- Tab / Shift-Tab cycles through interactive elements; Enter or Space activates the focused element.
- Mouse clicks on menu elements must also work.
- The initially focused element on each screen must be set explicitly (do not rely on browser default focus order).

## Scroll Prevention

- Arrow keys, Space, and any other keys that cause browser page scrolling must have their default browser behavior prevented during active gameplay.
- Prevention must be scoped to gameplay; it must not suppress browser shortcuts (e.g. F5, Ctrl+R) or assistive-technology key bindings outside of the game canvas.
- The canvas element must capture pointer events so mouse actions inside it do not bubble to the page.

## Gamepad

- Gamepad support is outside the MVP scope and must not be implemented or scaffolded.

## Input Abstraction

- Raw Phaser input events must be consumed by a dedicated input-manager module rather than scattered across scene or entity files.
- The input manager exposes a simple state interface (e.g. `isMovingLeft()`, `isFiring()`, `isPausePressed()`) that game logic reads each frame.
- This abstraction makes future remapping or gamepad support additive rather than requiring rewrites.
