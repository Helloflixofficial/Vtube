// ============================================================
// types/index.ts
// ============================================================

export type Expression = 'normal' | 'happy' | 'happyTears' | 'disturbed';

/** 
 * Face metrics derived from MediaPipe FaceLandmarker blend shapes.
 * All values are 0–1.
 */
export interface FaceMetrics {
  /** jaw open (0=closed, 1=wide open) */
  mouthOpen:   number;
  /** average smile score from both corners */
  smile:       number;
  /** blink score LEFT eye (0=open, 1=closed) */
  blinkLeft:   number;
  /** blink score RIGHT eye (0=open, 1=closed) */
  blinkRight:  number;
  /** brow raised / surprised */
  surprise:    number;
  /** cheek squint — eyes squinting from happiness */
  squint:      number;
  /** whether a face is currently detected */
  faceDetected: boolean;
}

export interface Sensitivity {
  mouthOpen:  number;   // jaw open threshold for "disturbed"
  smile:      number;   // smile threshold for "happy"
  surprise:   number;   // surprise threshold for "disturbed"
  blinkThreshold: number; // eye openness threshold for "happy tears"
}

export interface AppSettings {
  cameraDeviceId:    string;
  showCameraPreview: boolean;
  alwaysOnTop:       boolean;
  avatarScale:       number;
  backgroundColor:   string;
  sensitivity:       Sensitivity;
  autoStartCamera:   boolean;
  headlessMode:      boolean;
  micEnabled:        boolean;
  micSensitivity:    number; // 0-100 threshold
  avatarOffsetX:     number;
  avatarOffsetY:     number;
  customImages:      Record<Expression, string>;
  cameraMouthTrigger:boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  cameraDeviceId:    '',
  showCameraPreview: true,
  alwaysOnTop:       false,
  avatarScale:       1.0,
  backgroundColor:   'transparent',
  sensitivity: {
    mouthOpen:  0.20,   // 20% jaw open = disturbed (shock)
    smile:      0.15,   // 15% smile corners = happy
    surprise:   0.20,   // 20% brow raise = disturbed (surprised)
    blinkThreshold: 0.30, // eye squint threshold for happy tears
  },
  autoStartCamera: true,
  headlessMode:    false,
  micEnabled:      true,
  micSensitivity:  25, // 25% volume triggers speaking (less sensitive to background noise)
  avatarOffsetX:   0,
  avatarOffsetY:   0,
  customImages: {
    normal: '',
    happy: '',
    happyTears: '',
    disturbed: '',
  },
  cameraMouthTrigger: false,
};

export const EXPRESSION_META: Record<Expression, { label: string; emoji: string; imagePath: string }> = {
  normal:     { label: 'Normal',      emoji: '😐', imagePath: '/expressions/normal-face.png' },
  happy:      { label: 'Happy',       emoji: '😊', imagePath: '/expressions/happy.png'        },
  happyTears: { label: 'Happy Tears', emoji: '😂', imagePath: '/expressions/happy-tears.png'  },
  disturbed:  { label: 'Disturbed',   emoji: '😨', imagePath: '/expressions/disturbed.png'    },
};
