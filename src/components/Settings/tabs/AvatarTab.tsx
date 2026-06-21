import { type FC } from 'react';
import { useAppStore } from '../../../store/useAppStore';
import { EXPRESSION_META } from '../../../types';
import type { Expression } from '../../../types';

const EXPRESSIONS: Expression[] = ['normal', 'happy', 'happyTears', 'disturbed'];

const AvatarTab: FC = () => {
  const expression = useAppStore((s) => s.expression);
  const setExpression = useAppStore((s) => s.setExpression);
  const cameraActive = useAppStore((s) => s.cameraActive);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const handleFileChange = (expr: Expression, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        updateSettings({
          customImages: {
            ...settings.customImages,
            [expr]: base64,
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = (expr: Expression) => {
    updateSettings({
      customImages: {
        ...settings.customImages,
        [expr]: '',
      }
    });
  };

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title">Expression Preview</div>
        <div className="info-box">
          <span className="info-box-icon">ℹ️</span>
          <span>
            These are your avatar expressions. Enable the camera to auto-detect your face.
            Click any expression to preview it manually.
          </span>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Expressions</div>
        <div className="expression-grid">
          {EXPRESSIONS.map((expr) => {
            const meta = EXPRESSION_META[expr];
            const isActive = expression === expr;
            return (
              <div
                key={expr}
                id={`expression-card-${expr}`}
                className={`expression-card ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (!cameraActive) setExpression(expr);
                }}
                title={`Preview: ${meta.label}`}
                style={{ cursor: cameraActive ? 'default' : 'pointer' }}
              >
                <img
                  src={settings.customImages?.[expr] || meta.imagePath}
                  alt={meta.label}
                  loading="lazy"
                />
                <div className="expression-card-label">
                  {meta.emoji} {meta.label}
                </div>
                {isActive && (
                  <div className="expression-card-badge">Active</div>
                )}
              </div>
            );
          })}
        </div>
        {cameraActive && (
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 4 }}>
            Camera is active — expressions are auto-detected
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Custom Expression Images</div>
        <div className="info-box" style={{ marginBottom: 12 }}>
          <span className="info-box-icon">📁</span>
          <span>Upload your own PNG files to customize your VTuber avatar's expressions.</span>
        </div>
        {EXPRESSIONS.map((expr) => {
          const meta = EXPRESSION_META[expr];
          const hasCustom = !!settings.customImages?.[expr];
          return (
            <div className="settings-row" key={expr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'var(--glass-hover)', border: '1px solid var(--glass-border)', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={settings.customImages?.[expr] || meta.imagePath}
                  alt={meta.label}
                  style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'contain', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)' }}
                />
                <div className="settings-row-label">
                  <span className="settings-row-title">{meta.emoji} {meta.label}</span>
                  <span className="settings-row-desc" style={{ fontSize: 9 }}>
                    {hasCustom ? 'Custom Image' : 'Default Asset'}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 6 }}>
                <label className="btn-secondary" style={{ padding: '5px 10px', fontSize: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', borderRadius: 6 }}>
                  📁 Upload
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(expr, e.target.files?.[0])}
                  />
                </label>
                {hasCustom && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '5px 10px', fontSize: 10, borderRadius: 6, color: 'rgba(239,68,68,0.9)', borderColor: 'rgba(239,68,68,0.2)' }}
                    onClick={() => handleReset(expr)}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarTab;
