---
spec: core-game
version: 1.0.0
status: draft
---

# Chrono Defender – Core Game Requirements

## Notation and Conventions

- Requirements use **EARS** (Easy Approach to Requirements Syntax) notation.
- Every acceptance criterion carries a stable identifier of the form `REQ-<GROUP>-<NNN>`.
- "Game clock" means the Phaser scene time that pauses when the game is paused.
- "Run" means one continuous play session from wave 1 until the energy core is destroyed.
- "Defeat" means an enemy destroyed through the approved defeat system (projectile hit reducing health to zero); cleanup removals do not qualify.
- "Valid playable area" means the rectangular region of the game world within which entities may exist and interact.
- "Configured value" means a constant defined in `src/config/`; inline magic numbers are prohibited.
- All durations are measured in game-clock milliseconds unless stated otherwise.

---

## US-01 Initial Loading

**As a player, I want the game to load all assets before gameplay begins so that no resources are missing during a run.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-LOAD-001 | While the game is loading, the system shall display a loading screen with a visible progress indicator. |
| REQ-LOAD-002 | The loading screen shall display numeric or proportional progress (e.g. "assets loaded / total assets") so progress is not communicated by animation alone. |
| REQ-LOAD-003 | When all assets have finished loading, the system shall automatically transition to the Start Menu scene. |
| REQ-LOAD-004 | When an asset fails to load, the system shall catch the error silently, log a non-sensitive diagnostic message to the console, and continue loading remaining assets. |
| REQ-LOAD-005 | When all critical assets have loaded (or failed), the system shall always reach the Start Menu; the loading screen must never block indefinitely. |
| REQ-LOAD-006 | The loading scene shall load all audio assets; no audio asset may be fetched after the loading scene completes. |
| REQ-LOAD-007 | The loading scene shall not display, request, or reference any credential, private URL, or personal information. |

**Dependencies:** None.

---

## US-02 Start Menu

**As a player, I want a start menu so that I can begin a run, review controls, adjust audio, and see my high score.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-MENU-001 | When the Start Menu scene is active, the system shall display the game title, a "Start" action, a "Controls" action, and audio controls. |
| REQ-MENU-002 | When the player activates "Start", the system shall transition to the Game scene and begin wave 1 with all counters reset. |
| REQ-MENU-003 | When the player activates "Controls", the system shall display the full control scheme (movement keys, aim, fire, pause) and the game objective within the menu without leaving the scene. |
| REQ-MENU-004 | When the Start Menu loads and a valid high score exists in localStorage, the system shall display that score. |
| REQ-MENU-005 | When the Start Menu loads and no high score entry exists in localStorage, the system shall display a neutral placeholder (e.g. "---") and shall not throw an error. |
| REQ-MENU-006 | When the Start Menu loads and the stored high score value is malformed, negative, non-integer, non-finite, or exceeds the configured maximum score boundary, the system shall discard the stored value, display the neutral placeholder, and shall not throw an error. |
| REQ-MENU-007 | When localStorage is unavailable or throws on read, the system shall catch the error silently, display the neutral placeholder, and not interrupt menu rendering. |
| REQ-MENU-008 | The system shall assign explicit initial keyboard focus to the "Start" element when the Start Menu scene becomes active. |
| REQ-MENU-009 | While the Start Menu is active, the Tab key shall cycle forward through interactive elements and Shift+Tab shall cycle backward. |
| REQ-MENU-010 | While the Start Menu is active, pressing Enter or Space on a focused interactive element shall activate it. |
| REQ-MENU-011 | While the Start Menu is active, clicking a menu element with the left mouse button shall activate it. |
| REQ-MENU-012 | All interactive menu elements shall have a visible focus indicator that does not rely on color alone. |
| REQ-MENU-013 | Audio controls (mute toggle and volume control) shall be present and functional on the Start Menu. |
| REQ-MENU-014 | The Start Menu shall not display credentials, private URLs, absolute file paths, personal information, or environment variable values. |

**Dependencies:** REQ-LOAD-003, REQ-AUDIO-001–REQ-AUDIO-010, REQ-HSCORE-001–REQ-HSCORE-008.

---

## US-03 Player Movement

**As a player, I want to move my ship with WASD and arrow keys so that I can reposition to intercept enemies.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-MOVE-001 | While the game is active and unpaused, when the player holds W or ArrowUp, the system shall move the player ship upward at the configured movement speed. |
| REQ-MOVE-002 | While the game is active and unpaused, when the player holds S or ArrowDown, the system shall move the player ship downward at the configured movement speed. |
| REQ-MOVE-003 | While the game is active and unpaused, when the player holds A or ArrowLeft, the system shall move the player ship leftward at the configured movement speed. |
| REQ-MOVE-004 | While the game is active and unpaused, when the player holds D or ArrowRight, the system shall move the player ship rightward at the configured movement speed. |
| REQ-MOVE-005 | When the player holds two non-opposing movement keys simultaneously (diagonal), the system shall normalize the resulting velocity vector so that diagonal speed equals the configured movement speed, not its scalar sum. |
| REQ-MOVE-006 | When the player holds two opposing movement keys simultaneously (e.g. W and S), the system shall treat net movement on that axis as zero. |
| REQ-MOVE-007 | The movement speed value shall be read from config; it must not appear as a literal number in the movement handler. |
| REQ-MOVE-008 | When the player ship would move beyond the valid playable area boundary, the system shall clamp the ship's position to the boundary; the ship must not exit the playable area. |
| REQ-MOVE-009 | While the game is paused, the system shall not update the player's position regardless of held keys. |
| REQ-MOVE-010 | While the player is inactive (post-death), the system shall not update the player's position regardless of held keys. |
| REQ-MOVE-011 | During the player's invulnerability period, movement shall behave identically to normal active movement. |
| REQ-MOVE-012 | When the browser window loses focus during gameplay, the system shall treat all held movement keys as released and stop player movement. |
| REQ-MOVE-013 | Key-repeat events generated by the OS for held keys shall not cause additional velocity beyond the single key-held state. |
| REQ-MOVE-014 | Pressing keys not in the movement or action key set shall have no effect on player movement. |
| REQ-MOVE-015 | While the Game scene is active, the default browser scroll behavior for ArrowUp, ArrowDown, ArrowLeft, ArrowRight, and Space shall be suppressed; the page must not scroll. |
| REQ-MOVE-016 | Scroll suppression shall apply only while the Game scene canvas has focus; it must not suppress browser-level shortcuts (e.g. F5, Ctrl+R). |

