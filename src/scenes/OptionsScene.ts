/**
 * OptionsScene - Full interactive options screen for Chrono Defender.
 *
 * Provides keyboard-navigable settings across Audio, Display, Gameplay,
 * Accessibility, and Data sections. Changes apply immediately via
 * SettingsManager. Destructive data actions require Y/N confirmation.
 * Scene key: 'OptionsScene'
 */

import Phaser from 'phaser';

import { audioManager } from '../systems/AudioManager';
import { gamepadManager, BUTTON } from '../systems/GamepadManager';
import { saveManager } from '../systems/SaveManager';
import { settingsManager } from '../systems/SettingsManager';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Slider option: numeric 0–100 in steps of 10 */
interface SliderOption {
  type: 'slider';
  label: string;
  key: 'masterVolume' | 'musicVolume' | 'sfxVolume';
  step: number;
}

/** Toggle option: boolean On/Off */
interface ToggleOption {
  type: 'toggle';
  label: string;
  key:
    | 'muted'
    | 'highContrast'
    | 'autoFire'
    | 'pauseOnFocusLoss'
    | 'reducedFlashing'
    | 'reducedMotion'
    | 'vibration';
}

/** Choice option: discrete list of values */
interface ChoiceOption {
  type: 'choice';
  label: string;
  key:
    'screenShake' | 'particleEffects' | 'hudScale' | 'difficulty' | 'aimAssist';
  choices: string[];
}

/** Action option: triggers a destructive operation with confirmation */
interface ActionOption {
  type: 'action';
  label: string;
  action: string;
}

/** Section header (non-interactive) */
interface SectionHeader {
  type: 'header';
  label: string;
}

type OptionItem =
  SliderOption | ToggleOption | ChoiceOption | ActionOption | SectionHeader;

// ─── Constants ──────────────────────────────────────────────────────────────

const BG_COLOR = 0x050a1a;
const CYAN = '#00ffff';
const WHITE = '#ffffff';
const DIM = '#888888';

const TITLE_SIZE = 32;
const HEADER_SIZE = 16;
const ITEM_SIZE = 14;
const LINE_HEIGHT = 28;
const TOP_MARGIN = 60;
const LEFT_MARGIN = 60;
const VALUE_X = 500;
const FOOTER_MARGIN = 40;

// ─── Option Definitions ─────────────────────────────────────────────────────

const OPTION_ITEMS: OptionItem[] = [
  // AUDIO
  { type: 'header', label: 'AUDIO' },
  { type: 'slider', label: 'Master Volume', key: 'masterVolume', step: 10 },
  { type: 'slider', label: 'Music Volume', key: 'musicVolume', step: 10 },
  { type: 'slider', label: 'SFX Volume', key: 'sfxVolume', step: 10 },
  { type: 'toggle', label: 'Mute', key: 'muted' },

  // DISPLAY
  { type: 'header', label: 'DISPLAY' },
  {
    type: 'choice',
    label: 'Screen Shake',
    key: 'screenShake',
    choices: ['off', 'low', 'medium', 'high'],
  },
  {
    type: 'choice',
    label: 'Particle Effects',
    key: 'particleEffects',
    choices: ['low', 'medium', 'high'],
  },
  {
    type: 'choice',
    label: 'HUD Scale',
    key: 'hudScale',
    choices: ['small', 'medium', 'large'],
  },
  { type: 'toggle', label: 'High Contrast', key: 'highContrast' },

  // GAMEPLAY
  { type: 'header', label: 'GAMEPLAY' },
  {
    type: 'choice',
    label: 'Difficulty',
    key: 'difficulty',
    choices: ['easy', 'normal', 'hard'],
  },
  { type: 'toggle', label: 'Auto-Fire', key: 'autoFire' },
  { type: 'toggle', label: 'Pause on Focus Loss', key: 'pauseOnFocusLoss' },

  // ACCESSIBILITY
  { type: 'header', label: 'ACCESSIBILITY' },
  { type: 'toggle', label: 'Reduced Flashing', key: 'reducedFlashing' },
  { type: 'toggle', label: 'Reduced Motion', key: 'reducedMotion' },
  { type: 'toggle', label: 'Vibration', key: 'vibration' },
  {
    type: 'choice',
    label: 'Aim Assist',
    key: 'aimAssist',
    choices: ['off', 'low', 'medium'],
  },

  // DATA
  { type: 'header', label: 'DATA' },
  { type: 'action', label: 'Clear High Scores', action: 'clearHighScores' },
  { type: 'action', label: 'Reset Achievements', action: 'resetAchievements' },
  { type: 'action', label: 'Reset Settings', action: 'resetSettings' },
  { type: 'action', label: 'Reset All Data', action: 'resetAllData' },
];

