import Phaser from 'phaser';

import { audioManager } from '../systems/AudioManager';

type GamePhase = 'ready' | 'playing' | 'ended';
type UpgradeSlot = 'THRUST' | 'MISSILE' | 'SPLIT' | 'BEAM' | 'ECHO' | 'SHIELD';

const UPGRADES: UpgradeSlot[] = [
  'THRUST',
  'MISSILE',
  'SPLIT',
  'BEAM',
  'ECHO',
  'SHIELD',
];

export class PrototypeScene extends Phaser.Scene {
  private phase: GamePhase = 'ready';
  private score = 0;
  private lives = 3;
  private upgradeIndex = 0;
  private elapsed = 0;
  private bossSpawned = false;

  // Upgrades state
  private hasThrust = false;
  private hasSplit = false;
  private hasShield = false;

  // Player
  private player!: Phaser.Physics.Arcade.Image;
  private invulnerable = false;
  private invulnTimer: Phaser.Time.TimerEvent | null = null;
  private flickerTimer: Phaser.Time.TimerEvent | null = null;

  // Groups
  private playerShots!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  private shards!: Phaser.Physics.Arcade.Group;

  // Echo drone
  private echoDrone: Phaser.Physics.Arcade.Image | null = null;
  private posHistory: { x: number; y: number }[] = [];

  // Shield visual
  private shieldGraphic: Phaser.GameObjects.Arc | null = null;

  // Boss
  private boss: Phaser.Physics.Arcade.Image | null = null;
  private bossCore: Phaser.Physics.Arcade.Image | null = null;
  private bossHp = 0;
  private bossMaxHp = 30;
  private bossCoreExposed = false;
  private bossCoreTimer: Phaser.Time.TimerEvent | null = null;
  private bossFireTimer: Phaser.Time.TimerEvent | null = null;
  private bossHpBar: Phaser.GameObjects.Graphics | null = null;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private pausePKey!: Phaser.Input.Keyboard.Key;
  private pauseEscKey!: Phaser.Input.Keyboard.Key;
  private muteKey!: Phaser.Input.Keyboard.Key;

  private lastFireTime = 0;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private upgradeTexts: Phaser.GameObjects.Text[] = [];
  private messageText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private muteIndicator!: Phaser.GameObjects.Text;

