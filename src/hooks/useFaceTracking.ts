// ============================================================
// hooks/useFaceTracking.ts
// Real-time face tracking via @mediapipe/tasks-vision (local WASM + model)
//
// ARCHITECTURE:
//   useEffect(enabled) → startTracking() → getUserMedia → FaceLandmarker → RAF loop
//   The abort ref pattern prevents leaked streams when cleanup races startTracking.
// ============================================================

import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { useAppStore } from '../store/useAppStore';
import type { FaceMetrics } from '../types';

interface Options {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  deviceId?: string;
  enabled:  boolean;
}

// ─── Singleton FaceLandmarker (loads once, lives forever) ──────
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

async function loadLandmarker(): Promise<FaceLandmarker> {
  console.log('[VTuber] ⏳ Loading FaceLandmarker (WASM + model)…');
  const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
  const lm = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/face_landmarker.task',
      delegate: 'CPU',
    },
    outputFaceBlendshapes: true,
    runningMode: 'VIDEO',
    numFaces: 1,
  });
  console.log('[VTuber] ✅ FaceLandmarker ready');
  return lm;
}

function getLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = loadLandmarker().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

// ─── Helpers ───────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type BS = { categoryName: string; score: number };
const bs = (cats: BS[], name: string) =>
  cats.find((c) => c.categoryName === name)?.score ?? 0;

const ZERO: FaceMetrics = {
  mouthOpen: 0, smile: 0, blinkLeft: 0,
  blinkRight: 0, surprise: 0, squint: 0, faceDetected: false,
};

