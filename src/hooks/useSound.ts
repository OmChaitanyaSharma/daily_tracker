import { useCallback, useState, useEffect } from 'react';

// Storage key and event name for global sound preference
const SOUND_KEY = 'dt_sound_enabled';
const SOUND_EVENT = 'dt_sound_toggle';

// Singleton audio context to prevent hitting browser hardware limits
let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedCtx = new AudioContextClass();
    }
  }
  if (sharedCtx && sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(SOUND_KEY);
  return saved === null ? true : saved === 'true';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: { enabled } }));
}

export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(() => isSoundEnabled());

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const custom = e as CustomEvent<{ enabled: boolean }>;
      if (custom.detail) {
        setEnabled(custom.detail.enabled);
      }
    };
    window.addEventListener(SOUND_EVENT, handleToggle);
    return () => window.removeEventListener(SOUND_EVENT, handleToggle);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  }, [enabled]);

  // 1. Tactile standard button tap (clean & short)
  const playClick = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  // 2. Crisp wooden / mechanical switch pop (for habit completion ticks)
  const playCheck = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Transient attack pop
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(350, now + 0.025);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.003);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc1.start(now);
      osc1.stop(now + 0.035);

      // Body tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(580, now + 0.01);
      osc2.frequency.exponentialRampToValueAtTime(240, now + 0.06);

      gain2.gain.setValueAtTime(0, now + 0.01);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc2.start(now + 0.01);
      osc2.stop(now + 0.07);

      osc1.onended = () => { osc1.disconnect(); gain1.disconnect(); };
      osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  // 3. Smooth ascending harmonic chime (for saving entries, logging focus hours)
  const playSuccess = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Base note (E5 = 659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.start(now);
      osc1.stop(now + 0.22);

      // Harmonics note (B5 = 987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1174, now + 0.2); // D6

      gain2.gain.setValueAtTime(0, now + 0.05);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.start(now + 0.05);
      osc2.stop(now + 0.28);

      osc1.onended = () => { osc1.disconnect(); gain1.disconnect(); };
      osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  // 4. Harmonic major fanfare arpeggio (for 100% daily checklist completion or streak level-up)
  const playFanfare = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // C5 (523), E5 (659), G5 (784), C6 (1046)
      const chord = [
        { freq: 523.25, time: 0.00, dur: 0.18 },
        { freq: 659.25, time: 0.08, dur: 0.20 },
        { freq: 783.99, time: 0.16, dur: 0.22 },
        { freq: 1046.50, time: 0.24, dur: 0.40 }
      ];

      chord.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        gain.gain.setValueAtTime(0, now + note.time);
        gain.gain.linearRampToValueAtTime(0.09, now + note.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  // 5. Low muted thump (for delete, archive, or cancellation)
  const playThump = useCallback(() => {
    if (!isSoundEnabled()) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.start(now);
      osc.stop(now + 0.09);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  }, []);

  return {
    soundEnabled: enabled,
    toggleSound,
    playClick,
    playCheck,
    playSuccess,
    playFanfare,
    playThump
  };
}
