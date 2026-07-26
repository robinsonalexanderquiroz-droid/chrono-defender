/**
 * EnemyManager - Manages enemy spawning, movement patterns, and shooting.
 *
 * Uses static methods (no singleton needed) to create and update enemies
 * based on EnemyDef configurations from the gameplay config.
 */

import Phaser from 'phaser';

import {
  type DifficultyParams,
  type EnemyDef,
  type EnemyType,
  ENEMY_DEFS,
} from '../config/gameplay';

/** Data keys stored on enemy sprites via setData */
interface EnemyData {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  score: number;
  canShoot: boolean;
  fireCooldown: number;
  projectileSpeed: number;
  pattern: EnemyDef['pattern'];
  dropChance: number;
  /** Elapsed time for pattern calculations (ms) */
  elapsedTime: number;
  /** Last fire timestamp (ms) */
  lastFireTime: number;
  /** Whether the enemy is currently paused in stop-and-go pattern */
  isStopped: boolean;
  /** Stop-and-go pause timer (ms) */
  stopTimer: number;
  /** Dive pattern: target Y coordinate */
  diveTargetY: number;
  /** Dive pattern: whether the enemy has reached its target Y */
  diveReached: boolean;
  /** Orbit pattern: orbit center X */
  orbitCenterX: number;
  /** Orbit pattern: orbit center Y */
  orbitCenterY: number;
  /** Orbit pattern: current angle in radians */
  orbitAngle: number;
}

/** Stop-and-go pattern: duration of pause in ms */
const STOP_AND_GO_PAUSE_DURATION = 800;

/** Stop-and-go pattern: duration of movement between pauses in ms */
const STOP_AND_GO_MOVE_DURATION = 1200;

/** Zigzag pattern: oscillation amplitude in pixels */
const ZIGZAG_AMPLITUDE = 60;

/** Zigzag pattern: oscillation frequency multiplier */
const ZIGZAG_FREQUENCY = 0.003;

/** Orbit pattern: radius in pixels */
const ORBIT_RADIUS = 80;

/** Orbit pattern: angular speed in radians per second */
const ORBIT_ANGULAR_SPEED = 1.5;

/** Dive pattern: approach speed multiplier for diagonal movement */
const DIVE_APPROACH_MULTIPLIER = 1.2;

export class EnemyManager {
  /**
   * Creates an enemy sprite and initializes its data.
   *
   * @param scene - The Phaser scene to spawn the enemy in
   * @param type - The enemy type identifier
   * @param x - Spawn X position
   * @param y - Spawn Y position
   * @param difficulty - Current difficulty params for scaling
   * @returns The created enemy sprite with physics body
   */
  static spawn(
    scene: Phaser.Scene,
    type: EnemyType,
    x: number,
    y: number,
    difficulty: DifficultyParams,
  ): Phaser.Physics.Arcade.Sprite {
    const def = ENEMY_DEFS[type];

    // Create sprite using the defined texture key
    const enemy = scene.physics.add.sprite(x, y, def.texture);
    enemy.setDisplaySize(def.size, def.size);

    // Scale HP and speed with difficulty
    const scaledHp = Math.ceil(def.hp * difficulty.hpMultiplier);
    const scaledSpeed = def.speed * difficulty.speedMultiplier;
    const scaledProjectileSpeed =
      def.projectileSpeed * difficulty.projectileSpeedMultiplier;

    // Store all enemy data on the sprite
    const data: EnemyData = {
      type,
      hp: scaledHp,
      maxHp: scaledHp,
      speed: scaledSpeed,
      score: def.score,
      canShoot: def.canShoot,
      fireCooldown: def.fireCooldown,
      projectileSpeed: scaledProjectileSpeed,
      pattern: def.pattern,
      dropChance: def.dropChance,
      elapsedTime: 0,
      lastFireTime: 0,
      isStopped: false,
      stopTimer: 0,
      diveTargetY: y,
      diveReached: false,
      orbitCenterX: x - ORBIT_RADIUS,
      orbitCenterY: y,
      orbitAngle: 0,
    };

    // Set each data key individually for Phaser's data manager
    const dataEntries = Object.entries(data) as [string, unknown][];
    for (const [key, value] of dataEntries) {
      enemy.setData(key, value);
    }

    return enemy;
  }

  /**
   * Updates enemy movement based on its assigned pattern.
   *
   * @param enemy - The enemy sprite to move
   * @param delta - Frame delta time in ms
   * @param pattern - Movement pattern to apply
   */
  static updateMovement(
    enemy: Phaser.Physics.Arcade.Sprite,
    delta: number,
    pattern: EnemyDef['pattern'],
  ): void {
    const speed = enemy.getData('speed') as number;
    const elapsedTime = (enemy.getData('elapsedTime') as number) + delta;
    enemy.setData('elapsedTime', elapsedTime);

    switch (pattern) {
      case 'straight':
        EnemyManager.applyStraight(enemy, speed);
        break;
      case 'zigzag':
        EnemyManager.applyZigzag(enemy, speed, elapsedTime);
        break;
      case 'stop-and-go':
        EnemyManager.applyStopAndGo(enemy, speed, delta);
        break;
      case 'dive':
        EnemyManager.applyDive(enemy, speed);
        break;
      case 'orbit':
        EnemyManager.applyOrbit(enemy, speed, delta);
        break;
    }
  }