**Dependencies:** REQ-PAUSE-001–REQ-PAUSE-004, REQ-PDEATH-004–REQ-PDEATH-006.

---

## US-04 Aiming and Shooting

**As a player, I want to aim with the mouse and shoot with the left button so that I can destroy incoming enemies.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-SHOOT-001 | While the game is active and unpaused, the system shall rotate the player ship every frame to face the current mouse cursor position in world-space. |
| REQ-SHOOT-002 | Aiming shall account for any camera offset so that the ship faces the correct world position even if the camera has moved. |
| REQ-SHOOT-003 | While the game is active, unpaused, and not in the inactive state, when the player presses or holds the left mouse button and the fire cooldown has elapsed, the system shall spawn exactly one projectile per cooldown interval. |
| REQ-SHOOT-004 | When the player holds the left mouse button, the system shall continue spawning projectiles at each cooldown interval for as long as the button remains held and the game is active and unpaused. |
| REQ-SHOOT-005 | When the player attempts to fire before the cooldown has elapsed, the system shall not spawn a projectile. |
| REQ-SHOOT-006 | The fire cooldown duration shall be read from config; it must not appear as a literal number in the input or shooting handler. |
| REQ-SHOOT-007 | Each projectile shall spawn at the configured offset from the player ship's current position in the direction the ship is currently facing. |
| REQ-SHOOT-008 | Each projectile shall travel in a straight line in the direction the ship was facing at the moment of spawn; subsequent ship rotation shall not alter the projectile's direction. |
| REQ-SHOOT-009 | When a projectile travels beyond the valid playable area boundary, the system shall remove it from the scene immediately. |
| REQ-SHOOT-010 | Each projectile shall have a configured maximum lifetime; when that lifetime elapses without a collision, the system shall remove the projectile. |
| REQ-SHOOT-011 | When the active projectile count reaches the configured maximum, the system shall not spawn additional projectiles until at least one existing projectile is removed. |
| REQ-SHOOT-012 | When the mouse pointer leaves the canvas during gameplay, the system shall retain the last known cursor position for aiming until the pointer re-enters or the game state changes. |
| REQ-SHOOT-013 | While the game is paused, the system shall not spawn projectiles regardless of mouse button state. |
| REQ-SHOOT-014 | While the player is inactive (post-death), the system shall not spawn projectiles regardless of mouse button state. |
| REQ-SHOOT-015 | On the game-over screen, mouse clicks shall not spawn projectiles. |

**Dependencies:** REQ-MOVE-009, REQ-PDEATH-004, REQ-PAUSE-001.

---

## US-05 Energy Core

**As a player, I want the energy core to have visible health so that I know how close it is to being destroyed.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-CORE-001 | The energy core shall be rendered at the exact center of the valid playable area and shall not move during a run. |
| REQ-CORE-002 | The energy core shall have a maximum health value defined in config. |
| REQ-CORE-003 | The core's current health shall be initialized to its maximum health value at the start of every run. |
| REQ-CORE-004 | When an enemy contacts the core, the system shall reduce core health by the enemy's configured contact-damage value. |
| REQ-CORE-005 | When multiple enemies contact the core in the same frame, the system shall apply each damage value independently; damage is not capped per frame. |
| REQ-CORE-006 | Core health shall never be set below zero; after applying damage, the system shall clamp core health to zero. |
| REQ-CORE-007 | Core health shall never exceed its maximum configured value through any code path. |
| REQ-CORE-008 | When core health reaches zero, the system shall immediately transition to the Game Over state. |
| REQ-CORE-009 | The HUD shall display core current health as both a proportional bar and a numeric value at all times during gameplay. |
| REQ-CORE-010 | The core health display shall not rely on color alone; it shall include a numeric value or labeled segments. |
| REQ-CORE-011 | An enemy that has already been removed from the scene (defeated or cleaned up) shall not deal contact damage to the core. |
| REQ-CORE-012 | Player death shall not alter core health. |

**Dependencies:** REQ-ENEMY-001–REQ-ENEMY-018, REQ-GAMEOVER-001.

---

## US-06 Player Health, Death, Respawn, and Invulnerability

**As a player, I want to respawn after dying so that a single mistake does not end my run.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-PDEATH-001 | The player shall have a maximum health value defined in config. |
| REQ-PDEATH-002 | Player current health shall be initialized to its maximum configured value at the start of every run. |
| REQ-PDEATH-003 | When the player receives damage and current health would fall below zero, the system shall clamp it to zero before evaluating the death transition. |
| REQ-PDEATH-004 | When player current health reaches zero, the system shall transition the player to the **inactive** state; the run shall not end. |
| REQ-PDEATH-005 | While the player is inactive, the system shall disable: movement, aiming updates, shooting, power-up collection, incoming damage, and collision with enemies. |
| REQ-PDEATH-006 | The inactive state shall last exactly the configured inactive duration (default: 3 000 ms game clock) before the respawn transition begins. |
| REQ-PDEATH-007 | The inactive duration shall be read from config; it must not appear as a literal number in the state handler. |
| REQ-PDEATH-008 | When the inactive duration elapses, the system shall move the player to the configured safe respawn position near the energy core. |
| REQ-PDEATH-009 | The respawn position shall be defined in config; it must not be hard-coded in the respawn handler. |
| REQ-PDEATH-010 | Upon respawn, the system shall restore the player's health to its maximum configured value. |
| REQ-PDEATH-011 | Immediately upon respawn, the system shall apply the **invulnerability** state to the player for the configured invulnerability duration (default: 2 000 ms game clock). |
| REQ-PDEATH-012 | The invulnerability duration shall be read from config; it must not appear as a literal number in the state handler. |
| REQ-PDEATH-013 | While the player is invulnerable, the system shall ignore all incoming damage to the player. |
| REQ-PDEATH-014 | The invulnerability state shall have a visible indicator that does not rely on color alone (e.g. a flashing outline, a label, or a distinct shape change). |
| REQ-PDEATH-015 | When the invulnerability duration elapses, the system shall return the player to the normal active state. |
| REQ-PDEATH-016 | Player death shall not modify: core health, current wave number, wave enemy state, active enemy list, current score, or defeat progress counter. |
| REQ-PDEATH-017 | When the game is paused while the player is inactive, the inactive duration timer shall be suspended and resume when the game unpauses. |
| REQ-PDEATH-018 | When the game is paused while the player is invulnerable, the invulnerability duration timer shall be suspended and resume when the game unpauses. |
| REQ-PDEATH-019 | If an enemy collision occurs at the exact frame the invulnerability state ends, the system shall treat the player as invulnerable for that frame. |
| REQ-PDEATH-020 | If the player receives a second damage event before the first death transition completes (e.g. during the same frame), the system shall apply only one inactive-state transition; it must not stack inactive states. |

