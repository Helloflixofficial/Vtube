// ============================================================
// components/AvatarDisplay/AvatarDisplay.tsx
// ============================================================

import { type FC, useRef, useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useFaceTracking } from '../../hooks/useFaceTracking';
import { useMicSpeech } from '../../hooks/useMicSpeech';
import { EXPRESSION_META } from '../../types';
import type { Expression } from '../../types';

const EXPRESSIONS: Expression[] = ['normal', 'happy', 'happyTears', 'disturbed'];

const AvatarDisplay: FC = () => {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const previewRef   = useRef<HTMLVideoElement>(null);
  const expression   = useAppStore((s) => s.expression);
  const cameraActive = useAppStore((s) => s.cameraActive);
  const speaking     = useAppStore((s) => s.speaking);
  const settings     = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  // Dragging logic to reposition avatar
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });
  const [localOffset, setLocalOffset] = useState({ x: settings.avatarOffsetX ?? 0, y: settings.avatarOffsetY ?? 0 });

  // Keep local offset synced if settings are updated or reset from elsewhere
  useEffect(() => {
    setLocalOffset({ x: settings.avatarOffsetX ?? 0, y: settings.avatarOffsetY ?? 0 });
  }, [settings.avatarOffsetX, settings.avatarOffsetY]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { x: settings.avatarOffsetX ?? 0, y: settings.avatarOffsetY ?? 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setLocalOffset({
      x: startOffset.current.x + dx,
      y: startOffset.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    updateSettings({
      avatarOffsetX: localOffset.x,
      avatarOffsetY: localOffset.y,
    });
  };

  // Start/stop face tracking based on cameraActive flag
  useFaceTracking({
    videoRef,
    deviceId: settings.cameraDeviceId || undefined,
    enabled: cameraActive,
  });

  // Start microphone level detection
  useMicSpeech({
    enabled: settings.micEnabled,
    sensitivity: settings.micSensitivity,
  });

  // Mirror the tracking video's stream to the preview pip
  useEffect(() => {
    const id = setInterval(() => {
      if (previewRef.current && videoRef.current) {
        const src = videoRef.current.srcObject;
        if (previewRef.current.srcObject !== src) {
          previewRef.current.srcObject = src;
          if (src) previewRef.current.play().catch(() => {});
        }
      }
    }, 500);
    return () => clearInterval(id);
  }, [cameraActive]);

  const scale = settings.avatarScale ?? 1.0;
  const displayExpression = speaking ? 'happy' : expression;

  return (
    <div className="avatar-wrapper">
      {/* Hidden video element — MediaPipe reads frames from this */}
      <video
        ref={videoRef}
        id="face-tracking-video"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '640px', height: '480px', opacity: 0, pointerEvents: 'none' }}
        autoPlay playsInline muted
      />

      {/* Repositioning wrapper (handles X/Y offsets & scale) */}
      <div
        className="avatar-position-wrapper"
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `translate(${localOffset.x}px, ${localOffset.y}px) scale(${scale})`,
          transition: isDragging.current ? 'none' : 'transform 0.1s ease',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Avatar PNG stack (handles bounce animation on speaking) */}
        <div className={`avatar-image-container ${speaking ? 'speaking' : ''}`}>
          {EXPRESSIONS.map((expr) => (
            <img
              key={expr}
              id={`avatar-img-${expr}`}
              src={settings.customImages?.[expr] || EXPRESSION_META[expr].imagePath}
              alt={EXPRESSION_META[expr].label}
              className="avatar-img"
              style={{
                opacity: expr === displayExpression ? 1 : 0,
                zIndex: expr === displayExpression ? 2 : 0,
                transition: 'opacity 0.12s ease',
              }}
              draggable={false}
            />
          ))}
        </div>
      </div>

      {/* Camera preview pip (bottom-left corner) */}
      {settings.showCameraPreview && cameraActive && (
        <div className="camera-preview">
          <video
            ref={previewRef}
            id="camera-preview-video"
            autoPlay playsInline muted
          />
          <div className="camera-preview-label">Live</div>
        </div>
      )}
    </div>
  );
};

export default AvatarDisplay;
