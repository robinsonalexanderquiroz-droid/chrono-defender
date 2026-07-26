# Chrono Defender v0.3.0

Expanded gameplay systems: enemy variety, weapons, power-ups, scoring, and progression.

## Play Now

https://robinsonalexanderquiroz-droid.github.io/chrono-defender/

## New Features

### Enemy System

- Five enemy types: Scout, Interceptor, Heavy, Bomber, Sniper
- Five movement patterns: straight, zigzag, stop-and-go, dive, orbit
- Data-driven enemy definitions with configurable HP, speed, score, and drop chance
- Enemy shooting with aimed projectiles

### Weapon System

- Six weapon types: Standard Laser, Spread Shot, Triple Shot, Rapid Fire, Piercing Laser, Plasma Beam
- Weapon cycling via power-up pickups
- Unique projectile behavior per weapon (spread angles, piercing, fire rate)

### Power-Up System

- Eight power-up types: Health, Shield, Weapon Upgrade, Rapid Fire, Score x2, Drone, Magnet, Invulnerability
- Weighted random drop system
- Timed effects with duration tracking

### Scoring & Combos

- Combo multiplier: chain kills within 2 seconds for up to 4x score
- Floating score popups at kill positions
- Perfect wave bonus, mini-boss bonus, boss bonus
- Combo count and multiplier displayed in HUD

### Wave & Difficulty

- Wave composition scales with progression (more enemies, harder types)
- Adaptive difficulty: enemy HP (+10%/wave), speed (+5%/wave), spawn rate, projectile speed
- Mini-boss encounters every 5 waves (Chrono Sentinel)
- Final boss trigger after wave 12

### Persistence

- High score saved to localStorage
- Games played, bosses defeated, mini-bosses defeated tracking
- Settings persistence (volume, mute state)

### HUD Improvements

- Combo count and multiplier display
- Current weapon name
- High score on game over screen

## Technical

- Data-driven configuration in `src/config/gameplay.ts`
- Seven new manager modules (Enemy, Weapon, PowerUp, Wave, Score, Difficulty, Save)
- Singleton pattern matching existing AudioManager architecture
- All managers reset cleanly on scene restart
- No breaking changes to existing E2E tests

## Known Issues

- Procedural graphics (no sprite artwork)
- Enemy manager patterns defined but not all visually differentiated yet in the prototype scene
- MISSILE and BEAM upgrades still share effects with THRUST and SPLIT in the legacy upgrade rail
- Weapon switching is defined in WeaponManager but not yet bound to gameplay input
