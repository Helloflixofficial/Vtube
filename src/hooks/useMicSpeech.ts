// ============================================================
// hooks/useMicSpeech.ts
// Real-time microphone level monitoring using Web Audio API
// ============================================================

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

interface Options {
  enabled: boolean;
  sensitivity: number; // 0-100 threshold
}

export function useMicSpeech({ enabled, sensitivity }: Options) {
  const setSpeaking = useAppStore((s) => s.setSpeaking);
  const setMicLevel = useAppStore((s) => s.setMicLevel);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let aborted = false;

    async function initAudio() {
      if (!enabled) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        if (aborted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        let smoothVolume = 0;
        let noiseFloor = 0;
        let isFirstFrame = true;
        let speakHoldCounter = 0;
        const HOLD_FRAMES = 8; // keep speaking status active for ~120ms (8 frames at 60fps) to avoid flickering

        const checkVolume = () => {
          if (aborted) return;
          analyser.getByteFrequencyData(dataArray);

          // Focus on human speech frequencies (roughly 300Hz to 4000Hz: indices 2 to 25)
          let voiceSum = 0;
          const startBin = 2;
          const endBin = Math.min(25, dataArray.length);
          const count = endBin - startBin;

          for (let i = startBin; i < endBin; i++) {
            voiceSum += dataArray[i];
          }
          const voiceAverage = count > 0 ? voiceSum / count : 0;
          const voicePercentage = (voiceAverage / 255) * 100;

          // Smooth volume to ignore short keyboard click spikes
          smoothVolume = smoothVolume * 0.6 + voicePercentage * 0.4;

          // Dynamically adapt to room noise floor
          if (isFirstFrame) {
            noiseFloor = smoothVolume;
            isFirstFrame = false;
          } else {
            if (smoothVolume < noiseFloor) {
              // Rapidly track down if current level is lower
              noiseFloor = noiseFloor * 0.9 + smoothVolume * 0.1;
            } else {
              // Extremely slowly drift up to adapt to new background sounds
              noiseFloor = Math.min(30, noiseFloor + 0.005);
            }
          }

          // Effective volume is only the signal exceeding the noise floor
          const adjustedVolume = Math.max(0, smoothVolume - noiseFloor);

          // Send live level to store for visual slider feedback
          setMicLevel(Math.round(adjustedVolume));

          const thresholdMet = adjustedVolume > sensitivity;

          if (thresholdMet) {
            speakHoldCounter = HOLD_FRAMES;
          } else if (speakHoldCounter > 0) {
            speakHoldCounter--;
          }

          const isSpeaking = speakHoldCounter > 0;
          setSpeaking(isSpeaking);

          rafRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        console.warn('[VTuber] Microphone access failed:', err);
      }
    }

    initAudio();

    return () => {
      aborted = true;
      cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setSpeaking(false);
      setMicLevel(0);
    };
  }, [enabled, sensitivity, setSpeaking]);
}
