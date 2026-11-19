// 100% procedural Web Audio API sound effects + safe Web Speech API pronunciation

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled = true;
  public voiceEnabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.14, slideTo?: number, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playMove() {
    this.playTone(320, 0.07, 'triangle', 0.08, 420);
  }

  playJump() {
    this.playTone(260, 0.18, 'sine', 0.14, 580);
  }

  playCoin() {
    this.playTone(784, 0.08, 'sine', 0.11);
    this.playTone(1046, 0.12, 'sine', 0.11, undefined, 0.06);
  }

  playWordCorrect() {
    this.playTone(523.25, 0.1, 'triangle', 0.14);
    this.playTone(659.25, 0.1, 'triangle', 0.14, undefined, 0.08);
    this.playTone(783.99, 0.14, 'triangle', 0.14, undefined, 0.16);
    this.playTone(1046.5, 0.22, 'sine', 0.16, undefined, 0.24);
  }

  playHit() {
    this.playTone(180, 0.18, 'sawtooth', 0.12, 70);
  }

  playAbility() {
    this.playTone(440, 0.12, 'sine', 0.13, 880);
    this.playTone(660, 0.18, 'triangle', 0.12, 1100, 0.08);
  }

  playHeal() {
    this.playTone(523.25, 0.12, 'sine', 0.14);
    this.playTone(659.25, 0.14, 'sine', 0.14, undefined, 0.08);
    this.playTone(880, 0.22, 'triangle', 0.15, undefined, 0.16);
  }

  playMonsterBonk() {
    this.playTone(260, 0.08, 'triangle', 0.16, 520);
    this.playTone(720, 0.14, 'sine', 0.14, 980, 0.07);
  }

  playLevelFail() {
    this.playTone(392, 0.16, 'triangle', 0.14);
    this.playTone(349.23, 0.16, 'triangle', 0.14, undefined, 0.14);
    this.playTone(293.66, 0.28, 'sine', 0.14, 240, 0.28);
  }

  private playFilteredNoise(duration: number, centerFreq: number, q: number, volume: number, delay = 0) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(q, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  playConfetti() {
    // Party popper cannon "POP!"
    this.playTone(220, 0.11, 'triangle', 0.22, 55, 0);
    this.playFilteredNoise(0.14, 1200, 1.1, 0.18, 0.01);

    // Fluttering paper crackles + festive high-note sparkles
    const sparkleFreqs = [1318.5, 1567.98, 1760, 2093, 2349.3, 2637];
    for (let i = 0; i < 8; i++) {
      const delay = 0.08 + i * 0.075;
      const freq = sparkleFreqs[(i * 3 + Math.floor(Math.random() * 3)) % sparkleFreqs.length];
      this.playTone(freq, 0.11, 'sine', 0.055, freq * 1.06, delay);
      this.playFilteredNoise(0.06, 2600 + i * 350, 2.2, 0.045, delay + 0.02);
    }
  }

  playEvolution() {
    const notes = [523, 587, 659, 784, 988, 1046];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.16, 'triangle', 0.15, undefined, idx * 0.08);
    });
  }

  playVictory(animalId: 'kiko' | 'bimo' | 'lulu' = 'kiko', evolutionStage: 1 | 2 | 3 | 4 = 1) {
    // Transpose slightly per animal personality (Kiko bright C, Bimo warm Bb, Lulu sparkling D)
    const transpose = animalId === 'bimo' ? 0.8909 : animalId === 'lulu' ? 1.1225 : 1.0;

    if (evolutionStage === 1) {
      // Stage 1: Cute & playful 4-note hop melody
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        this.playTone(n * transpose, 0.2, 'triangle', 0.15, undefined, idx * 0.1);
      });
    } else if (evolutionStage === 2) {
      // Stage 2: Adventurous 5-note bouncy fanfare with octave shimmer
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((n, idx) => {
        this.playTone(n * transpose, 0.22, 'triangle', 0.15, undefined, idx * 0.09);
        if (idx === notes.length - 1) {
          this.playTone(n * transpose * 0.5, 0.36, 'sine', 0.12, undefined, idx * 0.09);
        }
      });
    } else if (evolutionStage === 3) {
      // Stage 3: Heroic winged/armored brass-like victory march with chord harmony
      const melody = [523.25, 523.25, 659.25, 783.99, 659.25, 1046.5];
      const times = [0, 0.11, 0.22, 0.34, 0.48, 0.6];
      melody.forEach((n, idx) => {
        const dur = idx === melody.length - 1 ? 0.45 : 0.16;
        this.playTone(n * transpose, dur, 'triangle', 0.16, undefined, times[idx]);
        this.playTone(n * transpose * 0.5, dur, 'sine', 0.1, undefined, times[idx]);
      });
      // Final triumph chord
      [523.25, 659.25, 783.99].forEach((ch) => {
        this.playTone(ch * transpose, 0.45, 'sine', 0.09, undefined, 0.6);
      });
    } else {
      // Stage 4: Legendary / Cosmic Grand Champion Symphony!
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5, 1318.51, 1567.98];
      const times = [0, 0.09, 0.18, 0.28, 0.42, 0.52, 0.64, 0.78];
      fanfare.forEach((n, idx) => {
        const isFinal = idx >= 6;
        this.playTone(n * transpose, isFinal ? 0.48 : 0.18, 'triangle', 0.16, undefined, times[idx]);
        this.playTone(n * transpose * 1.5, isFinal ? 0.38 : 0.1, 'sine', 0.06, undefined, times[idx] + 0.02);
      });
      // Rich cosmic chord resolution
      [261.63, 392.0, 523.25, 659.25, 1046.5].forEach((ch) => {
        this.playTone(ch * transpose, 0.65, 'sine', 0.08, undefined, 0.78);
      });
    }
  }

  speakWord(english?: string, arabic?: string) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      if (english) {
        const utterEn = new SpeechSynthesisUtterance(english);
        utterEn.lang = 'en-US';
        utterEn.rate = 0.92;
        utterEn.pitch = 1.1;
        window.speechSynthesis.speak(utterEn);
      }

      if (arabic) {
        const utterAr = new SpeechSynthesisUtterance(arabic);
        utterAr.lang = 'ar-SA';
        utterAr.rate = 0.85;
        window.speechSynthesis.speak(utterAr);
      }
    } catch {
      // Ignore speech synthesis errors on unsupported environments
    }
  }
}

export const soundEngine = new SoundEngine();
