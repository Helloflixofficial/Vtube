// ============================================================
// store/useAppStore.ts
// ============================================================

import { create } from 'zustand';
import type { Expression, FaceMetrics, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export type TrackingStatus =
  | 'idle'
  | 'requesting_camera'
  | 'loading_model'
  | 'detecting'
  | 'error';

interface AppState {
  expression:      Expression;
  faceMetrics:     FaceMetrics;
  cameraActive:    boolean;
  faceDetected:    boolean;
  settingsOpen:    boolean;
  settingsTab:     'avatar' | 'camera' | 'appearance' | 'general';
  isAlwaysOnTop:   boolean;
  isHeadless:      boolean;
  settings:        AppSettings;
  trackingStatus:  TrackingStatus;
  trackingError:   string | null;
  speaking:        boolean;
  cameraSpeaking:  boolean;
  micSpeaking:     boolean;
  micLevel:        number; // 0-100 live volume level

  setExpression:      (e: Expression) => void;
  setFaceMetrics:     (m: FaceMetrics) => void;
  setCameraActive:    (v: boolean) => void;
  setFaceDetected:    (v: boolean) => void;
  setSettingsOpen:    (v: boolean) => void;
  setSettingsTab:     (t: AppState['settingsTab']) => void;
  setIsAlwaysOnTop:   (v: boolean) => void;
  setIsHeadless:      (v: boolean) => void;
  setTrackingStatus:  (s: TrackingStatus) => void;
  setTrackingError:   (e: string | null) => void;
  setSpeaking:        (v: boolean) => void;
  setMicLevel:        (v: number) => void;
  updateSettings:     (patch: Partial<AppSettings>) => void;
  resetSettings:      () => void;
}

/**
 * Derive expression from MediaPipe blend shape metrics.
 * Priority: disturbed > happyTears > happy > normal
 */
export function deriveExpression(m: FaceMetrics, s: AppSettings): Expression {
  if (!m.faceDetected) return 'normal';
  const t = s.sensitivity;

  // Disturbed: wide mouth + raised brows (shock)
  if (m.mouthOpen > t.mouthOpen && m.surprise > t.surprise) return 'disturbed';

  // Happy Tears: strong smile + squinting eyes
  if (m.smile > t.smile && m.squint > t.blinkThreshold) return 'happyTears';

  // Happy: general smile
  if (m.smile > t.smile) return 'happy';

  // Disturbed: mouth open without smile (shock, fear)
  if (m.mouthOpen > t.mouthOpen && m.smile < 0.08) return 'disturbed';

  return 'normal';
}

// Bump version to v8 to force fresh defaults over any stale v7 settings
const SETTINGS_KEY = 'png-vtuber-settings-v8';

function loadSettings(): AppSettings {
  try {
    // Clean up old keys
    localStorage.removeItem('png-vtuber-settings-v7');
    localStorage.removeItem('png-vtuber-settings-v6');
    localStorage.removeItem('png-vtuber-settings-v5');
    localStorage.removeItem('png-vtuber-settings-v4');
    localStorage.removeItem('png-vtuber-settings-v3');
    localStorage.removeItem('png-vtuber-settings-v2');
    localStorage.removeItem('png-vtuber-settings');

    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        sensitivity: { ...DEFAULT_SETTINGS.sensitivity, ...parsed.sensitivity },
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function persist(s: AppSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

const ZERO_METRICS: FaceMetrics = {
  mouthOpen: 0, smile: 0, blinkLeft: 0,
  blinkRight: 0, surprise: 0, squint: 0, faceDetected: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  expression:      'normal',
  faceMetrics:     ZERO_METRICS,
  cameraActive:    false,
  faceDetected:    false,
  settingsOpen:    false,
  settingsTab:     'avatar',
  isAlwaysOnTop:   false,
  isHeadless:      false,
  settings:        loadSettings(),
  trackingStatus:  'idle',
  trackingError:   null,
  speaking:        false,
  cameraSpeaking:  false,
  micSpeaking:     false,
  micLevel:        0,

  setExpression: (expression) => set({ expression }),

  setFaceMetrics: (metrics) => {
    const s = get().settings;
    const expression = deriveExpression(metrics, s);
    // Only detect camera speaking mouth movement if settings.cameraMouthTrigger is enabled
    const cameraSpeaking = !!s.cameraMouthTrigger && metrics.faceDetected && (metrics.mouthOpen > s.sensitivity.mouthOpen);
    set({ 
      faceMetrics: metrics, 
      faceDetected: metrics.faceDetected, 
      expression,
      cameraSpeaking,
      speaking: cameraSpeaking || get().micSpeaking
    });
  },

  setCameraActive:    (cameraActive) => set({ cameraActive }),
  setFaceDetected:    (faceDetected) => set({ faceDetected }),
  setSettingsOpen:    (settingsOpen) => set({ settingsOpen }),
  setSettingsTab:     (settingsTab) => set({ settingsTab }),
  setIsAlwaysOnTop:   (isAlwaysOnTop) => set({ isAlwaysOnTop }),
  setIsHeadless:      (isHeadless) => set({ isHeadless }),
  setTrackingStatus:  (trackingStatus) => set({ trackingStatus }),
  setTrackingError:   (trackingError) => set({ trackingError }),
  setSpeaking:        (micSpeaking) => set({ micSpeaking, speaking: get().cameraSpeaking || micSpeaking }),
  setMicLevel:        (micLevel) => set({ micLevel }),

  updateSettings: (patch) => {
    const s = get().settings;
    const updated: AppSettings = {
      ...s,
      ...patch,
      sensitivity: patch.sensitivity
        ? { ...s.sensitivity, ...patch.sensitivity }
        : s.sensitivity,
    };
    persist(updated);
    set({ settings: updated });
  },

  resetSettings: () => {
    persist(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
