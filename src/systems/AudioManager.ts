/**
 * AudioManager - Procedural audio synthesis for Chrono Defender
 *
 * Uses the Web Audio API to generate all game sounds programmatically.
 * Implements singleton pattern with graceful degradation when AudioContext
 * is unavailable.
 */

/** Maximum number of simultaneous sound nodes to prevent clipping */
const MAX_SIMULTANEOUS_SOUNDS = 12;

/** Fade-out duration in seconds when stopping music */
const MUSIC_FADE_DURATION = 0.8;

/** Note frequencies for musical synthesis (Hz) */
const NOTE = {
  C2: 65.41,
  A2: 110.0,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
} as const;

class AudioManager {
  private static instance: AudioManager | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private musicVolume = 0.4;
  private sfxVolume = 0.6;
  private muted = false;

  private activeSoundCount = 0;
  private currentMusicNodes: OscillatorNode[] = [];
  private currentMusicGains: GainNode[] = [];
  private musicLoopTimer: number | null = null;
  private musicPlaying = false;

  private constructor() {
    this.initContext();
  }

  /** Get the singleton instance */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Initialize the AudioContext with graceful degradation */
  private initContext(): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
    } catch {
      // AudioContext unavailable - all methods become no-ops
      this.ctx = null;
    }
  }

  /**
   * Resume AudioContext on user interaction.
   * Must be called from a user gesture event handler.
   */
  resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        /* ignore resume failures */
      });
    }
  }

  // ─── Volume Controls ───────────────────────────────────────────────

  setMusicVolume(v: number): void {
    this.musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume;
    }
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.applyMuteState();
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private applyMuteState(): void {
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
    }
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume;
    }
  }

  // ─── Utility: Sound Tracking ───────────────────────────────────────

  private canPlaySound(): boolean {
    return this.activeSoundCount < MAX_SIMULTANEOUS_SOUNDS;
  }

  private trackSound(): void {
    this.activeSoundCount++;
  }

  private untrackSound(): void {
    this.activeSoundCount = Math.max(0, this.activeSoundCount - 1);
  }

  // ─── Utility: Oscillator Helpers ───────────────────────────────────

  private createOscillator(
    type: OscillatorType,
    frequency: number,
    destination: AudioNode,
  ): OscillatorNode | null {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    osc.connect(destination);
    return osc;
  }

  private createGain(value: number, destination: AudioNode): GainNode | null {
    if (!this.ctx) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = value;
    gain.connect(destination);
    return gain;
  }

  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private playNoiseBurst(
    duration: number,
    attackTime: number,
    decayTime: number,
    filterFreq: number,
  ): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const buffer = this.createNoiseBuffer(duration);
    if (!buffer) {
      this.untrackSound();
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);

    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.8, now + attackTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.sfxGain);

    source.start(now);
    source.stop(now + duration);
    source.onended = () => this.untrackSound();
  }

  // ─── SFX Methods ───────────────────────────────────────────────────

  /** Player weapon fire - short frequency sweep down */
  playLaser(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.1;

    const osc = this.createOscillator('sawtooth', 880, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.3, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(220, now + duration);
    envelope.gain.setValueAtTime(0.3, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();
  }

  /** Enemy destroyed - noise burst with decay */
  playEnemyDestroyed(): void {
    this.playNoiseBurst(0.3, 0.01, 0.3, 2000);
  }

  /** Boss takes damage - heavy impact */
  playBossDamaged(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.25;

    const osc = this.createOscillator('square', 120, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.5, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(40, now + duration);
    envelope.gain.setValueAtTime(0.5, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();
  }

  /** Boss defeated - large explosion with rumble */
  playBossDefeated(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 1.0;

    // Low rumble
    const osc = this.createOscillator('sawtooth', 60, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.6, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(20, now + duration);
    envelope.gain.setValueAtTime(0.6, now);
    envelope.gain.linearRampToValueAtTime(0.4, now + 0.1);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();

    // Noise layer
    this.playNoiseBurst(0.8, 0.01, 0.8, 3000);
  }

  /** Player takes damage */
  playPlayerHit(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.15;

    const osc = this.createOscillator('square', 300, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.4, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(100, now + duration);
    envelope.gain.setValueAtTime(0.4, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();
  }

  /** Player death - descending warble */
  playPlayerDeath(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.6;

    const osc = this.createOscillator('sawtooth', 500, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 12;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const envelope = this.createGain(0.5, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);
    envelope.gain.setValueAtTime(0.5, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    lfo.start(now);
    lfo.stop(now + duration);
    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();
  }

  /** Power-up / upgrade collected - ascending arpeggio */
  playUpgradeCollected(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const notes = [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5];
    const noteLength = 0.08;
    const totalDuration = notes.length * noteLength;

    const envelope = this.createGain(0.3, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    envelope.gain.setValueAtTime(0.3, now);
    envelope.gain.setValueAtTime(0.3, now + totalDuration - 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);

    const osc = this.createOscillator('sine', notes[0]!, envelope);
    if (!osc) {
      this.untrackSound();
      return;
    }

    notes.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, now + i * noteLength);
    });

    osc.start(now);
    osc.stop(now + totalDuration);
    osc.onended = () => this.untrackSound();
  }

  /** Echo drone attack - high-pitched chirp */
  playEchoDroneAttack(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.12;

    const osc = this.createOscillator('sine', 1200, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.25, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.exponentialRampToValueAtTime(600, now + duration);
    envelope.gain.setValueAtTime(0.25, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    osc.onended = () => this.untrackSound();
  }

  /** Pause sound - descending two-note */
  playPause(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const osc = this.createOscillator('sine', NOTE.G4, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.25, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.setValueAtTime(NOTE.G4, now);
    osc.frequency.setValueAtTime(NOTE.D4, now + 0.08);
    envelope.gain.setValueAtTime(0.25, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.start(now);
    osc.stop(now + 0.16);
    osc.onended = () => this.untrackSound();
  }

  /** Resume sound - ascending two-note */
  playResume(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const osc = this.createOscillator('sine', NOTE.D4, this.ctx.destination);
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.25, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.setValueAtTime(NOTE.D4, now);
    osc.frequency.setValueAtTime(NOTE.G4, now + 0.08);
    envelope.gain.setValueAtTime(0.25, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.start(now);
    osc.stop(now + 0.16);
    osc.onended = () => this.untrackSound();
  }

  /** Quit sound - descending three-note */
  playQuit(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const osc = this.createOscillator(
      'triangle',
      NOTE.E4,
      this.ctx.destination,
    );
    if (!osc) {
      this.untrackSound();
      return;
    }

    const envelope = this.createGain(0.25, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }

    osc.disconnect();
    osc.connect(envelope);
    osc.frequency.setValueAtTime(NOTE.E4, now);
    osc.frequency.setValueAtTime(NOTE.C4, now + 0.1);
    osc.frequency.setValueAtTime(NOTE.A3, now + 0.2);
    envelope.gain.setValueAtTime(0.25, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
    osc.onended = () => this.untrackSound();
  }

  /** Start game - bright ascending chord */
  playStartGame(): void {
    if (!this.ctx || !this.sfxGain || !this.canPlaySound()) return;
    this.trackSound();

    const now = this.ctx.currentTime;
    const duration = 0.35;

    const envelope = this.createGain(0.3, this.sfxGain);
    if (!envelope) {
      this.untrackSound();
      return;
    }
    envelope.gain.setValueAtTime(0.3, now);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const freqs = [NOTE.C4, NOTE.E4, NOTE.G4];
    const oscs: OscillatorNode[] = [];

    for (const freq of freqs) {
      const osc = this.createOscillator('sine', freq, envelope);
      if (osc) {
        osc.start(now);
        osc.stop(now + duration);
        oscs.push(osc);
      }
    }

    if (oscs.length > 0) {
      oscs[oscs.length - 1]!.onended = () => this.untrackSound();
    } else {
      this.untrackSound();
    }
  }

  // ─── Music Methods ─────────────────────────────────────────────────

  /** Stop any currently playing music with fade-out */
  stopMusic(): void {
    if (!this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;

    // Fade out existing music gains
    for (const gain of this.currentMusicGains) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          now + MUSIC_FADE_DURATION,
        );
      } catch {
        // Node may already be disconnected
      }
    }

    // Stop oscillators after fade
    setTimeout(
      () => {
        for (const osc of this.currentMusicNodes) {
          try {
            osc.stop();
          } catch {
            // Already stopped
          }
        }
        this.currentMusicNodes = [];
        this.currentMusicGains = [];
      },
      MUSIC_FADE_DURATION * 1000 + 50,
    );

    if (this.musicLoopTimer !== null) {
      clearInterval(this.musicLoopTimer);
      this.musicLoopTimer = null;
    }

    this.musicPlaying = false;
  }

  /** Ambient title screen theme - slow pad with filter sweep */
  playMenuMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();
    this.musicPlaying = true;

    const playLoop = (): void => {
      if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

      const now = this.ctx.currentTime;
      const loopDuration = 4.0;
      const chords = [
        [NOTE.C3, NOTE.E3, NOTE.G3],
        [NOTE.A3, NOTE.C4, NOTE.E4],
      ];

      const loopGain = this.ctx.createGain();
      loopGain.gain.value = 0.15;
      loopGain.connect(this.musicGain);
      this.currentMusicGains.push(loopGain);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.frequency.linearRampToValueAtTime(800, now + loopDuration / 2);
      filter.frequency.linearRampToValueAtTime(400, now + loopDuration);
      filter.connect(loopGain);

      for (let chordIdx = 0; chordIdx < chords.length; chordIdx++) {
        const startTime = now + chordIdx * (loopDuration / 2);
        const chord = chords[chordIdx]!;

        for (const freq of chord) {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(filter);
          osc.start(startTime);
          osc.stop(startTime + loopDuration / 2);
          this.currentMusicNodes.push(osc);
        }
      }
    };

    playLoop();
    this.musicLoopTimer = window.setInterval(playLoop, 4000);
  }

  /** Rhythmic gameplay theme - pulsing bass with arpeggiated lead */
  playGameMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();
    this.musicPlaying = true;

    const playLoop = (): void => {
      if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

      const now = this.ctx.currentTime;
      const loopDuration = 2.0;
      const stepTime = loopDuration / 8;

      // Bass line
      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.12;
      bassGain.connect(this.musicGain);
      this.currentMusicGains.push(bassGain);

      const bassNotes = [
        NOTE.C3,
        NOTE.C3,
        NOTE.E3,
        NOTE.E3,
        NOTE.G3,
        NOTE.G3,
        NOTE.E3,
        NOTE.E3,
      ];

      for (let i = 0; i < bassNotes.length; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = bassNotes[i]!;

        const noteEnv = this.ctx.createGain();
        noteEnv.gain.setValueAtTime(0.12, now + i * stepTime);
        noteEnv.gain.exponentialRampToValueAtTime(
          0.001,
          now + (i + 0.9) * stepTime,
        );
        noteEnv.connect(bassGain);
        osc.connect(noteEnv);

        osc.start(now + i * stepTime);
        osc.stop(now + (i + 1) * stepTime);
        this.currentMusicNodes.push(osc);
      }

      // Lead arpeggio
      const leadGain = this.ctx.createGain();
      leadGain.gain.value = 0.08;
      leadGain.connect(this.musicGain);
      this.currentMusicGains.push(leadGain);

      const leadNotes = [
        NOTE.C4,
        NOTE.E4,
        NOTE.G4,
        NOTE.B4,
        NOTE.G4,
        NOTE.E4,
        NOTE.C4,
        NOTE.E4,
      ];

      for (let i = 0; i < leadNotes.length; i++) {
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = leadNotes[i]!;

        const noteEnv = this.ctx.createGain();
        noteEnv.gain.setValueAtTime(0.08, now + i * stepTime);
        noteEnv.gain.exponentialRampToValueAtTime(
          0.001,
          now + (i + 0.7) * stepTime,
        );
        noteEnv.connect(leadGain);
        osc.connect(noteEnv);

        osc.start(now + i * stepTime);
        osc.stop(now + (i + 1) * stepTime);
        this.currentMusicNodes.push(osc);
      }
    };

    playLoop();
    this.musicLoopTimer = window.setInterval(playLoop, 2000);
  }

  /** Intense boss theme - low frequency drive with dissonant stabs */
  playBossMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();
    this.musicPlaying = true;

    const playLoop = (): void => {
      if (!this.ctx || !this.musicGain || !this.musicPlaying) return;

      const now = this.ctx.currentTime;
      const loopDuration = 1.6;
      const stepTime = loopDuration / 8;

      // Heavy bass
      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.15;
      bassGain.connect(this.musicGain);
      this.currentMusicGains.push(bassGain);

      const bassPattern = [1, 0, 1, 1, 0, 1, 0, 1]; // rhythm gate
      const bassFreq = NOTE.C2;

      for (let i = 0; i < bassPattern.length; i++) {
        if (!bassPattern[i]) continue;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = bassFreq;

        const distortion = this.ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let j = 0; j < 256; j++) {
          const x = (j * 2) / 256 - 1;
          curve[j] = Math.tanh(x * 3);
        }
        distortion.curve = curve;

        const noteEnv = this.ctx.createGain();
        noteEnv.gain.setValueAtTime(0.15, now + i * stepTime);
        noteEnv.gain.exponentialRampToValueAtTime(
          0.001,
          now + (i + 0.8) * stepTime,
        );
        noteEnv.connect(bassGain);

        osc.connect(distortion);
        distortion.connect(noteEnv);

        osc.start(now + i * stepTime);
        osc.stop(now + (i + 1) * stepTime);
        this.currentMusicNodes.push(osc);
      }

      // Dissonant stab on beats 1 and 5
      const stabGain = this.ctx.createGain();
      stabGain.gain.value = 0.06;
      stabGain.connect(this.musicGain);
      this.currentMusicGains.push(stabGain);

      const stabTimes = [0, 4];
      for (const beat of stabTimes) {
        const stabFreqs = [NOTE.C4, NOTE.F4 * 1.05] as const; // slightly detuned
        for (const freq of stabFreqs) {
          const osc = this.ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.value = freq;

          const env = this.ctx.createGain();
          env.gain.setValueAtTime(0.06, now + beat * stepTime);
          env.gain.exponentialRampToValueAtTime(
            0.001,
            now + (beat + 2) * stepTime,
          );
          env.connect(stabGain);
          osc.connect(env);

          osc.start(now + beat * stepTime);
          osc.stop(now + (beat + 2) * stepTime);
          this.currentMusicNodes.push(osc);
        }
      }
    };

    playLoop();
    this.musicLoopTimer = window.setInterval(playLoop, 1600);
  }

  /** Victory music - triumphant fanfare */
  playVictoryMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();
    this.musicPlaying = true;

    const now = this.ctx.currentTime;
    const fanfareNotes = [
      { freq: NOTE.C4, start: 0, dur: 0.2 },
      { freq: NOTE.E4, start: 0.2, dur: 0.2 },
      { freq: NOTE.G4, start: 0.4, dur: 0.2 },
      { freq: NOTE.C5, start: 0.6, dur: 0.6 },
      { freq: NOTE.G4, start: 1.2, dur: 0.2 },
      { freq: NOTE.C5, start: 1.4, dur: 0.8 },
    ];

    const fanfareGain = this.ctx.createGain();
    fanfareGain.gain.value = 0.2;
    fanfareGain.connect(this.musicGain);
    this.currentMusicGains.push(fanfareGain);

    for (const note of fanfareNotes) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.2, now + note.start);
      env.gain.setValueAtTime(0.2, now + note.start + note.dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      env.connect(fanfareGain);
      osc.connect(env);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
      this.currentMusicNodes.push(osc);
    }

    // Harmony layer
    const harmonyGain = this.ctx.createGain();
    harmonyGain.gain.value = 0.1;
    harmonyGain.connect(this.musicGain);
    this.currentMusicGains.push(harmonyGain);

    const harmonyNotes = [
      { freq: NOTE.E4, start: 0.6, dur: 0.6 },
      { freq: NOTE.G4, start: 0.6, dur: 0.6 },
      { freq: NOTE.E5, start: 1.4, dur: 0.8 },
    ];

    for (const note of harmonyNotes) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = note.freq;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.1, now + note.start);
      env.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      env.connect(harmonyGain);
      osc.connect(env);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
      this.currentMusicNodes.push(osc);
    }
  }

  /** Game over music - somber descending theme */
  playGameOverMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    this.stopMusic();
    this.musicPlaying = true;

    const now = this.ctx.currentTime;
    const notes = [
      { freq: NOTE.E4, start: 0, dur: 0.4 },
      { freq: NOTE.D4, start: 0.4, dur: 0.4 },
      { freq: NOTE.C4, start: 0.8, dur: 0.4 },
      { freq: NOTE.B3, start: 1.2, dur: 0.4 },
      { freq: NOTE.A3, start: 1.6, dur: 0.8 },
    ];

    const melodyGain = this.ctx.createGain();
    melodyGain.gain.value = 0.15;
    melodyGain.connect(this.musicGain);
    this.currentMusicGains.push(melodyGain);

    for (const note of notes) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = note.freq;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.15, now + note.start);
      env.gain.setValueAtTime(0.15, now + note.start + note.dur * 0.6);
      env.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      env.connect(melodyGain);
      osc.connect(env);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
      this.currentMusicNodes.push(osc);
    }

    // Low drone underneath
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.08;
    droneGain.connect(this.musicGain);
    this.currentMusicGains.push(droneGain);

    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = NOTE.A2;

    const droneEnv = this.ctx.createGain();
    droneEnv.gain.setValueAtTime(0.08, now);
    droneEnv.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    droneEnv.connect(droneGain);
    drone.connect(droneEnv);

    drone.start(now);
    drone.stop(now + 2.4);
    this.currentMusicNodes.push(drone);
  }
}

/** Singleton instance of AudioManager */
export const audioManager = AudioManager.getInstance();
export default audioManager;
export { AudioManager };
