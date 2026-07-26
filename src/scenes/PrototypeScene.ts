import Phaser from 'phaser';

type GamePhase = 'ready' | 'playing' | 'ended';

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;

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

  private phase: GamePhase = 'ready';
  private score = 0;
  private timeRemaining = 60;
  private lastFireTime = 0;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;

  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;

  private readonly PLAYER_SPEED = 250;
  private readonly PROJECTILE_SPEED = 500;
  private readonly FIRE_COOLDOWN = 250;
  private readonly GAME_DURATION = 60;
  private readonly BASE_SPAWN_INTERVAL = 900;
  private readonly MIN_SPAWN_INTERVAL = 300;

  constructor() {
    super({ key: 'PrototypeScene' });
  }

  preload(): void {
    this.createTextures();
  }

  create(): void {
    this.phase = 'ready';
    this.score = 0;
    this.timeRemaining = this.GAME_DURATION;
    this.lastFireTime = 0;

    this.setupInput();
    this.setupGroups();
    this.setupPlayer();
    this.setupHUD();
    this.showReadyScreen();
  }

  override update(_time: number, delta: number): void {
    if (this.phase === 'ready') {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.startGame();
      }
      return;
    }

    if (this.phase === 'ended') {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }
      return;
    }

    this.handleMovement(delta);
    this.handleShooting();
    this.cleanOffscreen();
  }

  private createTextures(): void {
    // Player: cyan rectangle
    const pg = this.make.graphics({ x: 0, y: 0 });
    pg.fillStyle(0x00ffff);
    pg.fillRect(0, 0, 32, 32);
    pg.generateTexture('player', 32, 32);
    pg.destroy();

    // Enemy: red rectangle
    const eg = this.make.graphics({ x: 0, y: 0 });
    eg.fillStyle(0xff3333);
    eg.fillRect(0, 0, 28, 28);
    eg.generateTexture('enemy', 28, 28);
    eg.destroy();

    // Projectile: yellow rectangle
    const prg = this.make.graphics({ x: 0, y: 0 });
    prg.fillStyle(0xffff00);
    prg.fillRect(0, 0, 6, 14);
    prg.generateTexture('projectile', 6, 14);
    prg.destroy();
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.restartKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  private setupGroups(): void {
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
  }

  private setupPlayer(): void {
    this.player = this.physics.add.image(480, 480, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setVisible(false);
  }

  private setupHUD(): void {
    this.scoreText = this.add
      .text(16, 16, '', { fontSize: '18px', color: '#ffffff' })
      .setDepth(10)
      .setVisible(false);

    this.timerText = this.add
      .text(944, 16, '', { fontSize: '18px', color: '#ffffff' })
      .setOrigin(1, 0)
      .setDepth(10)
      .setVisible(false);

    this.messageText = this.add
      .text(480, 200, '', { fontSize: '36px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(10);

    this.subtitleText = this.add
      .text(480, 280, '', { fontSize: '18px', color: '#aaaaaa' })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private showReadyScreen(): void {
    this.messageText.setText('CHRONO DEFENDER').setColor('#00ffff');
    this.subtitleText.setText(
      [
        'Move: Arrow Keys or WASD',
        'Shoot: Space',
        'Survive for 60 seconds',
        '',
        'Press Enter to start',
      ].join('\n'),
    );
  }

  private startGame(): void {
    this.phase = 'playing';
    this.player.setVisible(true);
    this.messageText.setVisible(false);
    this.subtitleText.setVisible(false);
    this.scoreText.setVisible(true);
    this.timerText.setVisible(true);
    this.updateHUD();

    this.setupCollisions();
    this.startSpawning();
    this.startCountdown();
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this
        .onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
  }

  private startSpawning(): void {
    const interval = this.getCurrentSpawnInterval();
    this.spawnTimer = this.time.addEvent({
      delay: interval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: false,
    });
  }

  private scheduleNextSpawn(): void {
    if (this.phase !== 'playing') return;
    const interval = this.getCurrentSpawnInterval();
    this.spawnTimer = this.time.addEvent({
      delay: interval,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: false,
    });
  }

  private getCurrentSpawnInterval(): number {
    const elapsed = this.GAME_DURATION - this.timeRemaining;
    const progress = elapsed / this.GAME_DURATION;
    const interval =
      this.BASE_SPAWN_INTERVAL -
      (this.BASE_SPAWN_INTERVAL - this.MIN_SPAWN_INTERVAL) * progress;
    return Math.max(interval, this.MIN_SPAWN_INTERVAL);
  }

  private spawnEnemy(): void {
    if (this.phase !== 'playing') return;

    const x = Phaser.Math.Between(30, 930);
    const enemy = this.enemies.create(
      x,
      -20,
      'enemy',
    ) as Phaser.Physics.Arcade.Image;
    const speed = Phaser.Math.Between(100, 190);
    enemy.setVelocityY(speed);

    this.scheduleNextSpawn();
  }

  private startCountdown(): void {
    this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      repeat: this.GAME_DURATION - 1,
    });
  }

  private tickTimer(): void {
    if (this.phase !== 'playing') return;

    this.timeRemaining = Math.max(0, this.timeRemaining - 1);
    this.updateHUD();

    if (this.timeRemaining <= 0) {
      this.endGame(true);
    }
  }

  private handleMovement(delta: number): void {
    const speed = this.PLAYER_SPEED;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += speed;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      const factor = Math.SQRT1_2;
      vx *= factor;
      vy *= factor;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    // Keep in bounds (delta-based position would also work but velocity + collideWorldBounds handles it)
    void delta;
  }

  private handleShooting(): void {
    const now = this.time.now;
    if (this.spaceKey.isDown && now - this.lastFireTime >= this.FIRE_COOLDOWN) {
      this.lastFireTime = now;
      const projectile = this.projectiles.create(
        this.player.x,
        this.player.y - 20,
        'projectile',
      ) as Phaser.Physics.Arcade.Image;
      projectile.setVelocityY(-this.PROJECTILE_SPEED);
    }
  }

  private cleanOffscreen(): void {
    for (const proj of this.projectiles.getChildren()) {
      const img = proj as Phaser.Physics.Arcade.Image;
      if (img.y < -20) {
        img.destroy();
      }
    }

    for (const enemy of this.enemies.getChildren()) {
      const img = enemy as Phaser.Physics.Arcade.Image;
      if (img.y > 560) {
        this.endGame(false);
        return;
      }
    }
  }

  private onProjectileHitEnemy(
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing') return;

    (projectile as Phaser.Physics.Arcade.Image).destroy();
    (enemy as Phaser.Physics.Arcade.Image).destroy();
    this.score += 100;
    this.updateHUD();
  }

  private onEnemyHitPlayer(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    if (this.phase !== 'playing') return;
    this.endGame(false);
  }

  private endGame(survived: boolean): void {
    if (this.phase === 'ended') return;
    this.phase = 'ended';

    // Stop all movement
    this.physics.pause();
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
    this.time.removeAllEvents();

    // Show result
    if (survived) {
      this.messageText
        .setText('TIME DEFENDED')
        .setColor('#00ff88')
        .setVisible(true);
    } else {
      this.messageText
        .setText('TIMELINE COLLAPSED')
        .setColor('#ff3333')
        .setVisible(true);
    }

    this.subtitleText
      .setText(`Score: ${this.score}\n\nPress R to restart`)
      .setColor('#ffffff')
      .setVisible(true);
  }

  private updateHUD(): void {
    this.scoreText.setText(`Score: ${this.score}`);
    this.timerText.setText(`Time: ${this.timeRemaining}s`);
  }
}
