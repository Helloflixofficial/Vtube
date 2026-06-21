// ============================================================================
// components/Camera/CameraPreview.tsx — Camera preview (placeholder)
// ============================================================================
//
// Placeholder component for future webcam preview display.
// Will show the camera feed alongside the avatar for calibration.
// ============================================================================

import { type FC } from 'react';

/**
 * Camera preview component.
 *
 * Currently a placeholder. When implemented, this will:
 * - Display the webcam feed via a <video> element
 * - Show face tracking landmarks overlay
 * - Allow camera selection and configuration
 */
const CameraPreview: FC = () => {
  return (
    <div className="camera-preview" id="camera-preview">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '200px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: '0.75rem',
        fontWeight: 500,
      }}>
        📷 Camera Preview
        <br />
        (Coming Soon)
      </div>
    </div>
  );
};

export default CameraPreview;
