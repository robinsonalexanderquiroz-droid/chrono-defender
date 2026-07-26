/**
 * MenuScene - Main navigable menu for Chrono Defender.
 *
 * Provides keyboard-navigable access to START GAME, HIGH SCORES,
 * ACHIEVEMENTS, OPTIONS, and CONTROLS submenus.
 * Scene key: 'MenuScene'
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager';
import { saveManager } from '../systems/SaveManager';
import { achievementManager } from '../systems/AchievementManager';

/** Menu item identifiers */
type MenuItem =
  'START GAME' | 'HIGH SCORES' | 'ACHIEVEMENTS' | 'OPTIONS' | 'CONTROLS';

/** Active view state */
type ViewState =
  | 'root'
  | 'highscores'
  | 'achievements'
  | 'options'
  | 'controls'
  | 'clearConfirm';

/** Background color for the menu */
const BG_COLOR = 0x050a1a;

/** Neon cyan accent color */
const CYAN = '#00ffff';

/** White for unselected items */
const WHITE = '#ffffff';

/** Dim color for secondary text */
const DIM = '#888888';

/** Locked achievement color */
const LOCKED_COLOR = '#555555';

/** Unlocked achievement color */
const UNLOCKED_COLOR = '#00ff88';

export default class MenuScene extends Phaser.Scene {
  /** Root menu item labels */
  private readonly menuItems: MenuItem[] = [
    'START GAME',
    'HIGH SCORES',
    'ACHIEVEMENTS',
    'OPTIONS',
    'CONTROLS',
  ];

  /** Currently highlighted index in root menu */
  private selectedIndex = 0;

  /** Current view state */
  private viewState: ViewState = 'root';

  /** Title text object */
  private titleText: Phaser.GameObjects.Text | null = null;

  /** Container for root menu items */
  private menuContainer: Phaser.GameObjects.Container | null = null;

  /** Container for submenu content */
  private submenuContainer: Phaser.GameObjects.Container | null = null;

  /** Menu item text objects for highlighting */
  private menuTextObjects: Phaser.GameObjects.Text[] = [];

  /** Selector indicator ">" */
  private selectorText: Phaser.GameObjects.Text | null = null;

  /** Key objects to prevent duplicate registrations */
  private keyUp: Phaser.Input.Keyboard.Key | null = null;
  private keyDown: Phaser.Input.Keyboard.Key | null = null;
  private keyEnter: Phaser.Input.Keyboard.Key | null = null;
  private keyEscape: Phaser.Input.Keyboard.Key | null = null;
  private keyY: Phaser.Input.Keyboard.Key | null = null;
  private keyN: Phaser.Input.Keyboard.Key | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Reset state on scene restart
    this.selectedIndex = 0;
    this.viewState = 'root';
    this.menuTextObjects = [];

    // Dark background
    this.cameras.main.setBackgroundColor(BG_COLOR);

    const { width } = this.scale;

    // Title
    this.titleText = this.add
      .text(width / 2, 80, 'CHRONO DEFENDER', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Subtle y-oscillation tween on title
    this.tweens.add({
      targets: this.titleText,
      y: 90,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Build root menu
    this.menuContainer = this.add.container(0, 0).setDepth(5);
    this.buildRootMenu();

    // Submenu container (hidden initially)
    this.submenuContainer = this.add
      .container(0, 0)
      .setDepth(5)
      .setVisible(false);

    // Register keyboard input (remove first to prevent duplicates on restart)
    this.registerKeys();

    // Play menu music
    audioManager.playMenuMusic();
  }

  // ─── Key Registration ──────────────────────────────────────────────

  private registerKeys(): void {
    if (!this.input.keyboard) return;

    // Remove any previously registered keys to prevent duplication
    if (this.keyUp) this.input.keyboard.removeKey(this.keyUp);
    if (this.keyDown) this.input.keyboard.removeKey(this.keyDown);
    if (this.keyEnter) this.input.keyboard.removeKey(this.keyEnter);
    if (this.keyEscape) this.input.keyboard.removeKey(this.keyEscape);
    if (this.keyY) this.input.keyboard.removeKey(this.keyY);
    if (this.keyN) this.input.keyboard.removeKey(this.keyN);

    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.DOWN,
    );
    this.keyEnter = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.keyEscape = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    );
    this.keyY = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    this.keyUp.on('down', () => this.handleUp());
    this.keyDown.on('down', () => this.handleDown());
    this.keyEnter.on('down', () => this.handleEnter());
    this.keyEscape.on('down', () => this.handleEscape());
    this.keyY.on('down', () => this.handleY());
    this.keyN.on('down', () => this.handleN());
  }