**Dependencies:** REQ-PAUSE-001–REQ-PAUSE-004, REQ-SCORE-007, REQ-WAVE-009, REQ-POWERUP-010.

---

## US-07 Enemies

**As a player, I want to face distinct enemy types so that I can use different strategies against them.**

### Enemy Types

Three enemy types are defined for the MVP:

| Type | Key Characteristics |
|---|---|
| Basic | Standard health, standard speed |
| Fast | Lower health, higher speed |
| Durable | Higher health, lower speed |

All numeric values (health, speed, damage, score) are defined in config.

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-ENEMY-001 | Each enemy type shall have a maximum health value defined in config. |
| REQ-ENEMY-002 | Each enemy type shall have a movement speed defined in config. |
| REQ-ENEMY-003 | Each enemy shall move directly toward the energy core's fixed world position every frame. |
| REQ-ENEMY-004 | When an enemy's path to the core is unobstructed, the system shall recalculate the direction vector each frame. |
| REQ-ENEMY-005 | When an enemy contacts the energy core, the system shall apply the enemy's configured contact-damage value to the core, then remove the enemy from the scene. |
| REQ-ENEMY-006 | An enemy removed by core contact shall not be counted as a defeat and shall not award points. |
| REQ-ENEMY-007 | When a projectile reduces an enemy's health to zero, the system shall count it as a defeat, award the configured point value, and remove the enemy from the scene. |
| REQ-ENEMY-008 | When an enemy exits the valid playable area boundary without contacting the core or a projectile, the system shall remove it from the scene without counting it as a defeat or awarding points. |
| REQ-ENEMY-009 | Each enemy type's contact-damage value shall be defined in config. |
| REQ-ENEMY-010 | Each enemy type's score value shall be defined in config. |
| REQ-ENEMY-011 | Each enemy type shall be visually distinguishable from every other type and from the player and core using shape or size, not color alone. |
| REQ-ENEMY-012 | When an enemy is removed for cleanup (scene shutdown, wave reset, or invalid state), it shall not be counted as a defeat, shall not award points, and shall not trigger power-up drop logic. |
| REQ-ENEMY-013 | An enemy that has already been removed shall not deal damage, be counted as a defeat, or trigger any further game-state change. |
| REQ-ENEMY-014 | The Basic enemy shall have the intermediate health value between Fast and Durable types as defined in config. |
| REQ-ENEMY-015 | The Fast enemy shall have a lower health value and higher speed value than the Basic enemy as defined in config. |
| REQ-ENEMY-016 | The Durable enemy shall have a higher health value and lower speed value than the Basic enemy as defined in config. |
| REQ-ENEMY-017 | Enemy health values shall never fall below zero; the system shall clamp to zero before evaluating defeat. |
| REQ-ENEMY-018 | Enemy spawn positions shall be on or just outside the edge of the valid playable area and shall not overlap the energy core's position. |

**Dependencies:** REQ-CORE-004, REQ-SCORE-001, REQ-POWERUP-001.

---

## US-08 Waves

**As a player, I want enemy waves that grow harder so that the game remains challenging over time.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-WAVE-001 | Waves shall be clear-triggered: a wave is complete only when every enemy assigned to that wave has been both spawned and removed from the scene. |
| REQ-WAVE-002 | Wave composition (enemy types and counts) shall be derived from documented, deterministic formulas or configuration tables defined in `src/config/`; no inline magic numbers are permitted in spawning code. |
| REQ-WAVE-003 | Difficulty parameters (enemy count, enemy speed multiplier, enemy health multiplier, spawn interval, type distribution) shall scale with wave number using documented formulas. |
| REQ-WAVE-004 | All difficulty scaling formulas shall be pure functions of wave number, independently testable without a running Phaser scene. |
| REQ-WAVE-005 | Any randomness in wave generation shall use a seedable PRNG; given the same seed and wave number the output must be identical. |
| REQ-WAVE-006 | Enemy spawns within a wave shall be scheduled using game-clock timers, not real-time timers. |
| REQ-WAVE-007 | When the active enemy count reaches the configured maximum active-enemy cap, the system shall delay the next scheduled spawn without skipping it; the spawning queue must not lose enemies. |
| REQ-WAVE-008 | The active-enemy cap value shall be read from config. |
| REQ-WAVE-009 | When the last enemy of a wave is removed, the system shall start the configured intermission timer using the game clock. |
| REQ-WAVE-010 | The intermission duration shall be read from config. |
| REQ-WAVE-011 | During intermission, the HUD shall display a countdown and a "Wave N incoming!" notification where N is the next wave number. |
| REQ-WAVE-012 | When the intermission timer elapses, the system shall begin the next wave immediately. |
| REQ-WAVE-013 | Wave number shall increment by one at the start of each wave; it shall never decrement or reset within a run. |
| REQ-WAVE-014 | The wave system shall support an unlimited number of waves within the bounds of safe configured values; no hard-coded wave ceiling is permitted. |
| REQ-WAVE-015 | When a wave configuration would produce zero enemies (e.g. due to a scaling edge case), the system shall treat that wave as immediately complete and advance to intermission. |
| REQ-WAVE-016 | While the game is paused, wave spawn timers and intermission timers shall be suspended. |
| REQ-WAVE-017 | When the game unpauses, all suspended timers shall resume from the point they were suspended. |
| REQ-WAVE-018 | Player death shall not reset the current wave, re-spawn wave enemies, or restart the wave timer. |
| REQ-WAVE-019 | When the energy core reaches zero health during a wave, the system shall stop all wave timers and transition to game over without completing the current wave. |
| REQ-WAVE-020 | The HUD shall display the current wave number at all times during gameplay. |