  /**
   * Handles enemy shooting logic. Enemies fire at intervals toward the player.
   *
   * @param scene - The active Phaser scene
   * @param enemies - Group of active enemy sprites
   * @param playerPos - Current player position
   * @param delta - Frame delta time in ms
   */
  static handleShooting(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    playerPos: Phaser.Math.Vector2,
    delta: number,
  ): void {
    const children = enemies.getChildren() as Phaser.Physics.Arcade.Sprite[];

    for (const enemy of children) {
      if (!enemy.active) continue;

      const canShoot = enemy.getData('canShoot') as boolean;
      if (!canShoot) continue;

      const lastFireTime = (enemy.getData('lastFireTime') as number) + delta;
      const fireCooldown = enemy.getData('fireCooldown') as number;

      if (lastFireTime >= fireCooldown) {
        enemy.setData('lastFireTime', 0);
        EnemyManager.fireProjectile(scene, enemy, playerPos);
      } else {
        enemy.setData('lastFireTime', lastFireTime);
      }
    }
  }

  // ─── Private Pattern Implementations ───────────────────────────────

  private static applyStraight(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number,
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(-speed, 0);
    }
  }

  private static applyZigzag(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number,
    elapsedTime: number,
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      const verticalOffset =
        Math.sin(elapsedTime * ZIGZAG_FREQUENCY) * ZIGZAG_AMPLITUDE;
      body.setVelocity(-speed, verticalOffset);
    }
  }

  private static applyStopAndGo(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number,
    delta: number,
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const isStopped = enemy.getData('isStopped') as boolean;
    const stopTimer = (enemy.getData('stopTimer') as number) + delta;

    if (isStopped) {
      body.setVelocity(0, 0);
      if (stopTimer >= STOP_AND_GO_PAUSE_DURATION) {
        enemy.setData('isStopped', false);
        enemy.setData('stopTimer', 0);
      } else {
        enemy.setData('stopTimer', stopTimer);
      }
    } else {
      body.setVelocity(-speed, 0);
      if (stopTimer >= STOP_AND_GO_MOVE_DURATION) {
        enemy.setData('isStopped', true);
        enemy.setData('stopTimer', 0);
      } else {
        enemy.setData('stopTimer', stopTimer);
      }
    }
  }

  private static applyDive(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number,
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    const diveReached = enemy.getData('diveReached') as boolean;
    const diveTargetY = enemy.getData('diveTargetY') as number;

    if (diveReached) {
      // After reaching target Y, move straight left
      body.setVelocity(-speed, 0);
    } else {
      // Diagonal approach toward target Y
      const dy = diveTargetY - enemy.y;
      const threshold = 5;

      if (Math.abs(dy) < threshold) {
        enemy.setData('diveReached', true);
        body.setVelocity(-speed, 0);
      } else {
        const direction = dy > 0 ? 1 : -1;
        body.setVelocity(
          -speed * DIVE_APPROACH_MULTIPLIER,
          direction * speed * 0.6,
        );
      }
    }
  }

  private static applyOrbit(
    enemy: Phaser.Physics.Arcade.Sprite,
    speed: number,
    delta: number,
  ): void {
    const body = enemy.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;

    let orbitAngle = enemy.getData('orbitAngle') as number;
    const orbitCenterX = enemy.getData('orbitCenterX') as number;
    const orbitCenterY = enemy.getData('orbitCenterY') as number;

    // Progress the orbit angle
    orbitAngle += ORBIT_ANGULAR_SPEED * (delta / 1000);
    enemy.setData('orbitAngle', orbitAngle);

    // Calculate target position on orbit path
    const targetX = orbitCenterX + Math.cos(orbitAngle) * ORBIT_RADIUS;
    const targetY = orbitCenterY + Math.sin(orbitAngle) * ORBIT_RADIUS;

    // Move orbit center to the left over time
    const newCenterX = orbitCenterX - speed * 0.3 * (delta / 1000);
    enemy.setData('orbitCenterX', newCenterX);

    // Set velocity toward target position
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const factor = speed / dist;
      body.setVelocity(dx * factor, dy * factor);
    } else {
      body.setVelocity(0, 0);
    }
  }

  private static fireProjectile(
    scene: Phaser.Scene,
    enemy: Phaser.Physics.Arcade.Sprite,
    playerPos: Phaser.Math.Vector2,
  ): void {
    const projectileSpeed = enemy.getData('projectileSpeed') as number;

    // Calculate direction toward player
    const dx = playerPos.x - enemy.x;
    const dy = playerPos.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return;

    const vx = (dx / dist) * projectileSpeed;
    const vy = (dy / dist) * projectileSpeed;

    // Create enemy projectile
    const projectile = scene.physics.add.sprite(
      enemy.x,
      enemy.y,
      'enemy-projectile',
    );
    projectile.setDisplaySize(8, 8);

    const body = projectile.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(vx, vy);
    }

    // Tag it as enemy projectile
    projectile.setData('isEnemyProjectile', true);
  }
}

export default EnemyManager;