  // ─── Root Menu ─────────────────────────────────────────────────────

  private buildRootMenu(): void {
    if (!this.menuContainer) return;
    this.menuContainer.removeAll(true);
    this.menuTextObjects = [];

    const { width, height } = this.scale;
    const startY = height * 0.35;
    const spacing = 50;

    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i]!;
      const y = startY + i * spacing;
      const color = i === this.selectedIndex ? CYAN : WHITE;

      const text = this.add
        .text(width / 2, y, item, {
          fontFamily: 'monospace',
          fontSize: '24px',
          color,
        })
        .setOrigin(0.5)
        .setDepth(6);

      this.menuTextObjects.push(text);
      this.menuContainer.add(text);
    }

    // Selector ">"
    this.updateSelector();

    // Footer hint
    const footer = this.add
      .text(width / 2, height - 40, 'Arrow Keys: Navigate | Enter: Select', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: DIM,
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.menuContainer.add(footer);
  }

  private updateSelector(): void {
    if (!this.menuContainer) return;

    // Remove old selector
    if (this.selectorText) {
      this.selectorText.destroy();
      this.selectorText = null;
    }

    const target = this.menuTextObjects[this.selectedIndex];
    if (!target) return;

    this.selectorText = this.add
      .text(target.x - target.width / 2 - 30, target.y, '>', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(7);

    this.menuContainer.add(this.selectorText);
  }

  private highlightSelected(): void {
    for (let i = 0; i < this.menuTextObjects.length; i++) {
      const text = this.menuTextObjects[i];
      if (text) {
        text.setColor(i === this.selectedIndex ? CYAN : WHITE);
      }
    }
    this.updateSelector();
  }

  // ─── Input Handlers ────────────────────────────────────────────────

  private handleUp(): void {
    if (this.viewState !== 'root') return;
    this.selectedIndex =
      (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
    audioManager.playPause();
    this.highlightSelected();
  }

  private handleDown(): void {
    if (this.viewState !== 'root') return;
    this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
    audioManager.playPause();
    this.highlightSelected();
  }

  private handleEnter(): void {
    if (this.viewState !== 'root') return;

    const selected = this.menuItems[this.selectedIndex];
    if (!selected) return;

    switch (selected) {
      case 'START GAME':
        this.startGame();
        break;
      case 'HIGH SCORES':
        this.showHighScores();
        break;
      case 'ACHIEVEMENTS':
        this.showAchievements();
        break;
      case 'OPTIONS':
        this.showOptions();
        break;
      case 'CONTROLS':
        this.showControls();
        break;
    }
  }

  private handleEscape(): void {
    if (this.viewState === 'root') {
      // Do nothing on root menu
      return;
    }

    if (this.viewState === 'clearConfirm') {
      // Return to high scores
      this.showHighScores();
      return;
    }

    // Return to root menu from any submenu
    this.returnToRoot();
  }

  private handleY(): void {
    if (this.viewState !== 'clearConfirm') return;
    saveManager.clearLeaderboard();
    audioManager.playPause();
    this.showHighScores();
  }

  private handleN(): void {
    if (this.viewState !== 'clearConfirm') return;
    this.showHighScores();
  }

  // ─── Navigation ────────────────────────────────────────────────────

  private returnToRoot(): void {
    this.viewState = 'root';
    if (this.submenuContainer) {
      this.submenuContainer.removeAll(true);
      this.submenuContainer.setVisible(false);
    }
    if (this.menuContainer) {
      this.menuContainer.setVisible(true);
    }
  }

  private showSubmenu(): void {
    if (this.menuContainer) {
      this.menuContainer.setVisible(false);
    }
    if (this.submenuContainer) {
      this.submenuContainer.removeAll(true);
      this.submenuContainer.setVisible(true);
    }
  }

  // ─── START GAME ────────────────────────────────────────────────────

  private startGame(): void {
    audioManager.resumeContext();
    audioManager.playStartGame();
    audioManager.stopMusic();
    this.scene.stop('MenuScene');
    this.scene.start('PrototypeScene');
  }

  // ─── HIGH SCORES ──────────────────────────────────────────────────

  private showHighScores(): void {
    this.viewState = 'highscores';
    this.showSubmenu();

    if (!this.submenuContainer) return;
    const { width, height } = this.scale;

    // Header
    const header = this.add
      .text(width / 2, 80, 'HIGH SCORES', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(header);

    const leaderboard = saveManager.getLeaderboard();

    if (leaderboard.length === 0) {
      const empty = this.add
        .text(width / 2, height / 2, 'No scores yet', {
          fontFamily: 'monospace',
          fontSize: '20px',
          color: DIM,
        })
        .setOrigin(0.5)
        .setDepth(6);
      this.submenuContainer.add(empty);
    } else {
      // Column headers
      const colY = 130;
      const cols = this.add
        .text(80, colY, 'RANK   SCORE      WAVE  COMBO  RESULT     DATE', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: DIM,
        })
        .setDepth(6);
      this.submenuContainer.add(cols);

      // Entries
      for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i]!;
        const rank = String(i + 1).padStart(2, ' ');
        const score = String(entry.score).padStart(8, ' ');
        const wave = String(entry.wave).padStart(4, ' ');
        const combo = String(entry.combo).padStart(5, ' ');
        const result = entry.result.padEnd(10, ' ');
        const date = entry.date.slice(0, 10);

        const row = this.add
          .text(
            80,
            colY + 30 + i * 26,
            `  ${rank}   ${score}    ${wave}  ${combo}  ${result} ${date}`,
            {
              fontFamily: 'monospace',
              fontSize: '14px',
              color: WHITE,
            },
          )
          .setDepth(6);
        this.submenuContainer.add(row);
      }
    }

    // Clear scores option
    const clearY = height - 80;
    const clearText = this.add
      .text(width / 2, clearY, '[C] Clear Scores', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ff4444',
      })
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showClearConfirmation());
    this.submenuContainer.add(clearText);

    // Register C key for clear
    if (this.input.keyboard) {
      const keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      keyC.once('down', () => {
        if (this.viewState === 'highscores') {
          this.showClearConfirmation();
        }
      });
    }

    // Footer
    this.addSubmenuFooter();
  }

  private showClearConfirmation(): void {
    this.viewState = 'clearConfirm';
    this.showSubmenu();

    if (!this.submenuContainer) return;
    const { width, height } = this.scale;

    const msg = this.add
      .text(width / 2, height / 2 - 30, 'Clear all scores?', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: WHITE,
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(msg);

    const prompt = this.add
      .text(width / 2, height / 2 + 20, 'Y = Yes  |  N / Esc = Cancel', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: DIM,
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(prompt);
  }

  // ─── ACHIEVEMENTS ─────────────────────────────────────────────────

  private showAchievements(): void {
    this.viewState = 'achievements';
    this.showSubmenu();

    if (!this.submenuContainer) return;
    const { width } = this.scale;

    const allAchievements = achievementManager.getAll();
    const unlockedCount = allAchievements.filter((a) => a.unlocked).length;

    // Header
    const header = this.add
      .text(width / 2, 80, 'ACHIEVEMENTS', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(header);

    // Unlocked count
    const countText = this.add
      .text(
        width / 2,
        120,
        `${unlockedCount} / ${allAchievements.length} unlocked`,
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: DIM,
        },
      )
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(countText);

    // Achievement list
    const startY = 160;
    const lineHeight = 36;

    for (let i = 0; i < allAchievements.length; i++) {
      const achievement = allAchievements[i]!;
      const y = startY + i * lineHeight;

      // Determine display values
      const statusIcon = achievement.unlocked ? '[*]' : '[ ]';
      const color = achievement.unlocked ? UNLOCKED_COLOR : LOCKED_COLOR;

      let title: string;
      let description: string;

      if (!achievement.unlocked && achievement.hidden) {
        title = '???';
        description = 'Hidden achievement';
      } else {
        title = achievement.title;
        description = achievement.description;
      }

      const line = this.add
        .text(60, y, `${statusIcon} ${title}`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color,
          fontStyle: achievement.unlocked ? 'bold' : 'normal',
        })
        .setDepth(6);
      this.submenuContainer.add(line);

      const desc = this.add
        .text(100, y + 17, description, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: DIM,
        })
        .setDepth(6);
      this.submenuContainer.add(desc);
    }

    this.addSubmenuFooter();
  }

  // ─── OPTIONS ───────────────────────────────────────────────────────

  private showOptions(): void {
    this.viewState = 'options';
    this.showSubmenu();

    if (!this.submenuContainer) return;
    const { width, height } = this.scale;

    const header = this.add
      .text(width / 2, 80, 'OPTIONS', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(header);

    const placeholder = this.add
      .text(width / 2, height / 2, 'Settings coming soon', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: DIM,
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(placeholder);

    this.addSubmenuFooter();
  }

  // ─── CONTROLS ──────────────────────────────────────────────────────

  private showControls(): void {
    this.viewState = 'controls';
    this.showSubmenu();

    if (!this.submenuContainer) return;
    const { width } = this.scale;

    const header = this.add
      .text(width / 2, 80, 'CONTROLS', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: CYAN,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(header);

    const controls = [
      ['WASD / Arrows', 'Move'],
      ['Space / Click', 'Fire'],
      ['P / Esc', 'Pause'],
      ['Q', 'Quit to Menu'],
      ['M', 'Mute'],
      ['Gamepad', 'Supported'],
    ];

    const startY = 150;
    const lineHeight = 40;

    for (let i = 0; i < controls.length; i++) {
      const [key, action] = controls[i]!;
      const y = startY + i * lineHeight;

      const keyText = this.add
        .text(width / 2 - 120, y, key!, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: CYAN,
        })
        .setOrigin(1, 0.5)
        .setDepth(6);
      this.submenuContainer.add(keyText);

      const actionText = this.add
        .text(width / 2 - 80, y, action!, {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: WHITE,
        })
        .setOrigin(0, 0.5)
        .setDepth(6);
      this.submenuContainer.add(actionText);
    }

    this.addSubmenuFooter();
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private addSubmenuFooter(): void {
    if (!this.submenuContainer) return;
    const { width, height } = this.scale;

    const footer = this.add
      .text(width / 2, height - 40, 'Esc: Back', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: DIM,
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.submenuContainer.add(footer);
  }

  shutdown(): void {
    // Clean up keys to prevent duplicate registrations
    if (this.input.keyboard) {
      if (this.keyUp) this.input.keyboard.removeKey(this.keyUp);
      if (this.keyDown) this.input.keyboard.removeKey(this.keyDown);
      if (this.keyEnter) this.input.keyboard.removeKey(this.keyEnter);
      if (this.keyEscape) this.input.keyboard.removeKey(this.keyEscape);
      if (this.keyY) this.input.keyboard.removeKey(this.keyY);
      if (this.keyN) this.input.keyboard.removeKey(this.keyN);
    }
    this.keyUp = null;
    this.keyDown = null;
    this.keyEnter = null;
    this.keyEscape = null;
    this.keyY = null;
    this.keyN = null;
  }
}

export { MenuScene };