  // Stars
  private stars: { obj: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // Constants
  private readonly PLAYER_SPEED = 250;
  private readonly SHOT_SPEED = 600;
  private readonly FIRE_COOLDOWN = 220;
  private readonly COMBAT_DURATION = 65000;

  constructor() {
    super({ key: 'PrototypeScene' });
  }

  preload(): void {
    this.createTextures();
  }

  create(): void {
    this.phase = 'ready';
    this.score = 0;
    this.lives = 3;
    this.upgradeIndex = 0;
    this.elapsed = 0;
    this.bossSpawned = false;
    this.hasThrust = false;
    this.hasSplit = false;
    this.hasShield = false;
    this.invulnerable = false;
    this.lastFireTime = 0;
    this.posHistory = [];
    this.echoDrone = null;
    this.shieldGraphic = null;
    this.boss = null;
    this.bossCore = null;
    this.bossHp = 0;
    this.bossCoreExposed = false;
    this.bossHpBar = null;

    this.setupInput();
    this.createStarfield();
    this.setupGroups();
    this.setupPlayer();
    this.setupHUD();
    this.showReadyScreen();
  }

  override update(_time: number, delta: number): void {
    this.scrollStars(delta);

    // Mute toggle works in all phases
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      audioManager.toggleMute();
      this.updateMuteIndicator();
    }

    if (this.phase === 'ready') {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) this.startGame();
      return;
    }
    if (this.phase === 'ended') {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) this.scene.restart();
      return;
    }

    this.elapsed += delta;
    this.handlePause();
    this.handleMovement();
    this.handleShooting();
    this.handleUpgradeActivation();
    this.updateEchoDrone();
    this.updateShieldPosition();
    this.cleanOffscreen();
    this.checkBossSpawn();
    this.updateBoss();
  }

  private createTextures(): void {
    this.createPlayerTexture();
    this.createPlayerShotTexture();
    this.createEnemySmallTexture();
    this.createEnemyHeavyTexture();
    this.createEnemyShotTexture();
    this.createChronoShardTexture();
    this.createEchoDroneTexture();
    this.createBossTexture();
    this.createBossCoreTexture();
  }

  private createPlayerTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const w = 48;
    const h = 32;
    // Engine exhausts (glow)
    g.fillStyle(0x00ffff, 0.4);
    g.fillCircle(4, 12, 5);
    g.fillCircle(4, 20, 5);
    g.fillStyle(0x00ffff, 0.8);
    g.fillCircle(4, 12, 3);
    g.fillCircle(4, 20, 3);
    // Main hull
    g.fillStyle(0x1db8ff);
    g.fillTriangle(8, 4, 44, 16, 8, 28);
    // Fuselage center
    g.fillStyle(0x7eebff);
    g.fillTriangle(14, 8, 44, 16, 14, 24);
    // Nose point
    g.fillStyle(0xffffff);
    g.fillTriangle(40, 14, 48, 16, 40, 18);
    // Cockpit canopy
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(28, 16, 4);
    g.fillStyle(0x88ddff, 0.6);
    g.fillCircle(28, 16, 3);
    // Wing accents
    g.lineStyle(1, 0x00ffff, 0.8);
    g.lineBetween(10, 4, 30, 12);
    g.lineBetween(10, 28, 30, 20);
    // Rear stabilizers
    g.fillStyle(0x1db8ff);
    g.fillTriangle(6, 0, 14, 4, 6, 4);
    g.fillTriangle(6, 28, 14, 28, 6, 32);
    g.generateTexture('player', w, h);
    g.destroy();
  }

  private createPlayerShotTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Outer glow
    g.fillStyle(0x0066ff, 0.3);
    g.fillEllipse(10, 5, 20, 10);
    // Middle energy
    g.fillStyle(0x00ccff, 0.7);
    g.fillEllipse(10, 5, 14, 6);
    // Core
    g.fillStyle(0xffffff);
    g.fillEllipse(12, 5, 8, 4);
    g.generateTexture('player-shot', 20, 10);
    g.destroy();
  }

  private createEnemySmallTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Body
    g.fillStyle(0x331111);
    g.fillTriangle(0, 12, 24, 4, 24, 20);
    // Wings
    g.fillStyle(0xcc2233);
    g.fillTriangle(8, 12, 24, 2, 24, 8);
    g.fillTriangle(8, 12, 24, 16, 24, 22);
    // Engine glow
    g.fillStyle(0xff6600, 0.8);
    g.fillCircle(22, 12, 3);
    // Cockpit
    g.fillStyle(0xff4444);
    g.fillCircle(10, 12, 2);
    g.generateTexture('enemy-small', 24, 24);
    g.destroy();
  }

  private createEnemyHeavyTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const cx = 22;
    const cy = 22;
    // Hexagonal armored body
    g.fillStyle(0x2a1133);
    g.fillPoints(
      [
        { x: cx - 20, y: cy },
        { x: cx - 10, y: cy - 16 },
        { x: cx + 10, y: cy - 16 },
        { x: cx + 20, y: cy },
        { x: cx + 10, y: cy + 16 },
        { x: cx - 10, y: cy + 16 },
      ],
      true,
    );
    // Inner armor
    g.fillStyle(0x551155);
    g.fillPoints(
      [
        { x: cx - 14, y: cy },
        { x: cx - 7, y: cy - 11 },
        { x: cx + 7, y: cy - 11 },
        { x: cx + 14, y: cy },
        { x: cx + 7, y: cy + 11 },
        { x: cx - 7, y: cy + 11 },
      ],
      true,
    );
    // Glowing vents
    g.fillStyle(0xff44cc, 0.9);
    g.fillCircle(cx - 8, cy - 6, 2);
    g.fillCircle(cx - 8, cy + 6, 2);
    g.fillCircle(cx + 8, cy, 2);
    // Engine
    g.fillStyle(0xff6600, 0.7);
    g.fillCircle(cx + 18, cy, 4);
    g.generateTexture('enemy-heavy', 44, 44);
    g.destroy();
  }

  private createEnemyShotTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x8800cc, 0.4);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xcc44ff, 0.8);
    g.fillCircle(6, 6, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 6, 2);
    g.generateTexture('enemy-shot', 12, 12);
    g.destroy();
  }

  private createChronoShardTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Outer glow
    g.fillStyle(0xff8800, 0.3);
    g.fillCircle(10, 10, 10);
    // Diamond shape
    g.fillStyle(0xffaa22);
    g.fillTriangle(10, 0, 20, 10, 10, 20);
    g.fillTriangle(10, 0, 0, 10, 10, 20);
    // Gold center
    g.fillStyle(0xffdd44);
    g.fillTriangle(10, 4, 16, 10, 10, 16);
    g.fillTriangle(10, 4, 4, 10, 10, 16);
    // White sparkle
    g.fillStyle(0xffffff);
    g.fillCircle(10, 10, 2);
    g.generateTexture('chrono-shard', 20, 20);
    g.destroy();
  }

  private createEchoDroneTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Energy glow
    g.fillStyle(0x2244ff, 0.3);
    g.fillCircle(12, 12, 12);
    // Wings
    g.fillStyle(0x3366cc);
    g.fillTriangle(4, 12, 12, 6, 12, 12);
    g.fillTriangle(4, 12, 12, 12, 12, 18);
    g.fillTriangle(20, 12, 12, 6, 12, 12);
    g.fillTriangle(20, 12, 12, 12, 12, 18);
    // Core
    g.fillStyle(0x4488ff);
    g.fillCircle(12, 12, 6);
    g.fillStyle(0xaaccff);
    g.fillCircle(12, 12, 3);
    // Highlight
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(10, 10, 1.5);
    g.generateTexture('echo-drone', 24, 24);
    g.destroy();
  }

  private createBossTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const w = 100;
    const h = 140;
    // Main armored body
    g.fillStyle(0x1a1a2e);
    g.fillRect(10, 20, 80, 100);
    // Segmented armor panels
    g.fillStyle(0x2d2d44);
    g.fillRect(14, 24, 72, 20);
    g.fillRect(14, 48, 72, 20);
    g.fillRect(14, 72, 72, 20);
    g.fillRect(14, 96, 72, 20);
    // Panel edges
    g.lineStyle(1, 0x4444aa, 0.6);
    g.lineBetween(14, 44, 86, 44);
    g.lineBetween(14, 68, 86, 68);
    g.lineBetween(14, 92, 86, 92);
    // Side cannons
    g.fillStyle(0x333355);
    g.fillRect(0, 30, 14, 16);
    g.fillRect(0, 94, 14, 16);
    g.fillStyle(0xff4444, 0.8);
    g.fillCircle(4, 38, 3);
    g.fillCircle(4, 102, 3);
    // Front edge
    g.fillStyle(0x3333aa);
    g.fillRect(6, 20, 4, 100);
    // Core housing (dark circle where core appears)
    g.fillStyle(0x111122);
    g.fillCircle(50, 70, 18);
    g.lineStyle(2, 0x6666cc, 0.5);
    g.strokeCircle(50, 70, 18);
    // Animated lights (static representation)
    g.fillStyle(0x00ffcc, 0.7);
    g.fillCircle(30, 30, 2);
    g.fillCircle(70, 30, 2);
    g.fillCircle(30, 110, 2);
    g.fillCircle(70, 110, 2);
    // Top/bottom armor points
    g.fillStyle(0x2d2d44);
    g.fillTriangle(30, 20, 70, 20, 50, 8);
    g.fillTriangle(30, 120, 70, 120, 50, 132);
    g.generateTexture('boss', w, h);
    g.destroy();
  }

  private createBossCoreTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    // Outer pulsing ring
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(16, 16, 16);
    // Energy ring
    g.lineStyle(2, 0xffcc00, 0.8);
    g.strokeCircle(16, 16, 12);
    // Core glow
    g.fillStyle(0xffaa00, 0.8);
    g.fillCircle(16, 16, 10);
    // Inner bright core
    g.fillStyle(0xffff44);
    g.fillCircle(16, 16, 6);
    // White hot center
    g.fillStyle(0xffffff);
    g.fillCircle(16, 16, 3);
    g.generateTexture('boss-core', 32, 32);
    g.destroy();
  }

  private setupInput(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.restartKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.shiftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.pausePKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseEscKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.muteKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  private createStarfield(): void {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, 960);
      const y = Phaser.Math.Between(0, 540);
      const layer = Phaser.Math.Between(0, 2);
      const size = layer === 0 ? 1 : layer === 1 ? 2 : 3;
      const speed = 40 + layer * 50;
      const alpha = 0.3 + layer * 0.25;
      const rect = this.add
        .rectangle(x, y, size, size, 0xffffff, alpha)
        .setDepth(0);
      this.stars.push({ obj: rect, speed });
    }
  }

  private scrollStars(delta: number): void {
    const dt = delta / 1000;
    for (const star of this.stars) {
      star.obj.x -= star.speed * dt;
      if (star.obj.x < -5) star.obj.x = 965;
    }
  }

  private setupGroups(): void {
    this.playerShots = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyShots = this.physics.add.group();
    this.shards = this.physics.add.group();
  }

  private setupPlayer(): void {
    this.player = this.physics.add.image(140, 270, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    this.player.setVisible(false);
  }

  private setupHUD(): void {
    this.scoreText = this.add
      .text(16, 16, '', { fontSize: '16px', color: '#ffffff' })
      .setDepth(10)
      .setVisible(false);
    this.livesText = this.add
      .text(16, 38, '', { fontSize: '16px', color: '#ffffff' })
      .setDepth(10)
      .setVisible(false);
    this.stageText = this.add
      .text(480, 16, 'FRACTURED ORBIT', { fontSize: '14px', color: '#88aacc' })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setVisible(false);
    this.messageText = this.add
      .text(480, 180, '', { fontSize: '32px', color: '#00ffff' })
      .setOrigin(0.5)
      .setDepth(10);
    this.subtitleText = this.add
      .text(480, 260, '', { fontSize: '16px', color: '#aaaaaa' })
      .setOrigin(0.5)
      .setDepth(10);

    // Upgrade rail
    this.upgradeTexts = [];
    for (let i = 0; i < UPGRADES.length; i++) {
      const x = 200 + i * 100;
      const label = UPGRADES[i] ?? '';
      const t = this.add
        .text(x, 520, label, { fontSize: '12px', color: '#666666' })
        .setOrigin(0.5)
        .setDepth(10)
        .setVisible(false);
      this.upgradeTexts.push(t);
    }

    // Mute indicator (top-right)
    this.muteIndicator = this.add
      .text(944, 16, '', { fontSize: '14px', color: '#ff6666' })
      .setOrigin(1, 0)
      .setDepth(10);
    this.updateMuteIndicator();
  }

  private showReadyScreen(): void {
    this.messageText.setText('CHRONO DEFENDER').setColor('#00ffff');
    this.subtitleText.setText(
      [
        'A fractured timeline is consuming the stars.',
        '',
        'Move: Arrow Keys or WASD',
        'Fire: Space',
        'Activate Upgrade: Shift',
        'Mute: M',
        '',
        'Press Enter to Start',
      ].join('\n'),
    );
    audioManager.playMenuMusic();
  }

  private startGame(): void {
    this.phase = 'playing';
    this.player.setVisible(true);
    this.messageText.setVisible(false);
    this.subtitleText.setVisible(false);
    this.scoreText.setVisible(true);
    this.livesText.setVisible(true);
    this.stageText.setVisible(true);
    for (const t of this.upgradeTexts) t.setVisible(true);
    this.updateHUD();
    this.setupCollisions();
    this.startSpawning();
    audioManager.resumeContext();
    audioManager.playStartGame();
    audioManager.playGameMusic();
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.playerShots,
      this.enemies,
      this.onShotHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this
        .onEnemyHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.enemyShots,
      this
        .onEnemyShotHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.shards,
      this.onCollectShard as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.playerShots,
      this.bossCore ? [this.bossCore] : [],
      this
        .onShotHitBossCore as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  private startSpawning(): void {
    this.spawnTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnWave,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnWave(): void {
    if (this.phase !== 'playing' || this.bossSpawned) return;
    const progress = Math.min(this.elapsed / this.COMBAT_DURATION, 1);
    const count = 1 + Math.floor(progress * 3);
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 300, () => this.spawnEnemy(progress));
    }
  }

  private spawnEnemy(progress: number): void {
    if (this.phase !== 'playing' || this.bossSpawned) return;
    const y = Phaser.Math.Between(40, 500);
    const isHeavy = Math.random() < progress * 0.4;
    const key = isHeavy ? 'enemy-heavy' : 'enemy-small';
    const enemy = this.enemies.create(
      980,
      y,
      key,
    ) as Phaser.Physics.Arcade.Image;
    enemy.setData('hp', isHeavy ? 3 : 1);
    enemy.setData('heavy', isHeavy);
    const speed = isHeavy ? -80 : -(120 + Math.random() * 60);
    enemy.setVelocityX(speed);
    if (!isHeavy) {
      enemy.setData('sineBase', y);
      enemy.setData('sineOffset', Math.random() * Math.PI * 2);
    }
    if (isHeavy && Math.random() < 0.5) {
      this.time.delayedCall(800, () => {
        if (enemy.active && this.phase === 'playing') {
          const shot = this.enemyShots.create(
            enemy.x - 16,
            enemy.y,
            'enemy-shot',
          ) as Phaser.Physics.Arcade.Image;
          shot.setVelocityX(-200);
        }
      });
    }
  }

  private handlePause(): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.pausePKey) ||
      Phaser.Input.Keyboard.JustDown(this.pauseEscKey)
    ) {
      // Prevent duplicate launches
      if (!this.scene.isActive('PauseScene')) {
        audioManager.playPause();
        this.scene.pause();
        this.scene.launch('PauseScene');
      }
    }
  }

  private handleMovement(): void {
    const speed = this.hasThrust ? 360 : this.PLAYER_SPEED;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += speed;
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

    // Thruster particles when moving
    if ((vx !== 0 || vy !== 0) && Math.random() < 0.4) {
      this.spawnThrusterParticle();
    }

    // Record position for echo drone
    this.posHistory.push({ x: this.player.x, y: this.player.y });
    if (this.posHistory.length > 20) this.posHistory.shift();
  }

  private handleShooting(): void {
    if (!this.spaceKey.isDown) return;
    const now = this.time.now;
    if (now - this.lastFireTime < this.FIRE_COOLDOWN) return;
    this.lastFireTime = now;
    this.firePlayerShot(this.player.x + 14, this.player.y);
    if (this.hasSplit) {
      this.firePlayerShot(this.player.x + 14, this.player.y - 10);
      this.firePlayerShot(this.player.x + 14, this.player.y + 10);
    }
    // Echo drone fires too
    if (this.echoDrone && this.echoDrone.active) {
      this.firePlayerShot(this.echoDrone.x + 10, this.echoDrone.y);
      audioManager.playEchoDroneAttack();
    }
  }

  private firePlayerShot(x: number, y: number): void {
    const shot = this.playerShots.create(
      x,
      y,
      'player-shot',
    ) as Phaser.Physics.Arcade.Image;
    shot.setVelocityX(this.SHOT_SPEED);
    shot.setDepth(3);
    audioManager.playLaser();
  }

  private handleUpgradeActivation(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.shiftKey)) return;
    if (this.upgradeIndex === 0) return;
    const slot = UPGRADES[(this.upgradeIndex - 1) % UPGRADES.length];
    if (!slot) return;
    this.activateUpgrade(slot);
    this.upgradeIndex = 0;
    this.updateUpgradeRail();
  }

  private activateUpgrade(slot: UpgradeSlot): void {
    switch (slot) {
      case 'THRUST':
        this.hasThrust = true;
        break;
      case 'SPLIT':
        this.hasSplit = true;
        break;
      case 'ECHO':
        this.spawnEchoDrone();
        break;
      case 'SHIELD':
        this.activateShield();
        break;
      case 'MISSILE':
        this.hasThrust = true;
        break; // Simplified fallback
      case 'BEAM':
        this.hasSplit = true;
        break; // Simplified fallback
    }
  }

  private spawnEchoDrone(): void {
    if (this.echoDrone && this.echoDrone.active) return;
    this.echoDrone = this.physics.add.image(
      this.player.x - 40,
      this.player.y,
      'echo-drone',
    );
    this.echoDrone.setDepth(4);
  }

  private updateEchoDrone(): void {
    if (!this.echoDrone || !this.echoDrone.active) return;
    const target =
      this.posHistory.length > 10
        ? this.posHistory[this.posHistory.length - 10]
        : this.posHistory[0];
    if (target) {
      this.echoDrone.x = Phaser.Math.Linear(
        this.echoDrone.x,
        target.x - 40,
        0.08,
      );
      this.echoDrone.y = Phaser.Math.Linear(this.echoDrone.y, target.y, 0.08);
    }
  }

  private activateShield(): void {
    if (this.hasShield) return;
    this.hasShield = true;
    this.shieldGraphic = this.add.circle(
      this.player.x,
      this.player.y,
      26,
      0x2266ff,
      0.2,
    );
    this.shieldGraphic.setStrokeStyle(3, 0x44aaff);
    this.shieldGraphic.setDepth(6);
    // Pulse animation
    this.tweens.add({
      targets: this.shieldGraphic,
      alpha: { from: 0.15, to: 0.4 },
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 0.95, to: 1.05 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private updateShieldPosition(): void {
    if (this.shieldGraphic && this.hasShield) {
      this.shieldGraphic.setPosition(this.player.x, this.player.y);
    }
  }

  private removeShield(): void {
    this.hasShield = false;
    if (this.shieldGraphic) {
      this.shieldGraphic.destroy();
      this.shieldGraphic = null;
    }
  }

  private onShotHitEnemy(
    shot: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing') return;
    const s = shot as Phaser.Physics.Arcade.Image;
    const e = enemy as Phaser.Physics.Arcade.Image;
    s.destroy();
    const hp = (e.getData('hp') as number) - 1;
    if (hp <= 0) {
      const isHeavy = e.getData('heavy') as boolean;
      this.score += isHeavy ? 250 : 100;
      if (Math.random() < 0.3) this.dropShard(e.x, e.y);
      this.spawnExplosion(e.x, e.y, isHeavy ? 1.5 : 1.0);
      audioManager.playEnemyDestroyed();
      e.destroy();
    } else {
      e.setData('hp', hp);
      e.setTint(0xffffff);
      this.time.delayedCall(60, () => {
        if (e.active) e.clearTint();
      });
    }
    this.updateHUD();
  }

  private dropShard(x: number, y: number): void {
    const shard = this.shards.create(
      x,
      y,
      'chrono-shard',
    ) as Phaser.Physics.Arcade.Image;
    shard.setVelocityX(-60);
    shard.setDepth(3);
  }

  private onCollectShard(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    shard: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing') return;
    (shard as Phaser.Physics.Arcade.Image).destroy();
    this.upgradeIndex = Math.min(this.upgradeIndex + 1, UPGRADES.length);
    this.updateUpgradeRail();
    audioManager.playUpgradeCollected();
  }

  private onEnemyHitPlayer(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing' || this.invulnerable) return;
    (enemy as Phaser.Physics.Arcade.Image).destroy();
    this.damagePlayer();
  }

  private onEnemyShotHitPlayer(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    shot: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing' || this.invulnerable) return;
    (shot as Phaser.Physics.Arcade.Image).destroy();
    this.damagePlayer();
  }

  private damagePlayer(): void {
    if (this.hasShield) {
      this.removeShield();
      audioManager.playPlayerHit();
      return;
    }
    this.lives--;
    this.hasThrust = false;
    this.hasSplit = false;
    this.removeShield();
    if (this.echoDrone) {
      this.echoDrone.destroy();
      this.echoDrone = null;
    }
    this.upgradeIndex = 0;
    this.updateUpgradeRail();
    this.updateHUD();
    this.cameras.main.shake(150, 0.008);

    if (this.lives <= 0) {
      audioManager.playPlayerDeath();
      this.endGame(false);
      return;
    }

    audioManager.playPlayerHit();

    // Invulnerability
    this.invulnerable = true;
    this.flashPlayerDamage();
    this.player.setPosition(80, 270);
    let flickerState = true;
    this.flickerTimer = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        flickerState = !flickerState;
        this.player.setAlpha(flickerState ? 1 : 0.3);
      },
    });
    this.invulnTimer = this.time.delayedCall(2000, () => {
      this.invulnerable = false;
      this.player.setAlpha(1);
      if (this.flickerTimer) {
        this.flickerTimer.destroy();
        this.flickerTimer = null;
      }
    });
  }

  private cleanOffscreen(): void {
    for (const obj of this.playerShots.getChildren()) {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x > 980) img.destroy();
    }
    for (const obj of this.enemies.getChildren()) {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x < -40) img.destroy();
      // Sine wave for scouts
      if (!img.getData('heavy') && img.active) {
        const base = img.getData('sineBase') as number;
        const offset = img.getData('sineOffset') as number;
        img.y = base + Math.sin(this.time.now / 500 + offset) * 30;
      }
    }
    for (const obj of this.enemyShots.getChildren()) {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x < -20) img.destroy();
    }
    for (const obj of this.shards.getChildren()) {
      const img = obj as Phaser.Physics.Arcade.Image;
      if (img.x < -20) img.destroy();
    }
  }

  private checkBossSpawn(): void {
    if (this.bossSpawned || this.elapsed < this.COMBAT_DURATION) return;
    this.bossSpawned = true;
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
    this.stageText.setText('THE EPOCH WARDEN');
    this.spawnBoss();
  }

  private spawnBoss(): void {
    this.bossHp = this.bossMaxHp;
    this.boss = this.physics.add.image(1020, 270, 'boss');
    this.boss.setDepth(5);
    this.boss.setImmovable(true);
    audioManager.playBossMusic();

    // Move boss into position
    this.tweens.add({
      targets: this.boss,
      x: 850,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.startBossBehavior();
      },
    });
  }

  private startBossBehavior(): void {
    if (!this.boss) return;
    // Vertical patrol
    this.tweens.add({
      targets: this.boss,
      y: 150,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Core expose cycle
    this.bossCore = this.physics.add.image(
      this.boss.x - 20,
      this.boss.y,
      'boss-core',
    );
    this.bossCore.setDepth(6);
    this.bossCore.setVisible(false);
    this.physics.add.overlap(
      this.playerShots,
      this.bossCore,
      this
        .onShotHitBossCore as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.bossCoreTimer = this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.toggleBossCore(),
    });

    // Boss firing
    this.bossFireTimer = this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => this.bossFireShot(),
    });

    // Health bar
    this.bossHpBar = this.add.graphics().setDepth(10);
    this.updateBossHpBar();
  }

  private toggleBossCore(): void {
    this.bossCoreExposed = !this.bossCoreExposed;
    if (this.bossCore) this.bossCore.setVisible(this.bossCoreExposed);
  }

  private bossFireShot(): void {
    if (this.phase !== 'playing' || !this.boss || !this.boss.active) return;
    const shot = this.enemyShots.create(
      this.boss.x - 40,
      this.boss.y,
      'enemy-shot',
    ) as Phaser.Physics.Arcade.Image;
    shot.setVelocity(-250, Phaser.Math.Between(-50, 50));
  }

  private updateBoss(): void {
    if (!this.boss || !this.bossCore) return;
    this.bossCore.setPosition(this.boss.x - 20, this.boss.y);
  }

  private onShotHitBossCore(
    shot: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _core: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing' || !this.bossCoreExposed) return;
    (shot as Phaser.Physics.Arcade.Image).destroy();
    this.bossHp--;
    this.score += 50;
    this.updateHUD();
    this.updateBossHpBar();
    audioManager.playBossDamaged();
    if (this.bossHp <= 0) {
      this.defeatBoss();
    }
  }

  private updateBossHpBar(): void {
    if (!this.bossHpBar) return;
    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(0x333333);
    this.bossHpBar.fillRect(700, 30, 240, 12);
    const pct = Math.max(0, this.bossHp / this.bossMaxHp);
    this.bossHpBar.fillStyle(0xff4444);
    this.bossHpBar.fillRect(700, 30, 240 * pct, 12);
  }

  private defeatBoss(): void {
    this.score += 2000;
    audioManager.playBossDefeated();
    if (this.boss) {
      this.spawnExplosion(this.boss.x, this.boss.y, 3.0);
      this.spawnExplosion(this.boss.x - 30, this.boss.y - 20, 2.0);
      this.spawnExplosion(this.boss.x + 20, this.boss.y + 30, 2.0);
      this.cameras.main.shake(400, 0.01);
      this.boss.destroy();
      this.boss = null;
    }
    if (this.bossCore) {
      this.bossCore.destroy();
      this.bossCore = null;
    }
    if (this.bossCoreTimer) {
      this.bossCoreTimer.destroy();
    }
    if (this.bossFireTimer) {
      this.bossFireTimer.destroy();
    }
    if (this.bossHpBar) {
      this.bossHpBar.destroy();
      this.bossHpBar = null;
    }
    this.endGame(true);
  }

  private endGame(victory: boolean): void {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    this.physics.pause();
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
    if (this.invulnTimer) {
      this.invulnTimer.destroy();
      this.invulnTimer = null;
    }
    if (this.flickerTimer) {
      this.flickerTimer.destroy();
      this.flickerTimer = null;
    }
    this.player.setAlpha(1);
    this.time.removeAllEvents();

    if (victory) {
      this.messageText
        .setText('TIMELINE RESTORED')
        .setColor('#00ff88')
        .setVisible(true);
      audioManager.playVictoryMusic();
    } else {
      this.messageText
        .setText('TIMELINE COLLAPSED')
        .setColor('#ff3333')
        .setVisible(true);
      audioManager.playGameOverMusic();
    }
    this.subtitleText
      .setText(`Final Score: ${this.score}\n\nPress R to Restart`)
      .setColor('#ffffff')
      .setVisible(true);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.livesText.setText(`Lives: ${'◆'.repeat(this.lives)}`);
    this.updateUpgradeRail();
    this.updateMuteIndicator();
  }

  private updateMuteIndicator(): void {
    if (this.muteIndicator) {
      this.muteIndicator.setText(audioManager.isMuted() ? 'MUTED [M]' : '');
    }
  }

  private updateUpgradeRail(): void {
    for (let i = 0; i < this.upgradeTexts.length; i++) {
      const t = this.upgradeTexts[i];
      if (!t) continue;
      if (i < this.upgradeIndex) {
        t.setColor('#ffaa22');
      } else if (i === this.upgradeIndex) {
        t.setColor('#ffffff');
      } else {
        t.setColor('#444444');
      }
    }
  }

  private spawnExplosion(x: number, y: number, scale: number): void {
    const colors = [0xffffff, 0xffff44, 0xff8800, 0xff4400];
    const particleCount = Math.floor(8 + scale * 4);

    // Flash ring
    const ring = this.add.circle(x, y, 6 * scale, 0xffffff, 0.7);
    ring.setDepth(9);
    this.tweens.add({
      targets: ring,
      scaleX: 3 * scale,
      scaleY: 3 * scale,
      alpha: 0,
      duration: 200,
      onComplete: () => ring.destroy(),
    });

    // Particles
    for (let i = 0; i < particleCount; i++) {
      const color = colors[i % colors.length] ?? 0xffffff;
      const size = (2 + Math.random() * 3) * scale;
      const particle = this.add.circle(x, y, size, color, 0.9);
      particle.setDepth(8);
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
      const dist = (20 + Math.random() * 30) * scale;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 250 + Math.random() * 250,
        onComplete: () => particle.destroy(),
      });
    }
  }

  /** Flash the player sprite red briefly to indicate damage. */
  private flashPlayerDamage(): void {
    this.player.setTint(0xff0000);
    this.time.delayedCall(100, () => {
      if (this.player.active) this.player.clearTint();
    });
  }

  /** Spawn a thruster particle behind the player for visual feedback. */
  private spawnThrusterParticle(): void {
    if (
      !this.player.active ||
      !this.player.visible ||
      this.phase !== 'playing'
    )
      return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.x === 0 && body.velocity.y === 0) return;

    const px = this.player.x - 18;
    const py = this.player.y + (Math.random() - 0.5) * 8;
    const colors = [0x00ffff, 0x0088ff, 0xffffff];
    const color = colors[Math.floor(Math.random() * colors.length)] ?? 0x00ffff;
    const particle = this.add.circle(px, py, 2, color, 0.6);
    particle.setDepth(2);
    this.tweens.add({
      targets: particle,
      x: px - 12 - Math.random() * 8,
      alpha: 0,
      scale: 0.3,
      duration: 150 + Math.random() * 100,
      onComplete: () => particle.destroy(),
    });
  }
}