/** Indices of interactive (non-header) items */
function getInteractiveIndices(): number[] {
  const indices: number[] = [];
  for (let i = 0; i < OPTION_ITEMS.length; i++) {
    const entry = OPTION_ITEMS[i];
    if (entry && entry.type !== 'header') {
      indices.push(i);
    }
  }
  return indices;
}

// ─── OptionsScene ───────────────────────────────────────────────────────────

export class OptionsScene extends Phaser.Scene {
  /** Indices into OPTION_ITEMS that are interactive */
  private interactiveIndices: number[] = [];

  /** Current cursor position within interactiveIndices */
  private cursorPos = 0;

  /** All rendered text objects for cleanup */
  private textObjects: Phaser.GameObjects.Text[] = [];

  /** Footer text */
  private footerText: Phaser.GameObjects.Text | null = null;

  /** Scroll offset for long lists */
  private scrollY = 0;

  /** Container holding all option items */
  private itemContainer: Phaser.GameObjects.Container | null = null;

  // ─── Confirmation Modal State ──────────────────────────────────────

  private modalVisible = false;
  private modalOverlay: Phaser.GameObjects.Rectangle | null = null;
  private modalText: Phaser.GameObjects.Text | null = null;
  private modalHintText: Phaser.GameObjects.Text | null = null;
  private pendingAction: string | null = null;

  // ─── Key References ────────────────────────────────────────────────

  private keyUp: Phaser.Input.Keyboard.Key | null = null;
  private keyDown: Phaser.Input.Keyboard.Key | null = null;
  private keyLeft: Phaser.Input.Keyboard.Key | null = null;
  private keyRight: Phaser.Input.Keyboard.Key | null = null;
  private keyEnter: Phaser.Input.Keyboard.Key | null = null;
  private keyEsc: Phaser.Input.Keyboard.Key | null = null;
  private keyY: Phaser.Input.Keyboard.Key | null = null;
  private keyN: Phaser.Input.Keyboard.Key | null = null;

  // ─── Gamepad State ─────────────────────────────────────────────────

  /** Repeat delay for held gamepad input (ms) */
  private readonly GP_REPEAT_DELAY = 400;
  /** Repeat interval after initial delay (ms) */
  private readonly GP_REPEAT_INTERVAL = 150;
  /** Timers for held directions */
  private gpHeldTimer: Record<string, number> = {};
  /** Whether initial delay has passed for held direction */
  private gpRepeating: Record<string, boolean> = {};

  constructor() {
    super({ key: 'OptionsScene' });
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);

    this.interactiveIndices = getInteractiveIndices();
    this.cursorPos = 0;
    this.scrollY = 0;
    this.modalVisible = false;
    this.pendingAction = null;
    this.gpHeldTimer = {};
    this.gpRepeating = {};

