/**
 * Data-driven gameplay configuration for Chrono Defender v0.3.0.
 *
 * All tunable numbers, enemy definitions, weapon stats, power-up parameters,
 * wave composition, and difficulty scaling formulas live here.
 */

// ─── Enemy Definitions ─────────────────────────────────────────────────────

export type EnemyType = 'scout' | 'interceptor' | 'heavy' | 'bomber' | 'sniper';

export interface EnemyDef {
  /** Display name for HUD/debug */
  name: string;
  /** Base health points */
  hp: number;
  /** Movement speed in px/s */
  speed: number;
  /** Points awarded on defeat */
  score: number;
  /** Sprite texture key */
  texture: string;
  /** Width/height for texture generation (px) */
  size: number;
  /** Primary color for procedural sprite */
  color: number;
  /** Whether this enemy fires projectiles */
  canShoot: boolean;
  /** Fire rate cooldown in ms (if canShoot) */
  fireCooldown: number;
  /** Projectile speed in px/s (if canShoot) */
  projectileSpeed: number;
  /** Movement pattern identifier */
  pattern: 'straight' | 'zigzag' | 'stop-and-go' | 'dive' | 'orbit';
  /** Drop chance for power-ups (0–1) */
  dropChance: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  scout: {
    name: 'Scout',
    hp: 1,
    speed: 180,
    score: 100,
    texture: 'enemy-scout',
    size: 24,
    color: 0xcc2233,
    canShoot: false,
    fireCooldown: 0,
    projectileSpeed: 0,
    pattern: 'straight',
    dropChance: 0.1,
  },
  interceptor: {
    name: 'Interceptor',
    hp: 2,
    speed: 140,
    score: 200,
    texture: 'enemy-interceptor',
    size: 28,
    color: 0xff8800,
    canShoot: false,
    fireCooldown: 0,
    projectileSpeed: 0,
    pattern: 'zigzag',
    dropChance: 0.15,
  },
  heavy: {
    name: 'Heavy',
    hp: 4,
    speed: 70,
    score: 300,
    texture: 'enemy-heavy',
    size: 44,
    color: 0x551155,
    canShoot: true,
    fireCooldown: 1500,
    projectileSpeed: 200,
    pattern: 'straight',
    dropChance: 0.25,
  },
  bomber: {
    name: 'Bomber',
    hp: 3,
    speed: 100,
    score: 250,
    texture: 'enemy-bomber',
    size: 36,
    color: 0x226644,
    canShoot: true,
    fireCooldown: 2000,
    projectileSpeed: 150,
    pattern: 'dive',
    dropChance: 0.2,
  },
  sniper: {
    name: 'Sniper',
    hp: 2,
    speed: 90,
    score: 350,
    texture: 'enemy-sniper',
    size: 30,
    color: 0x4444cc,
    canShoot: true,
    fireCooldown: 2500,
    projectileSpeed: 350,
    pattern: 'stop-and-go',
    dropChance: 0.2,
  },
};

// ─── Mini-Boss Definitions ──────────────────────────────────────────────────

export interface MiniBossDef {
  name: string;
  hp: number;
  speed: number;
  score: number;
  texture: string;
  size: number;
  color: number;
  fireCooldown: number;
  projectileSpeed: number;
  /** Number of projectiles per volley */
  volleyCount: number;
}

export const MINI_BOSS_DEF: MiniBossDef = {
  name: 'Chrono Sentinel',
  hp: 15,
  speed: 60,
  score: 1500,
  texture: 'enemy-miniboss',
  size: 64,
  color: 0x884400,
  fireCooldown: 1200,
  projectileSpeed: 220,
  volleyCount: 3,
};

/** Mini-boss appears every N waves */
export const MINI_BOSS_INTERVAL = 5;

// ─── Weapon Definitions ─────────────────────────────────────────────────────

export type WeaponType =
  | 'laser'
  | 'spread'
  | 'triple'
  | 'rapid'
  | 'piercing'
  | 'plasma';

