# Chrono Defender v0.2.0

Audio, visual polish, and game feel improvements.

## Play Now

https://robinsonalexanderquiroz-droid.github.io/chrono-defender/

## New Features

### Audio System

- Procedural audio synthesized at runtime via the Web Audio API
- Background music: title theme, gameplay theme, boss theme, victory fanfare, game over theme
- 15+ sound effects: laser, explosions, impacts, pickups, UI cues
- Separate music and SFX volume channels
- Mute toggle (M key) with on-screen indicator
- Graceful degradation when audio is unavailable

### Visual Polish

- Enhanced explosions with flash ring and varied particle sizes
- Player thruster particles during movement
- Player damage flash (red tint feedback)
- Camera shake on player damage and boss attacks

### Game Feel

- Pause/resume and quit audio cues
- Mute indicator visible in HUD
- Smoother gameplay feedback loop

## Accessibility

- Mute shortcut (M) accessible at all times
- High-contrast HUD text
- No reliance on color alone for game state
- Reduced flashing (explosions under 3 Hz threshold)
- All critical information available visually even when muted

## Performance

- Maximum 12 simultaneous audio nodes to prevent clipping
- Particle cleanup via tween onComplete callbacks
- No memory leaks from orphaned audio nodes

## Testing

- E2E tests for pause, resume, quit, mute functionality
- All Playwright tests passing

## Known Issues

- Procedural graphics (no sprite artwork)
- Single level with one boss encounter
- Difficulty balancing needs tuning
- MISSILE and BEAM upgrades share effects with THRUST and SPLIT