**Dependencies:** REQ-ENEMY-001–REQ-ENEMY-018, REQ-PAUSE-005–REQ-PAUSE-007, REQ-PDEATH-016.

---

## US-09 Collisions and Damage

**As a developer, I want deterministic collision resolution so that damage is applied consistently regardless of frame timing.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-COL-001 | When a projectile overlaps an enemy, the system shall apply the projectile's damage value to the enemy and remove the projectile from the scene. |
| REQ-COL-002 | A single projectile shall damage at most one enemy per frame; after impact it is removed and cannot register further collisions that frame. |
| REQ-COL-003 | When an enemy overlaps the player and the player is in the active (not inactive, not invulnerable) state, the system shall apply the enemy's configured contact-damage value to the player. |
| REQ-COL-004 | When an enemy overlaps the player and the player is invulnerable, the system shall not apply damage to the player; the enemy shall continue its path unaffected. |
| REQ-COL-005 | When an enemy overlaps the player and the player is inactive, the system shall not apply damage and shall not register a collision. |
| REQ-COL-006 | When an enemy contacts the energy core, the system shall apply the enemy's contact-damage to the core and remove the enemy (see REQ-CORE-004, REQ-ENEMY-005). |
| REQ-COL-007 | When multiple collisions occur in the same physics step, the system shall apply each independently and in full; no collision shall be suppressed due to simultaneous events except as noted in REQ-COL-002. |
| REQ-COL-008 | Collision callbacks shall guard against already-removed entities; attempting to damage or remove an already-removed entity shall be a no-op. |
| REQ-COL-009 | Damage application shall clamp the receiving entity's health to zero from below; it must not produce negative health values. |
| REQ-COL-010 | When the Game scene shuts down or transitions, all active projectile and enemy collision listeners shall be removed; no callbacks shall fire after scene shutdown. |
| REQ-COL-011 | The damage value for each projectile type shall be defined in config; it must not be a literal in the collision handler. |

**Dependencies:** REQ-ENEMY-001–REQ-ENEMY-018, REQ-SHOOT-001–REQ-SHOOT-015, REQ-PDEATH-004–REQ-PDEATH-015.

---

## US-10 Scoring

**As a player, I want to earn and see my score so that I can measure my performance.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-SCORE-001 | When an enemy is defeated (health reduced to zero by a projectile), the system shall add the enemy's configured point value to the current score. |
| REQ-SCORE-002 | Enemies removed by cleanup, core contact, or boundary exit shall not award points. |
| REQ-SCORE-003 | The system shall guarantee that a single enemy defeat increments the score at most once, even if the defeat callback fires multiple times. |
| REQ-SCORE-004 | The current score shall be displayed in the HUD at all times during active gameplay. |
| REQ-SCORE-005 | The highest wave number fully completed in the current run shall be tracked and displayed on the game-over screen. |
| REQ-SCORE-006 | A wave is "completed" for scoring purposes when its intermission has begun (the clear condition has been met). |
| REQ-SCORE-007 | Player death shall not alter the current score. |
| REQ-SCORE-008 | When a new run begins, the score shall be reset to zero and the highest completed wave counter shall be reset to zero. |
| REQ-SCORE-009 | On the game-over screen, the system shall display the final score and the highest completed wave number. |
| REQ-SCORE-010 | Score values shall never fall below zero through any code path. |
| REQ-SCORE-011 | The system shall not allow the displayed score to exceed the configured maximum score boundary; if the boundary is reached, no further increments shall be applied. |
| REQ-SCORE-012 | Each enemy type's point value shall be read from config; values must not appear as literals in the scoring handler. |

**Dependencies:** REQ-ENEMY-007, REQ-WAVE-001, REQ-PDEATH-016, REQ-GAMEOVER-001.

---

## US-11 Power-Ups