export interface WeaponDef {
  name: string;
  /** Damage per projectile */
  damage: number;
  /** Fire rate cooldown in ms */
  cooldown: number;
  /** Projectile speed in px/s */
  speed: number;
  /** Number of projectiles per shot */
  count: number;
  /** Spread angle in degrees (0 = straight) */
  spread: number;
  /** Whether projectiles pierce through enemies */
  piercing: boolean;
  /** Projectile color */
  color: number;
  /** Projectile width */
  width: number;
}

export const WEAPON_DEFS: Record<WeaponType, WeaponDef> = {
  laser: {
    name: 'Standard Laser',
    damage: 1,
    cooldown: 220,
    speed: 600,
    count: 1,
    spread: 0,
    piercing: false,
    color: 0x00ccff,
    width: 20,
  },
  spread: {
    name: 'Spread Shot',
    damage: 1,
    cooldown: 300,
    speed: 550,
    count: 5,
    spread: 30,
    piercing: false,
    color: 0xffcc00,
    width: 14,
  },
  triple: {
    name: 'Triple Shot',
    damage: 1,
    cooldown: 250,
    speed: 580,
    count: 3,
    spread: 12,
    piercing: false,
    color: 0x44ff44,
    width: 16,
  },
  rapid: {
    name: 'Rapid Fire',
    damage: 1,
    cooldown: 100,
    speed: 700,
    count: 1,
    spread: 0,
    piercing: false,
    color: 0xff4444,
    width: 12,
  },
  piercing: {
    name: 'Piercing Laser',
    damage: 2,
    cooldown: 350,
    speed: 800,
    count: 1,
    spread: 0,
    piercing: true,
    color: 0xcc44ff,
    width: 24,
  },
  plasma: {
    name: 'Plasma Beam',
    damage: 3,
    cooldown: 500,
    speed: 450,
    count: 1,
    spread: 0,
    piercing: false,
    color: 0x00ff88,
    width: 30,
  },
};

/** Order in which weapons cycle via power-up upgrades */
export const WEAPON_CYCLE: WeaponType[] = [
  'laser',
  'triple',
  'spread',
  'rapid',
  'piercing',
  'plasma',
];

// ─── Power-Up Definitions ───────────────────────────────────────────────────

export type PowerUpType =
  | 'health'
  | 'shield'
  | 'weapon'
  | 'rapidfire'
  | 'score2x'
  | 'drone'
  | 'magnet'
  | 'invuln';

export interface PowerUpDef {
  name: string;
  /** Duration in ms (0 = instant) */
  duration: number;
  /** Tint color for the power-up sprite */
  color: number;
  /** Symbol character displayed on the pickup */
  symbol: string;
}

export const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  health: {
    name: 'Health',
    duration: 0,
    color: 0x44ff44,
    symbol: '+',
  },
  shield: {
    name: 'Shield',
    duration: 8000,
    color: 0x4488ff,
    symbol: 'S',
  },
  weapon: {
    name: 'Weapon Upgrade',
    duration: 0,
    color: 0xff8800,
    symbol: 'W',
  },
  rapidfire: {
    name: 'Rapid Fire',
    duration: 6000,
    color: 0xff4444,
    symbol: 'R',
  },
  score2x: {
    name: 'Score x2',
    duration: 10000,
    color: 0xffff00,
    symbol: '2',
  },
  drone: {
    name: 'Drone Upgrade',
    duration: 0,
    color: 0x2244ff,
    symbol: 'D',
  },
  magnet: {
    name: 'Magnet',
    duration: 8000,
    color: 0xff44ff,
    symbol: 'M',
  },
  invuln: {
    name: 'Invulnerability',
    duration: 4000,
    color: 0xffffff,
    symbol: 'I',
  },
};

/** Weighted drop table — higher weight = more common */
export const POWERUP_DROP_WEIGHTS: Record<PowerUpType, number> = {
  health: 25,
  shield: 15,
  weapon: 10,
  rapidfire: 15,
  score2x: 10,
  drone: 8,
  magnet: 10,
  invuln: 7,
};

// ─── Difficulty Scaling ─────────────────────────────────────────────────────