    this.registerKeys();
    this.renderAll();
  }

  override update(_time: number, delta: number): void {
    this.pollGamepad(delta);
  }

  shutdown(): void {
    this.removeKeys();
    this.cleanupTextObjects();
    this.destroyModal();
  }

  // ─── Key Registration ──────────────────────────────────────────────

  private registerKeys(): void {
    if (!this.input.keyboard) return;

    this.keyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.DOWN,
    );
    this.keyLeft = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.LEFT,
    );
    this.keyRight = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    );
    this.keyEnter = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.keyEsc = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    );
    this.keyY = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

    this.keyUp.on('down', this.onUp, this);
    this.keyDown.on('down', this.onDown, this);
    this.keyLeft.on('down', this.onLeft, this);
    this.keyRight.on('down', this.onRight, this);
    this.keyEnter.on('down', this.onEnter, this);
    this.keyEsc.on('down', this.onEsc, this);
    this.keyY.on('down', this.onY, this);
    this.keyN.on('down', this.onN, this);
  }

  private removeKeys(): void {
    if (!this.input.keyboard) return;

    const keys = [
      this.keyUp,
      this.keyDown,
      this.keyLeft,
      this.keyRight,
      this.keyEnter,
      this.keyEsc,
      this.keyY,
      this.keyN,
    ];

    for (const key of keys) {
      if (key) {
        key.removeAllListeners();
        this.input.keyboard.removeKey(key);
      }
    }

    this.keyUp = null;
    this.keyDown = null;
    this.keyLeft = null;
    this.keyRight = null;
    this.keyEnter = null;
    this.keyEsc = null;
    this.keyY = null;
    this.keyN = null;
  }

  // ─── Gamepad Polling ────────────────────────────────────────────────

  private pollGamepad(delta: number): void {
    gamepadManager.update();

    if (!gamepadManager.isConnected()) return;

    // Edge-detected buttons
    if (gamepadManager.isButtonJustPressed(BUTTON.A)) {
      if (this.modalVisible) {
        this.onY();
      } else {
        this.onEnter();
      }
    }

    if (gamepadManager.isButtonJustPressed(BUTTON.B)) {
      if (this.modalVisible) {
        this.onN();
      } else {
        this.onEsc();
      }
    }

    if (gamepadManager.isButtonJustPressed(BUTTON.START)) {
      this.onEsc();
    }

    // Directional input with repeat delay
    const axes = gamepadManager.getAxes();
    const dpadUp =
      gamepadManager.isButtonPressed(BUTTON.DPAD_UP) || axes.y < -0.5;
    const dpadDown =
      gamepadManager.isButtonPressed(BUTTON.DPAD_DOWN) || axes.y > 0.5;
    const dpadLeft =
      gamepadManager.isButtonPressed(BUTTON.DPAD_LEFT) || axes.x < -0.5;
    const dpadRight =
      gamepadManager.isButtonPressed(BUTTON.DPAD_RIGHT) || axes.x > 0.5;

    this.handleHeldDirection('up', dpadUp, delta, () => this.onUp());
    this.handleHeldDirection('down', dpadDown, delta, () => this.onDown());
    this.handleHeldDirection('left', dpadLeft, delta, () => this.onLeft());
    this.handleHeldDirection('right', dpadRight, delta, () => this.onRight());
  }

  private handleHeldDirection(
    dir: string,
    pressed: boolean,
    delta: number,
    action: () => void,
  ): void {
    if (!pressed) {
      this.gpHeldTimer[dir] = 0;
      this.gpRepeating[dir] = false;
      return;
    }

    const timer = (this.gpHeldTimer[dir] ?? 0) + delta;
    this.gpHeldTimer[dir] = timer;

    if (!this.gpRepeating[dir]) {
      // First press or waiting for initial delay
      if (timer >= this.GP_REPEAT_DELAY) {
        this.gpRepeating[dir] = true;
        this.gpHeldTimer[dir] = 0;
        action();
      } else if (timer === delta) {
        // First frame of press
        action();
      }
    } else {
      // Repeating
      if (timer >= this.GP_REPEAT_INTERVAL) {
        this.gpHeldTimer[dir] = 0;
        action();
      }
    }
  }

  // ─── Input Handlers ────────────────────────────────────────────────

  private onUp(): void {
    if (this.modalVisible) return;
    if (this.cursorPos > 0) {
      this.cursorPos--;
      audioManager.playPause();
      this.updateScroll();
      this.renderAll();
    }
  }

  private onDown(): void {
    if (this.modalVisible) return;
    if (this.cursorPos < this.interactiveIndices.length - 1) {
      this.cursorPos++;
      audioManager.playPause();
      this.updateScroll();
      this.renderAll();
    }
  }

  private onLeft(): void {
    if (this.modalVisible) return;
    this.adjustCurrentItem(-1);
  }

  private onRight(): void {
    if (this.modalVisible) return;
    this.adjustCurrentItem(1);
  }

  private onEnter(): void {
    if (this.modalVisible) return;

    const itemIndex = this.interactiveIndices[this.cursorPos];
    if (itemIndex === undefined) return;
    const item = OPTION_ITEMS[itemIndex];
    if (!item) return;

    if (item.type === 'toggle') {
      const current = settingsManager.get(item.key) as boolean;
      settingsManager.set(item.key, !current);
      if (this.isAudioKey(item.key)) {
        settingsManager.applyAll();
      }
      audioManager.playPause();
      this.renderAll();
    } else if (item.type === 'action') {
      this.showConfirmModal(item);
    }
  }

  private onEsc(): void {
    if (this.modalVisible) {
      this.hideModal();
      return;
    }
    this.scene.start('MenuScene');
  }

  private onY(): void {
    if (!this.modalVisible || !this.pendingAction) return;
    this.executeAction(this.pendingAction);
    this.hideModal();
    this.renderAll();
  }

  private onN(): void {
    if (!this.modalVisible) return;
    this.hideModal();
  }

  // ─── Adjustment Logic ──────────────────────────────────────────────

  private adjustCurrentItem(direction: number): void {
    const itemIndex = this.interactiveIndices[this.cursorPos];
    if (itemIndex === undefined) return;
    const item = OPTION_ITEMS[itemIndex];
    if (!item) return;

    if (item.type === 'slider') {
      const current = settingsManager.get(item.key) as number;
      const percent = Math.round(current * 100);
      const newPercent = Phaser.Math.Clamp(
        percent + direction * item.step,
        0,
        100,
      );
      settingsManager.set(item.key, newPercent / 100);
      settingsManager.applyAll();
      audioManager.playPause();
      this.renderAll();
    } else if (item.type === 'choice') {
      const current = settingsManager.get(item.key) as string;
      const idx = item.choices.indexOf(current);
      const newIdx = Phaser.Math.Clamp(
        idx + direction,
        0,
        item.choices.length - 1,
      );
      if (newIdx !== idx) {
        settingsManager.set(item.key, item.choices[newIdx] as never);
        audioManager.playPause();
        this.renderAll();
      }
    } else if (item.type === 'toggle') {
      const current = settingsManager.get(item.key) as boolean;
      settingsManager.set(item.key, !current);
      if (this.isAudioKey(item.key)) {
        settingsManager.applyAll();
      }
      audioManager.playPause();
      this.renderAll();
    }
  }

  private isAudioKey(key: string): boolean {
    return ['masterVolume', 'musicVolume', 'sfxVolume', 'muted'].includes(key);
  }

  // ─── Data Actions ──────────────────────────────────────────────────

  private executeAction(action: string): void {
    switch (action) {
      case 'clearHighScores':
        saveManager.clearLeaderboard();
        break;
      case 'resetAchievements':
        saveManager.clearAchievements();
        break;
      case 'resetSettings':
        settingsManager.reset();
        settingsManager.applyAll();
        break;
      case 'resetAllData':
        saveManager.resetAllData();
        settingsManager.applyAll();
        break;
    }
  }

  // ─── Confirmation Modal ────────────────────────────────────────────

  private showConfirmModal(item: ActionOption): void {
    this.modalVisible = true;
    this.pendingAction = item.action;

    const { width, height } = this.cameras.main;

    this.modalOverlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8,
    );
    this.modalOverlay.setDepth(200);

    this.modalText = this.add
      .text(width / 2, height / 2 - 30, 'Are you sure?', {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: WHITE,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(201);

    const description = this.add
      .text(width / 2, height / 2, item.label, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: CYAN,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(201);
    this.textObjects.push(description);

    this.modalHintText = this.add
      .text(width / 2, height / 2 + 40, 'Y = Confirm | N = Cancel', {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: DIM,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(201);
  }

  private hideModal(): void {
    this.modalVisible = false;
    this.pendingAction = null;
    this.destroyModal();
  }

  private destroyModal(): void {
    if (this.modalOverlay) {
      this.modalOverlay.destroy();
      this.modalOverlay = null;
    }
    if (this.modalText) {
      this.modalText.destroy();
      this.modalText = null;
    }
    if (this.modalHintText) {
      this.modalHintText.destroy();
      this.modalHintText = null;
    }
  }

  // ─── Scrolling ─────────────────────────────────────────────────────

  private updateScroll(): void {
    const { height } = this.cameras.main;
    const availableHeight = height - TOP_MARGIN - FOOTER_MARGIN - 40;
    const totalContentHeight = OPTION_ITEMS.length * LINE_HEIGHT;

    if (totalContentHeight <= availableHeight) {
      this.scrollY = 0;
      return;
    }

    // Ensure current item is visible
    const itemIndex = this.interactiveIndices[this.cursorPos];
    if (itemIndex === undefined) return;
    const itemY = itemIndex * LINE_HEIGHT;
    const viewTop = this.scrollY;
    const viewBottom = this.scrollY + availableHeight;

    if (itemY < viewTop) {
      this.scrollY = itemY;
    } else if (itemY + LINE_HEIGHT > viewBottom) {
      this.scrollY = itemY + LINE_HEIGHT - availableHeight;
    }
  }

  // ─── Rendering ─────────────────────────────────────────────────────

  private renderAll(): void {
    this.cleanupTextObjects();

    const { width, height } = this.cameras.main;

    // Title
    const title = this.add
      .text(width / 2, 20, 'OPTIONS', {
        fontSize: `${TITLE_SIZE}px`,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: CYAN,
      })
      .setOrigin(0.5, 0);
    this.textObjects.push(title);

    // Items container
    if (this.itemContainer) {
      this.itemContainer.destroy();
    }
    this.itemContainer = this.add.container(0, TOP_MARGIN - this.scrollY);

    let interactiveCount = 0;

    for (let i = 0; i < OPTION_ITEMS.length; i++) {
      const item = OPTION_ITEMS[i];
      if (!item) continue;
      const y = i * LINE_HEIGHT;

      if (item.type === 'header') {
        this.renderHeader(item, y);
      } else {
        const isSelected = interactiveCount === this.cursorPos;
        this.renderItem(item, y, isSelected);
        interactiveCount++;
      }
    }

    // Footer
    this.footerText = this.add
      .text(
        width / 2,
        height - FOOTER_MARGIN,
        '\u2191\u2193 Navigate | \u2190\u2192 Adjust | Enter: Toggle | Esc: Back',
        {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: DIM,
          align: 'center',
        },
      )
      .setOrigin(0.5);
    this.textObjects.push(this.footerText);
  }

  private renderHeader(item: SectionHeader, y: number): void {
    const text = this.add.text(LEFT_MARGIN, y, item.label, {
      fontSize: `${HEADER_SIZE}px`,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: CYAN,
    });
    this.itemContainer?.add(text);
  }

  private renderItem(
    item: SliderOption | ToggleOption | ChoiceOption | ActionOption,
    y: number,
    isSelected: boolean,
  ): void {
    const color = isSelected ? CYAN : WHITE;
    const prefix = isSelected ? '> ' : '  ';

    // Label
    const labelText = this.add.text(LEFT_MARGIN, y, `${prefix}${item.label}`, {
      fontSize: `${ITEM_SIZE}px`,
      fontFamily: 'monospace',
      color,
    });
    this.itemContainer?.add(labelText);

    // Value
    const valueStr = this.getValueString(item);
    const valueColor = isSelected ? CYAN : WHITE;

    const valueText = this.add.text(VALUE_X, y, valueStr, {
      fontSize: `${ITEM_SIZE}px`,
      fontFamily: 'monospace',
      color: valueColor,
      align: 'right',
    });
    this.itemContainer?.add(valueText);
  }

  private getValueString(
    item: SliderOption | ToggleOption | ChoiceOption | ActionOption,
  ): string {
    switch (item.type) {
      case 'slider': {
        const val = settingsManager.get(item.key) as number;
        const percent = Math.round(val * 100);
        const filled = Math.round(percent / 10);
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
        return `${bar} ${percent}%`;
      }
      case 'toggle': {
        const val = settingsManager.get(item.key) as boolean;
        return val ? 'On' : 'Off';
      }
      case 'choice': {
        const val = settingsManager.get(item.key) as string;
        const idx = item.choices.indexOf(val);
        const arrows =
          (idx > 0 ? '\u25C0 ' : '  ') +
          val.charAt(0).toUpperCase() +
          val.slice(1) +
          (idx < item.choices.length - 1 ? ' \u25B6' : '');
        return arrows;
      }
      case 'action':
        return '[Enter]';
    }
  }

  // ─── Cleanup ───────────────────────────────────────────────────────

  private cleanupTextObjects(): void {
    for (const obj of this.textObjects) {
      if (obj && obj.active) {
        obj.destroy();
      }
    }
    this.textObjects = [];

    if (this.itemContainer) {
      this.itemContainer.destroy();
      this.itemContainer = null;
    }
  }
}

export default OptionsScene;
