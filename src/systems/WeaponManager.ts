/**
 * WeaponManager - Manages player weapon state and firing.
 *
 * Tracks the current weapon type, handles firing mechanics including
 * spread angles and projectile counts, and manages weapon cycling.
 * Implements singleton pattern.
 */

import Phaser from 'phaser';

import {
  type WeaponDef,
  type WeaponType,
  WEAPON_CYCLE,
  WEAPON_DEFS,
} from '../config/gameplay';

class WeaponManager {
  private static instance: WeaponManager | null = null;

  /** Current weapon type */
  private currentWeapon: WeaponType = 'laser';

  /** Index in WEAPON_CYCLE for the current weapon */
  private cycleIndex = 0;

  private constructor() {
    // Private constructor for singleton
  }

  /** Get the singleton instance */
  static getInstance(): WeaponManager {
    if (!WeaponManager.instance) {
      WeaponManager.instance = new WeaponManager();
    }
    return WeaponManager.instance;
  }

  /**
   * Fires projectiles from the player position based on the current weapon definition.
   *
   * @param scene - The active Phaser scene
   * @param group - Physics group to add projectiles to
   * @param x - Fire origin X position
   * @param y - Fire origin Y position
   * @param currentWeapon - The weapon type to fire (allows override)
   */
  fire(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    currentWeapon: WeaponType = this.currentWeapon,
  ): void {
    const def = WEAPON_DEFS[currentWeapon];
    const { count, spread, speed, piercing, damage, color, width } = def;

    if (count === 1) {
      // Single projectile, no spread calculation needed
      this.spawnProjectile(
        scene,
        group,
        x,
        y,
        0,
        speed,
        piercing,
        damage,
        color,
        width,
      );
    } else {
      // Multiple projectiles with spread
      const halfSpread = spread / 2;
      const angleStep = count > 1 ? spread / (count - 1) : 0;

      for (let i = 0; i < count; i++) {
        const angle = -halfSpread + angleStep * i;
        this.spawnProjectile(
          scene,
          group,
          x,
          y,
          angle,
          speed,
          piercing,
          damage,
          color,
          width,
        );
      }
    }
  }

  /**
   * Cycles to the next weapon in the WEAPON_CYCLE sequence.
   */
  upgradeWeapon(): void {
    this.cycleIndex = (this.cycleIndex + 1) % WEAPON_CYCLE.length;
    const nextWeapon = WEAPON_CYCLE[this.cycleIndex];
    if (nextWeapon !== undefined) {
      this.currentWeapon = nextWeapon;
    }
  }

  /**
   * Resets the weapon to the default laser.
   */
  reset(): void {
    this.currentWeapon = 'laser';
    this.cycleIndex = 0;
  }

  /**
   * Returns the current weapon type.
   */
  getCurrentWeapon(): WeaponType {
    return this.currentWeapon;
  }

  /**
   * Returns the weapon definition for the current weapon.
   */
  getWeaponDef(): WeaponDef {
    return WEAPON_DEFS[this.currentWeapon];
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  private spawnProjectile(
    _scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    angleDeg: number,
    speed: number,
    piercing: boolean,
    damage: number,
    color: number,
    width: number,
  ): void {
    const projectile = group.create(x, y, 'player-projectile') as
      Phaser.Physics.Arcade.Sprite | undefined;

    if (!projectile) return;

    projectile.setDisplaySize(width, 6);
    projectile.setData('piercing', piercing);
    projectile.setData('damage', damage);
    projectile.setData('color', color);

    // Convert angle from degrees to radians and calculate velocity
    const angleRad = Phaser.Math.DegToRad(angleDeg);
    const vx = Math.cos(angleRad) * speed;
    const vy = Math.sin(angleRad) * speed;

    const body = projectile.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.setVelocity(vx, vy);
    }
  }
}

/** Singleton instance of WeaponManager */
export const weaponManager = WeaponManager.getInstance();
export default weaponManager;
export { WeaponManager };