export interface DifficultyParams {
  /** HP multiplier applied to enemies */
  hpMultiplier: number;
  /** Speed multiplier applied to enemies */
  speedMultiplier: number;
  /** Spawn interval multiplier (lower = faster spawns) */
  spawnRateMultiplier: number;
  /** Enemy projectile speed multiplier */
  projectileSpeedMultiplier: number;
}

/**
 * Calculate difficulty parameters for a given wave number.
 * All scaling is gradual and capped to prevent impossibility.
 *
 * @param wave - Current wave number (1-indexed)
 */
export function getDifficultyForWave(wave: number): DifficultyParams {
  const w = Math.max(1, wave);
  return {
    // HP: +10% per wave, capped at 3x
    hpMultiplier: Math.min(3.0, 1.0 + (w - 1) * 0.1),
    // Speed: +5% per wave, capped at 2x
    speedMultiplier: Math.min(2.0, 1.0 + (w - 1) * 0.05),
    // Spawn rate: -5% per wave (lower = faster), capped at 0.4x
    spawnRateMultiplier: Math.max(0.4, 1.0 - (w - 1) * 0.05),
    // Projectile speed: +4% per wave, capped at 1.8x
    projectileSpeedMultiplier: Math.min(1.8, 1.0 + (w - 1) * 0.04),
  };
}

// ─── Wave Composition ───────────────────────────────────────────────────────

export interface WaveComposition {
  /** Total enemies to spawn in this wave */
  enemyCount: number;
  /** Enemy type distribution weights for this wave */
  typeWeights: Partial<Record<EnemyType, number>>;
  /** Whether this wave ends with a mini-boss */
  hasMiniBoss: boolean;
}

/**
 * Generate wave composition for a given wave number.
 *
 * @param wave - Current wave number (1-indexed)
 */
export function getWaveComposition(wave: number): WaveComposition {
  const w = Math.max(1, wave);

  // Base enemy count scales with wave
  const enemyCount = Math.min(30, 4 + Math.floor(w * 1.5));

  // Type distribution evolves with progression
  const typeWeights: Partial<Record<EnemyType, number>> = { scout: 40 };

  if (w >= 2) typeWeights.interceptor = 20;
  if (w >= 3) typeWeights.heavy = 15;
  if (w >= 4) typeWeights.bomber = 12;
  if (w >= 5) typeWeights.sniper = 10;

  // Reduce scout prevalence as harder types appear
  if (w >= 4) typeWeights.scout = 25;
  if (w >= 7) typeWeights.scout = 15;

  const hasMiniBoss = w > 1 && w % MINI_BOSS_INTERVAL === 0;

  return { enemyCount, typeWeights, hasMiniBoss };
}

// ─── Player Config ──────────────────────────────────────────────────────────

export const PLAYER_CONFIG = {
  /** Movement speed in px/s */
  speed: 250,
  /** Boosted movement speed (with thrust upgrade) */
  boostedSpeed: 360,
  /** Maximum lives */
  maxLives: 3,
  /** Invulnerability duration after respawn (ms) */
  invulnDuration: 2000,
  /** Respawn delay after death (ms) — not used in current prototype */
  respawnDelay: 0,
} as const;

// ─── Scoring Config ─────────────────────────────────────────────────────────

export const SCORE_CONFIG = {
  /** Combo timeout: kills within this window extend the combo (ms) */
  comboTimeout: 2000,
  /** Score multiplier per combo level (e.g., 2 = 2x at combo 2) */
  comboMultiplierStep: 0.25,
  /** Max combo multiplier */
  maxComboMultiplier: 4.0,
  /** Bonus for clearing a wave without taking damage */
  perfectWaveBonus: 500,
  /** Bonus for defeating a mini-boss */
  miniBossBonus: 1000,
  /** Bonus for defeating the final boss */
  bossBonus: 2000,
} as const;

// ─── Wave Timing ────────────────────────────────────────────────────────────

export const WAVE_CONFIG = {
  /** Delay between waves (ms) */
  intermission: 3000,
  /** Base spawn interval between enemies (ms) */
  baseSpawnInterval: 1200,
  /** Maximum active enemies at once */
  maxActiveEnemies: 15,
  /** Waves before the final boss appears */
  wavesBeforeFinalBoss: 12,
} as const;