// ─── Hook ──────────────────────────────────────────────────────
export function useFaceTracking({ videoRef, deviceId, enabled }: Options) {
  const rafRef     = useRef(0);
  const streamRef  = useRef<MediaStream | null>(null);
  const smoothRef  = useRef<FaceMetrics>({ ...ZERO });

  // Stable store selectors (Zustand guarantees referential stability)
  const setFaceMetrics    = useAppStore.getState().setFaceMetrics;
  const setCameraActive   = useAppStore.getState().setCameraActive;
  const setTrackingStatus = useAppStore.getState().setTrackingStatus;
  const setTrackingError  = useAppStore.getState().setTrackingError;

  useEffect(() => {
    // Abort flag — set to true when this effect's cleanup runs.
    // This prevents a race where startTracking() is still awaiting
    // getUserMedia/model load when the user clicks Stop or the
    // component unmounts.
    let aborted = false;

    function cleanup() {
      aborted = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) video.srcObject = null;
      setCameraActive(false);
      smoothRef.current = { ...ZERO };
      setFaceMetrics({ ...ZERO });
      setTrackingStatus('idle');
    }

    async function startTracking() {
      const video = videoRef.current;
      if (!video) {
        console.warn('[VTuber] No video element ref');
        return;
      }

      // Cleanup any leftover stream from a prior run
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      cancelAnimationFrame(rafRef.current);

      // ── Step 1: Request camera ──────────────────────────
      setTrackingStatus('requesting_camera');
      setTrackingError(null);
      console.log('[VTuber] 📷 Requesting camera…', deviceId ? `device=${deviceId}` : 'default');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          deviceId
            ? { video: { deviceId: { exact: deviceId }, width: 640, height: 480 } }
            : { video: { width: 640, height: 480, facingMode: 'user' } },
        );
      } catch (err: unknown) {
        if (aborted) return;
        const name = (err as DOMException)?.name ?? '';
        const msg = (err as Error)?.message ?? String(err);
        console.error('[VTuber] ❌ Camera failed:', name, msg);

        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setTrackingError('Camera blocked by Windows. Open Settings → Privacy → Camera → Enable desktop apps.');
        } else if (name === 'NotReadableError') {
          setTrackingError('Camera is being used by another app. Close it and try again.');
        } else if (name === 'NotFoundError') {
          setTrackingError('No camera found. Plug in a webcam.');
        } else {
          setTrackingError(`Camera error: ${name}: ${msg}`);
        }
        setTrackingStatus('error');
        setCameraActive(false);
        return;
      }

      // Check abort AFTER the await (cleanup may have run while we waited)
      if (aborted) {
        console.log('[VTuber] Aborted after getUserMedia — releasing stream');
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;

      // Wait for video to be playable
      try {
        if (video.readyState < 2) {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video metadata timeout')), 8000);
            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              video.play().then(resolve).catch(resolve);
            };
          });
        } else {
          await video.play();
        }
      } catch (err) {
        if (aborted) return;
        console.error('[VTuber] ❌ Video play failed:', err);
        setTrackingError('Failed to play camera stream.');
        setTrackingStatus('error');
        return;
      }

      if (aborted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      setCameraActive(true);
      console.log('[VTuber] ✅ Camera streaming');

      // ── Step 2: Load AI model ───────────────────────────
      setTrackingStatus('loading_model');
      console.log('[VTuber] 🧠 Loading face detection model…');

      let landmarker: FaceLandmarker;
      try {
        landmarker = await getLandmarker();
      } catch (err) {
        if (aborted) return;
        console.error('[VTuber] ❌ Model load failed:', err);
        setTrackingError('Failed to load face detection AI model.');
        setTrackingStatus('error');
        return;
      }

      if (aborted) return;

      // ── Step 3: Start detection loop ────────────────────
      setTrackingStatus('detecting');
      setTrackingError(null);
      console.log('[VTuber] 🔍 Face detection started!');

      let lastTime = -1;
      let frameCount = 0;

      const loop = () => {
        if (aborted) return;
        rafRef.current = requestAnimationFrame(loop);

        if (video.readyState < 2 || video.paused) return;

        const now = performance.now();
        if (now === lastTime) return;
        lastTime = now;

        let result;
        try {
          result = landmarker.detectForVideo(video, now);
        } catch {
          return;
        }

        const cats: BS[] = result.faceBlendshapes?.[0]?.categories ?? [];

        if (cats.length === 0) {
          // No face → lerp back to zero
          const prev = smoothRef.current;
          const fade: FaceMetrics = {
            mouthOpen:    lerp(prev.mouthOpen,    0, 0.12),
            smile:        lerp(prev.smile,         0, 0.12),
            blinkLeft:    lerp(prev.blinkLeft,     0, 0.12),
            blinkRight:   lerp(prev.blinkRight,    0, 0.12),
            surprise:     lerp(prev.surprise,      0, 0.12),
            squint:       lerp(prev.squint,        0, 0.12),
            faceDetected: false,
          };
          smoothRef.current = fade;
          setFaceMetrics(fade);
          return;
        }

        // Extract raw blend shapes
        const rawJaw     = bs(cats, 'jawOpen');
        const rawSmile   = (bs(cats, 'mouthSmileLeft') + bs(cats, 'mouthSmileRight')) / 2;
        const rawBlinkL  = bs(cats, 'eyeBlinkLeft');
        const rawBlinkR  = bs(cats, 'eyeBlinkRight');
        const rawBrowIn  = bs(cats, 'browInnerUp');
        const rawBrowOL  = bs(cats, 'browOuterUpLeft');
        const rawBrowOR  = bs(cats, 'browOuterUpRight');
        const rawSurp    = (rawBrowIn + rawBrowOL + rawBrowOR) / 3;
        const rawSquint  = (bs(cats, 'cheekSquintLeft') + bs(cats, 'cheekSquintRight')) / 2;

        // Smooth with lerp
        const α = 0.35;
        const prev = smoothRef.current;
        const m: FaceMetrics = {
          mouthOpen:    lerp(prev.mouthOpen,   rawJaw,    α),
          smile:        lerp(prev.smile,        rawSmile,  α),
          blinkLeft:    lerp(prev.blinkLeft,    rawBlinkL, α),
          blinkRight:   lerp(prev.blinkRight,   rawBlinkR, α),
          surprise:     lerp(prev.surprise,     rawSurp,   α),
          squint:       lerp(prev.squint,       rawSquint, α),
          faceDetected: true,
        };
        smoothRef.current = m;
        setFaceMetrics(m);

        // Log first few frames for debugging
        frameCount++;
        if (frameCount <= 3 || frameCount % 300 === 0) {
          console.log(
            `[VTuber] Frame ${frameCount}: jaw=${rawJaw.toFixed(2)} smile=${rawSmile.toFixed(2)} ` +
            `surprise=${rawSurp.toFixed(2)} squint=${rawSquint.toFixed(2)}`
          );
        }
      };

      loop();
    }

    if (enabled) {
      startTracking();
    }

    return cleanup;
  // We intentionally only react to `enabled` and `deviceId` changes.
  // The store selectors are stable (getState).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, deviceId]);
}

declare global {
  interface Window { __cameraPermissionDenied?: boolean; }
}
