---
inclusion: always
---

# Chrono Defender – Visual Style

## Theme

- Neon sci-fi aesthetic on a dark background.
- High-contrast UI elements against the dark field.
- All visuals are created programmatically with Phaser Graphics for the MVP.
- No external art packs may be introduced in the MVP.
- The rendering layer must be designed so original or licensed sprite artwork can replace geometric shapes in a future release without restructuring game logic.

## Geometry and Color

- The player ship, enemies, projectiles, and core are rendered as distinct geometric shapes (e.g. triangle for player, different polygon families for each enemy class).
- Shape geometry is the primary differentiator between entity types; color reinforces but never solely encodes meaning.
- Use a consistent neon palette: bright saturated accent colors (cyan, magenta, amber, green) against a near-black background (#0a0a0f or similar).
- Particle effects and glow/bloom filters may be used sparingly to reinforce hits, explosions, and power-up pickups.

## Accessibility Rules

- **Never rely on color alone** to communicate health level, damage taken, enemy type, power-up type, or any other critical game state.
- Every piece of critical information must have a secondary non-color indicator: shape, icon, label, numeric value, animation, or pattern.
- Health bars must show a numeric value or segmented blocks in addition to color fill.
- Enemy types must differ in shape or size, not only in color.
- UI text must meet WCAG AA contrast ratio (4.5 : 1) against its background.
- Flashing or strobing effects must not exceed 3 Hz to avoid photosensitivity risk.

## HUD Layout

- HUD elements live in screen-space (fixed camera), not world-space.
- Player health, core health, current wave number, and score are always visible during gameplay.
- Mute / volume control is accessible from the HUD without pausing.
- Pause state must be visually unambiguous (overlay or darkened viewport with clear "PAUSED" label).

## Replaceable Asset Contract

- All entity visuals must be isolated in dedicated rendering methods or classes (e.g. `PlayerView`, `EnemyView`) that receive game-state data and produce Phaser display objects.
- Gameplay logic must not directly construct Phaser Graphics objects; it must call the view layer.
- This separation is enforced so swapping to sprites requires only view-layer changes.