**As a player, I want to collect power-ups so that I can temporarily improve my capabilities.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-POWERUP-001 | The defeat counter shall increment by one for each valid enemy defeat within the current run. |
| REQ-POWERUP-002 | Only defeats credited through the approved defeat path (projectile reducing health to zero) shall increment the defeat counter. |
| REQ-POWERUP-003 | When the defeat counter reaches a multiple of ten, the system shall spawn one power-up at the world position of the enemy that triggered the threshold. |
| REQ-POWERUP-004 | If the spawn position is outside the valid playable area, the system shall clamp it to the nearest point inside the valid playable area. |
| REQ-POWERUP-005 | Power-ups shall cycle in this fixed order: (1) fire-rate increase, (2) movement-speed increase, (3) health restoration; after health restoration the cycle repeats from fire-rate increase. |
| REQ-POWERUP-006 | The cycle index shall be tracked independently of wave number; it shall carry across waves within a run. |
| REQ-POWERUP-007 | When a new run begins, the defeat counter shall reset to zero and the cycle index shall reset to zero (fire-rate increase is next). |
| REQ-POWERUP-008 | Player death shall not reset the defeat counter or the cycle index. |
| REQ-POWERUP-009 | When the player overlaps a power-up while in the active or invulnerable state, the system shall collect it, apply its effect, and remove it from the scene. |
| REQ-POWERUP-010 | While the player is inactive (post-death), the system shall not collect power-ups regardless of overlap. |
| REQ-POWERUP-011 | Each power-up shall have a configured expiration lifetime; when the lifetime elapses, the system shall remove the power-up from the scene without applying any effect. |
| REQ-POWERUP-012 | At most one power-up of each type may be active on the player simultaneously; collecting a second power-up of the same type shall reset its duration, not stack its magnitude. |
| REQ-POWERUP-013 | Collecting a different power-up type while one is active shall apply the new effect and start its independent timer; the prior effect continues until its own timer expires. |
| REQ-POWERUP-014 | The fire-rate increase power-up shall apply the configured multiplier to the fire cooldown for the configured duration; all values from config. |
| REQ-POWERUP-015 | The movement-speed increase power-up shall apply the configured multiplier to the movement speed for the configured duration; all values from config. |
| REQ-POWERUP-016 | The health restoration power-up shall immediately restore the player's health by the configured restore amount, clamped to the player's maximum health. |
| REQ-POWERUP-017 | Health restoration shall never raise player health above the configured maximum. |
| REQ-POWERUP-018 | Each power-up type shall be visually distinguishable from every other type using shape or label, not color alone. |
| REQ-POWERUP-019 | The HUD shall display the type and remaining duration of each currently active power-up effect. |
| REQ-POWERUP-020 | When a power-up's active duration expires, the system shall restore the affected stat to its unmodified configured value. |
| REQ-POWERUP-021 | When the Game scene shuts down, all uncollected power-up objects shall be removed and their timers cancelled. |
| REQ-POWERUP-022 | While the game is paused, active power-up duration timers shall be suspended and resume when the game unpauses. |
| REQ-POWERUP-023 | The power-up type sequence, drop interval (10 defeats), expiration lifetime, and stat multipliers shall all be read from config. |

**Dependencies:** REQ-ENEMY-007, REQ-PDEATH-004–REQ-PDEATH-010, REQ-PAUSE-005.

---

## US-12 High Score

**As a player, I want my best score persisted locally so that I can see it on the next visit.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-HSCORE-001 | When a run ends (game over), if the final score is greater than the currently stored valid high score, the system shall write the new score to localStorage under a defined key. |
| REQ-HSCORE-002 | When a run ends and the final score is less than or equal to the stored valid high score, the system shall not overwrite the stored value. |
| REQ-HSCORE-003 | When the system reads from localStorage and the stored value is absent, the system shall treat the high score as zero and shall not throw an error. |
| REQ-HSCORE-004 | When the system reads from localStorage and the stored value is a malformed string (non-numeric, empty, whitespace-only), the system shall discard it, treat the high score as zero, and shall not throw an error. |
| REQ-HSCORE-005 | When the stored value parses to a negative number, the system shall discard it and treat the high score as zero. |
| REQ-HSCORE-006 | When the stored value parses to a non-integer (e.g. 123.45), the system shall discard it and treat the high score as zero. |
| REQ-HSCORE-007 | When the stored value parses to a non-finite number (Infinity, -Infinity, NaN), the system shall discard it and treat the high score as zero. |
| REQ-HSCORE-008 | When the stored value parses to a number exceeding the configured maximum score boundary, the system shall discard it and treat the high score as zero. |
| REQ-HSCORE-009 | When localStorage throws on read (e.g. SecurityError, QuotaExceededError), the system shall catch the error, treat the high score as zero, and not interrupt gameplay or menu rendering. |
| REQ-HSCORE-010 | When localStorage throws on write, the system shall catch the error silently and not interrupt gameplay. |
| REQ-HSCORE-011 | All localStorage read/write operations shall be performed outside the active gameplay loop (e.g. on game-over transition); they must not block or delay a running frame. |

**Dependencies:** REQ-GAMEOVER-001, REQ-MENU-004–REQ-MENU-007.

---

## US-13 Pause and Browser Focus

**As a player, I want to pause the game so that I can take breaks without losing progress.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-PAUSE-001 | While the game is active and unpaused, pressing Escape or P shall pause the game. |
| REQ-PAUSE-002 | While the game is paused, pressing Escape or P shall resume the game. |
| REQ-PAUSE-003 | Either key (Escape or P) shall toggle pause regardless of which key was last used. |
| REQ-PAUSE-004 | Pause state is binary; nested or stacked pausing is prohibited. |
| REQ-PAUSE-005 | When the game pauses, the system shall suspend all game-clock timers including: wave spawn timers, intermission timers, fire cooldown, inactive duration timer, invulnerability duration timer, power-up duration timers, and power-up expiration timers. |
| REQ-PAUSE-006 | When the game resumes, all suspended timers shall resume from the exact point they were suspended; no timer shall skip ahead or restart. |
| REQ-PAUSE-007 | When the game pauses, the system shall halt physics updates, enemy movement, and projectile movement. |
| REQ-PAUSE-008 | When the game pauses, the system shall display an unambiguous pause overlay containing the text "PAUSED" and a resume instruction; the overlay must not rely on color alone. |
| REQ-PAUSE-009 | While paused, audio shall be muted or stopped as defined in REQ-AUDIO-006. |
| REQ-PAUSE-010 | The pause action shall not be available from the Start Menu, the loading screen, or the game-over screen. |
| REQ-PAUSE-011 | The pause action shall not be available while the player is transitioning into the inactive state in the same frame; debounce input for at least one frame. |
| REQ-PAUSE-012 | When the browser window loses focus during active gameplay, the system shall automatically pause the game; the player must not need to press Escape or P. |
| REQ-PAUSE-013 | When the browser window regains focus after an automatic pause, the game shall remain paused until the player explicitly resumes; it must not auto-resume. |

**Dependencies:** REQ-WAVE-016–REQ-WAVE-017, REQ-PDEATH-017–REQ-PDEATH-018, REQ-POWERUP-022, REQ-AUDIO-006.

---

## US-14 Game Over

