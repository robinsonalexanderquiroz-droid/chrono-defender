# Chrono Defender v0.4.0

Persistence, achievements, settings, mobile touch, and gamepad support.

## Play Now

https://robinsonalexanderquiroz-droid.github.io/chrono-defender/

## Highlights

- Full menu system with navigable submenus
- 20 unlockable achievements with progress tracking
- Persistent top-10 leaderboard
- Gamepad support (Xbox, PlayStation, generic controllers)
- Mobile touch controls (virtual joystick + fire button)
- Extended settings with 16+ configurable options
- 35 unit tests + E2E coverage
- Save data migration from older versions

## High Scores

- Top 10 scores persisted in localStorage
- Each entry stores: score, wave, combo, weapon, date, result (victory/gameover)
- Accessible from the title menu
- Clear scores with in-game confirmation dialog

## Achievements

20 achievements across 5 categories:

- **Combat:** First Blood, Mini-Boss Hunter/Slayer, Boss Breaker
- **Survival:** Survivor (wave 5/10/20), Untouchable, Perfect Run, Pacifist Moment
- **Collection:** Weapon Collector, Power Surge, Drone Commander
- **Mastery:** Combo Starter/Master/Legend, High Roller, Millionaire
- **Dedication:** First Launch, Dedicated Defender

Hidden achievements conceal their description until unlocked.

## Settings and Options

Configurable settings persisted across sessions:

- **Audio:** Master/Music/SFX volume, mute
- **Display:** Fullscreen, screen shake intensity, particle effects level, HUD scale, high contrast
- **Gameplay:** Difficulty preset, auto-fire, pause on focus loss
- **Accessibility:** Reduced flashing, reduced motion, vibration, aim assist

## Mobile Support

- Virtual joystick (left side) for movement
- Fire button (right side)
- Pause/mute buttons (top corners)
- Multi-touch support
- Configurable touch area positions
- Touch detected automatically on capable devices

## Gamepad Support

- Standard mapping: left stick/D-pad = move, A = fire/confirm, B = back, Start = pause
- Bumpers for weapon switching, Y for mute
- Configurable dead zone (default 0.2)
- Analog movement support
- Connect/disconnect notifications
- Works simultaneously with keyboard

## Save Migration

- Schema version 4 with structured migration
- Preserves all existing stats from v0.3.x
- Graceful recovery from corrupted data
- Debounced writes (max once per 500ms)

## Testing

- 35 unit tests: SaveManager (9), AchievementManager (8), GamepadManager (5), DifficultyManager (5), ScoreManager (8)
- E2E tests for pause, quit, mute, and gameplay
- Tests cover: persistence, migration, achievement logic, dead zones, scoring

## Known Issues

- Procedural graphics only (no sprite artwork)
- Options screen shows placeholder (full UI planned)
- Touch controls are state-only (visual overlay requires scene integration)
- Weapon switching not yet bound to gameplay input
- Achievement notifications not yet rendered in-game