**As a player, I want a clear game-over screen so that I can see my results and restart.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-GAMEOVER-001 | When core health reaches zero, the system shall immediately transition to the Game Over scene. |
| REQ-GAMEOVER-002 | The game-over screen shall display the final score and the highest completed wave number. |
| REQ-GAMEOVER-003 | The game-over screen shall provide a "Restart" action that begins a new run from wave 1 with all counters reset. |
| REQ-GAMEOVER-004 | The game-over screen shall be navigable by keyboard: Tab/Shift+Tab cycles interactive elements; Enter or Space activates the focused element. |
| REQ-GAMEOVER-005 | The "Restart" element shall receive explicit initial focus when the game-over screen becomes active. |
| REQ-GAMEOVER-006 | The game-over audio cue shall play when the screen appears (subject to REQ-AUDIO-003). |
| REQ-GAMEOVER-007 | Mouse clicks on game-over elements shall not fire gameplay actions (no projectile spawning). |
| REQ-GAMEOVER-008 | The game-over screen shall display the current session high score. |

**Dependencies:** REQ-CORE-008, REQ-SCORE-009, REQ-HSCORE-001, REQ-AUDIO-003.

---

## US-15 New-Run Restart

**As a player, I want restarting to fully reset the game state so that each run starts cleanly.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-RESTART-001 | When a new run begins, score shall be set to zero. |
| REQ-RESTART-002 | When a new run begins, player health shall be set to maximum configured value. |
| REQ-RESTART-003 | When a new run begins, core health shall be set to maximum configured value. |
| REQ-RESTART-004 | When a new run begins, wave number shall be set to 1. |
| REQ-RESTART-005 | When a new run begins, the defeat counter shall be reset to zero. |
| REQ-RESTART-006 | When a new run begins, the power-up cycle index shall be reset to zero (fire-rate increase is next). |
| REQ-RESTART-007 | When a new run begins, all active enemies, projectiles, and power-up objects from the prior run shall be removed. |
| REQ-RESTART-008 | When a new run begins, all game-clock timers from the prior run shall be cancelled. |
| REQ-RESTART-009 | When a new run begins, the player's inactive or invulnerability state shall be cleared; the player shall start in the normal active state. |
| REQ-RESTART-010 | The session high score shall not be reset when a new run begins. |

**Dependencies:** REQ-GAMEOVER-003, REQ-SCORE-008, REQ-POWERUP-007, REQ-PDEATH-002.

---

## US-16 Audio

**As a player, I want sound effects with volume control so that audio enhances gameplay without being intrusive.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-AUDIO-001 | When the player fires a projectile, the system shall play the configured "shoot" sound effect. |
| REQ-AUDIO-002 | When the player or energy core receives damage, the system shall play the configured "hit" sound effect. |
| REQ-AUDIO-003 | When the energy core reaches zero health, the system shall play the configured "game over" sound effect. |
| REQ-AUDIO-004 | When the player collects a power-up, the system shall play the configured "power-up collected" sound effect. |
| REQ-AUDIO-005 | When a wave is cleared (the last enemy of a wave is removed), the system shall play the configured "wave complete" sound effect. |
| REQ-AUDIO-006 | When the game pauses, active sound effects shall stop or complete; music is not in MVP scope. When the game resumes, sound effects shall be playable again. |
| REQ-AUDIO-007 | When the mute toggle is activated, all audio output shall cease immediately. |
| REQ-AUDIO-008 | When the mute toggle is deactivated, audio shall resume at the current volume level. |
| REQ-AUDIO-009 | The volume control shall adjust all sound effect output volume; valid range is 0.0 to 1.0 inclusive. |
| REQ-AUDIO-010 | Mute state and volume level shall persist for the duration of the session; they shall not reset when scenes transition. |
| REQ-AUDIO-011 | When the Web Audio API or Phaser Sound Manager fails to initialize, the system shall catch the error silently and continue without audio. |
| REQ-AUDIO-012 | When a specific sound effect fails to play, the system shall catch the error silently; gameplay must not be interrupted. |
| REQ-AUDIO-013 | All audio assets shall be loaded in the Preload scene; no audio file shall be fetched during active gameplay. |
| REQ-AUDIO-014 | Background music shall not be implemented or loaded in the MVP. |
| REQ-AUDIO-015 | All audio assets shall be original, CC0, or CC BY licensed; no copyrighted or unlicensed audio shall enter the repository. |
| REQ-AUDIO-016 | Audio asset files shall be provided in both `.ogg` and `.mp3` formats to support cross-browser playback. |
| REQ-AUDIO-017 | All critical game-state information conveyed by audio shall also be communicated visually (see REQ-A11Y-007). |

**Dependencies:** REQ-PAUSE-009, REQ-MENU-013.

---

## US-17 Responsive UI and Accessibility

**As a player, I want the game to be readable and operable across common viewport sizes with sufficient contrast.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-A11Y-001 | All text rendered in the game (HUD, menus, overlays) shall meet WCAG AA contrast ratio of 4.5 : 1 against its background. |
| REQ-A11Y-002 | The game shall support a minimum viewport width of 800 px and minimum height of 600 px; at or above this size the full game shall be playable. |
| REQ-A11Y-003 | When the viewport is larger than the minimum, the game canvas shall scale to fill the available space while preserving the configured aspect ratio; letterboxing or pillarboxing is acceptable. |
| REQ-A11Y-004 | When the viewport is resized during gameplay, the canvas shall re-scale within one render frame; gameplay shall not be interrupted. |
| REQ-A11Y-005 | All menu screens shall be fully navigable by keyboard alone without requiring mouse interaction. |
| REQ-A11Y-006 | Every interactive element in menus shall have a visible focus indicator that does not rely on color alone. |
| REQ-A11Y-007 | No critical game-state information (health level, damage, enemy type, power-up type, wave number, score) shall be communicated by color alone; a secondary indicator (shape, label, numeric value, or pattern) must always be present. |
| REQ-A11Y-008 | Flashing or strobing visual effects shall not exceed 3 Hz. |
| REQ-A11Y-009 | The mute toggle and volume control shall be visible and operable from all gameplay screens without requiring a separate settings screen. |
| REQ-A11Y-010 | The objective and control scheme shall be accessible from the Start Menu without leaving the menu. |

**Dependencies:** REQ-MENU-001, REQ-AUDIO-007–REQ-AUDIO-009.

---

## US-18 Performance and Resource Limits

**As a developer, I want enforced resource limits so that the game remains stable over long runs.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-PERF-001 | The active enemy count shall never exceed the configured maximum active-enemy cap; see REQ-WAVE-007. |
| REQ-PERF-002 | The active projectile count shall never exceed the configured maximum active-projectile limit; see REQ-SHOOT-011. |
| REQ-PERF-003 | Power-up objects that have expired without being collected shall be removed from the scene immediately when their lifetime elapses. |
| REQ-PERF-004 | When an entity (enemy, projectile, power-up) is removed for any reason, all associated event listeners and timers shall be cancelled and the object shall be returned to its pool or destroyed. |
| REQ-PERF-005 | When the Game scene shuts down or transitions, all active entities, timers, and event listeners created by that scene shall be destroyed. |
| REQ-PERF-006 | Viewport resize events shall be debounced; the canvas re-scale handler shall not execute more than once per animation frame. |
| REQ-PERF-007 | When a config value required for wave generation or entity initialization is missing or of the wrong type, the system shall throw a descriptive error at startup before the game loop begins, not silently at runtime during gameplay. |
| REQ-PERF-008 | The game shall not guarantee a specific frame rate because target hardware is unspecified; no requirement shall reference "60 fps" or any specific frame rate as a pass/fail criterion. |

**Dependencies:** REQ-WAVE-008, REQ-SHOOT-011, REQ-POWERUP-011, REQ-POWERUP-021.

---

## US-19 Testability and Code Quality

**As a developer, I want the codebase to meet defined quality gates so that CI reliably catches regressions.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-QUAL-001 | The TypeScript compiler shall produce zero errors when run with `strict: true` and `noEmit: true` against the entire `src/` tree. |
| REQ-QUAL-002 | ESLint shall produce zero errors when run against the entire project using the flat config defined in `eslint.config.js`. |
| REQ-QUAL-003 | Prettier shall report zero formatting violations when run with `--check` against all project files. |
| REQ-QUAL-004 | All pure utility functions in `src/utils/` shall have corresponding Vitest unit tests. |
| REQ-QUAL-005 | All system classes in `src/systems/` shall have corresponding Vitest unit or integration tests covering their core state transitions. |
| REQ-QUAL-006 | Difficulty scaling formulas in `src/config/` shall have Vitest tests that verify output for at least wave 1, wave 10, and wave 50. |
| REQ-QUAL-007 | Vitest tests must not depend on real-time sleeping (e.g. `setTimeout` with actual delays); all time-dependent logic shall use fake timers or direct function calls. |
| REQ-QUAL-008 | Vitest tests shall not import Phaser or depend on a browser DOM unless the `jsdom` environment is explicitly configured for that test file. |
| REQ-QUAL-009 | The Playwright E2E suite shall verify: the page loads without console errors, the canvas element is present, keyboard input (WASD) reaches the game scene, and the game-over screen appears after core health reaches zero (simulated). |
| REQ-QUAL-010 | Playwright tests shall not assert pixel-exact visual state; they shall assert observable DOM/canvas presence and Phaser scene-key transitions. |
| REQ-QUAL-011 | `npm run build` shall complete without errors and produce a non-empty `dist/` directory. |
| REQ-QUAL-012 | `npm ci` shall install all dependencies reproducibly from `package-lock.json` without network errors in a clean environment. |

**Dependencies:** REQ-SEC-001–REQ-SEC-014.

---

## US-20 Security

**As a developer, I want the project to meet defined security standards so that the public repository is safe to distribute.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-SEC-001 | No credential, API key, token, password, or secret value shall be committed to the repository in any file including `.env`, config files, source files, or workflow files. |
| REQ-SEC-002 | `.env` files shall be listed in `.gitignore`; the build must not depend on them. |
| REQ-SEC-003 | All values read from localStorage shall be validated and sanitized before use; see REQ-HSCORE-003–REQ-HSCORE-010. |
| REQ-SEC-004 | The codebase shall not use `eval()` or the `Function` constructor anywhere. |
| REQ-SEC-005 | The codebase shall not assign untrusted external values (localStorage, URL params, user input) directly to `innerHTML`, `outerHTML`, or `document.write`. |
| REQ-SEC-006 | `npm audit --audit-level=high` shall pass with zero high or critical vulnerabilities in CI. |
| REQ-SEC-007 | The repository shall include a CodeQL analysis workflow (GitHub-provided default for JavaScript/TypeScript) that runs on every push to `main` and on every pull request. |
| REQ-SEC-008 | The repository shall enable Dependabot version updates for npm dependencies. |
| REQ-SEC-009 | All GitHub Actions workflow jobs shall declare the minimum permissions required; the CI workflow shall use `permissions: read-all` or equivalent; the deploy workflow shall grant only `contents: read`, `pages: write`, and `id-token: write`. |
| REQ-SEC-010 | Pull requests shall never trigger the deployment workflow. |
| REQ-SEC-011 | All third-party GitHub Actions shall be pinned to a specific commit SHA; mutable version tags (e.g. `@v3`) are prohibited in workflow files. |
| REQ-SEC-012 | No sensitive information (scores with personal data, error stack traces, file paths, config values) shall appear in game-visible error messages, console output in production builds, screenshots, documentation, or presentation materials. |
| REQ-SEC-013 | The production build shall be a fully static site; no runtime server, no server-side rendering, and no backend API calls. |
| REQ-SEC-014 | Local absolute file paths shall not appear in any committed file. |

**Dependencies:** REQ-CICD-001–REQ-CICD-010.

---

## US-21 CI/CD Pipeline

**As a developer, I want automated CI and deployment so that every merge to main is verified and published.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-CICD-001 | A CI workflow shall run on every pull request targeting `main` and on every push to `main`. |
| REQ-CICD-002 | The CI workflow shall execute, in order: `npm ci`, `typecheck`, `lint`, `format:check`, `test`, `build`, `test:e2e`, `npm audit --audit-level=high`. |
| REQ-CICD-003 | The CI workflow shall fail if any step produces a non-zero exit code. |
| REQ-CICD-004 | The CI workflow shall declare `permissions: read-all`; no write permissions shall be granted. |
| REQ-CICD-005 | The CI workflow shall use Node 20; the exact minor/patch version shall be pinned in the workflow and updated intentionally. |
| REQ-CICD-006 | The CI workflow shall cache `~/.npm` keyed on `package-lock.json` hash. |
| REQ-CICD-007 | A deployment workflow shall run only on push to `main` and only after the CI workflow passes. |
| REQ-CICD-008 | The deployment workflow shall use `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages` to publish the `dist/` directory to GitHub Pages. |
| REQ-CICD-009 | The deployment workflow shall target the `github-pages` environment; concurrency shall allow only one deployment at a time without cancelling in-progress runs. |
| REQ-CICD-010 | The deployment workflow shall not require any repository secrets beyond the automatic `GITHUB_TOKEN`. |
| REQ-CICD-011 | Workflow files shall not be created until the dedicated approved task begins; no placeholder files shall be present in the repository. |

**Resolved deployment information:**

| Item | Value |
|---|---|
| GitHub repository owner | `robinsonalexanderquiroz-droid` |
| GitHub repository name | `chrono-defender` |
| GitHub Pages URL | `https://robinsonalexanderquiroz-droid.github.io/chrono-defender/` |
| Vite `base` path | `"/chrono-defender/"` |
| `actions/checkout` SHA | `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1) |
| `actions/setup-node` SHA | `820762786026740c76f36085b0efc47a31fe5020` (v7.0.0) |
| `actions/configure-pages` SHA | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` (v6.0.0) |
| `actions/upload-pages-artifact` SHA | `fc324d3547104276b827a68afc52ff2a11cc49c9` (v5.0.0) |
| `actions/deploy-pages` SHA | `cd2ce8fcbc39b97be8ca5fce6e763baed58fa128` (v5.0.0) |

**Dependencies:** REQ-SEC-007–REQ-SEC-011.

---

## US-22 Deliverables

**As a submitter, I want all required project artifacts in place so that the submission is complete.**

### Acceptance Criteria

| ID | Criterion |
|---|---|
| REQ-DEL-001 | The project shall have a public GitHub repository containing all source code, tests, config, and documentation. |
| REQ-DEL-002 | The repository shall include a `README.md` with sections: project description, live demo link (placeholder until URL is known), technology stack, local development setup, running tests, build instructions, controls, and license. |
| REQ-DEL-003 | The README shall not contain credentials, private URLs, local absolute paths, personal information, environment variable values, or invented repository owner names. |
| REQ-DEL-004 | The game shall be publicly accessible via GitHub Pages at the URL produced by the deploy workflow. |
| REQ-DEL-005 | The CI workflow shall be present and passing on `main`. |
| REQ-DEL-006 | The deploy workflow shall be present and functional on `main`. |
| REQ-DEL-007 | A `docs/presentation-script.md` shall be created when the project is sufficiently complete to demonstrate; it shall not be created during scaffolding. |
| REQ-DEL-008 | The presentation video shall demonstrate working gameplay and a walkthrough of selected code, automated tests, and security checks; its duration shall not exceed five minutes. |
| REQ-DEL-009 | Code shown publicly in the README, video, or any other public-facing artifact shall contain no credentials, private URLs, local paths, or personal information. |
| REQ-DEL-010 | The repository shall contain a `LICENSE` file using the MIT License. |
| REQ-DEL-011 | The `LICENSE` file shall be compatible with all dependencies and audio assets in the repository. |

**Dependencies:** REQ-CICD-001–REQ-CICD-011, REQ-SEC-001–REQ-SEC-014.

---

## US-23 Out of Scope

The following capabilities are explicitly excluded from the MVP. Requirements, design, or implementation work for these items must not be created without separate approved specifications.

| Category | Excluded Item |
|---|---|
| Infrastructure | AWS or any cloud backend service |
| Infrastructure | Backend server, server-side rendering, API server |
| Identity | Authentication, user accounts, or sessions |
| Data | Databases, cloud saves, or server-side persistence |
| Multiplayer | Online or local multiplayer of any kind |
| Commerce | Payments or advertisements |
| Analytics | Analytics requiring private API keys |
| Input | Gamepad support |
| Weapons | Multiple weapons, towers, or weapon inventory |
| Game modes | Finite campaign or final victory condition |
| Audio | Background music |
| Art | External art packs |
| Leaderboards | Online or cross-device leaderboards |

---

## Appendix A: Game State Transition Table

| From State | Trigger | To State | Notes |
|---|---|---|---|
| Loading | All assets loaded (or failed) | Start Menu | REQ-LOAD-003 |
| Start Menu | Player activates "Start" | Game (Wave 1) | REQ-MENU-002 |
| Game (active) | Escape or P pressed | Game (paused) | REQ-PAUSE-001 |
| Game (paused) | Escape or P pressed | Game (active) | REQ-PAUSE-002 |
| Game (active) | Browser focus lost | Game (paused) | REQ-PAUSE-012 |
| Game (active) | Player health → 0 | Game (player inactive) | REQ-PDEATH-004 |
| Game (player inactive) | Inactive timer elapses | Game (player invulnerable) | REQ-PDEATH-011 |
| Game (player invulnerable) | Invulnerability timer elapses | Game (active) | REQ-PDEATH-015 |
| Game (any) | Core health → 0 | Game Over | REQ-CORE-008 |
| Game Over | Player activates "Restart" | Game (Wave 1) | REQ-GAMEOVER-003 |

**Prohibited transitions:**
- Start Menu → Game Over (direct)
- Loading → Game (direct, skipping Start Menu)
- Game (paused) → Game Over (must unpause first or core health reaches zero while unpausing)
- Game (player inactive) → Game Over (core health reaching zero is the only game-over trigger)
- Any state → Start Menu (only possible via Game Over → Restart → ... or future menu navigation not in MVP)
