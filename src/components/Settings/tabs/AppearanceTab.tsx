// ============================================================
// components/Settings/tabs/AppearanceTab.tsx
// ============================================================

import { type FC } from 'react';
import { useAppStore } from '../../../store/useAppStore';

const BG_PRESETS = [
  { label: 'Transparent',  value: 'transparent',  isTransparent: true },
  { label: 'Pure Black',   value: '#000000' },
  { label: 'Dark',         value: '#07070e' },
  { label: 'Deep Purple',  value: '#0d0515' },
  { label: 'Navy',         value: '#050a18' },
  { label: 'Green Chroma', value: '#00ff00' },
  { label: 'Blue Chroma',  value: '#0000ff' },
];

const AppearanceTab: FC = () => {
  const settings       = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="settings-content">

      {/* ── Avatar Scale ─────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Avatar Size</div>
        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-label">Scale</span>
            <span className="slider-value">{settings.avatarScale.toFixed(2)}×</span>
          </div>
          <input
            id="slider-avatar-scale"
            type="range" min={0.3} max={2.5} step={0.05}
            value={settings.avatarScale}
            onChange={(e) => updateSettings({ avatarScale: parseFloat(e.target.value) })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>
            <span>Tiny (0.3×)</span>
            <span>Giant (2.5×)</span>
          </div>
        </div>
      </div>

      {/* ── Reposition Avatar ───────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Reposition Position</span>
          <button id="btn-reset-position" className="btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }}
            onClick={() => updateSettings({ avatarOffsetX: 0, avatarOffsetY: 0 })}>
            🔄 Reset Position
          </button>
        </div>
        
        <div className="info-box" style={{ marginBottom: 12 }}>
          <span className="info-box-icon">💡</span>
          <span>You can also <strong>click and drag</strong> the avatar directly inside the app window to move it!</span>
        </div>

        <div className="slider-row">
          <div className="slider-header">
            <span className="slider-label">Horizontal Offset (X)</span>
            <span className="slider-value">{settings.avatarOffsetX ?? 0}px</span>
          </div>
          <input
            id="slider-avatar-x"
            type="range" min={-300} max={300} step={1}
            value={settings.avatarOffsetX ?? 0}
            onChange={(e) => updateSettings({ avatarOffsetX: parseInt(e.target.value) })}
          />
        </div>

        <div className="slider-row" style={{ marginTop: 10 }}>
          <div className="slider-header">
            <span className="slider-label">Vertical Offset (Y)</span>
            <span className="slider-value">{settings.avatarOffsetY ?? 0}px</span>
          </div>
          <input
            id="slider-avatar-y"
            type="range" min={-300} max={300} step={1}
            value={settings.avatarOffsetY ?? 0}
            onChange={(e) => updateSettings({ avatarOffsetY: parseInt(e.target.value) })}
          />
        </div>
      </div>

      {/* ── Background ───────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Background</div>

        <div className="info-box">
          <span className="info-box-icon">💡</span>
          <span>
            Use <strong>Transparent</strong> to overlay avatar on your desktop.
            Use <strong>Green Chroma</strong> for OBS green screen key.
          </span>
        </div>

        <div className="settings-row settings-row-full">
          <span className="settings-row-title">Presets</span>
          <div className="bg-swatches">
            {BG_PRESETS.map((p) => (
              <button
                key={p.value}
                id={`bg-swatch-${p.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`bg-swatch ${settings.backgroundColor === p.value ? 'selected' : ''}`}
                title={p.label}
                onClick={() => updateSettings({ backgroundColor: p.value })}
                style={{
                  background: p.isTransparent
                    ? 'repeating-conic-gradient(#333 0% 25%, #555 0% 50%) 0 0 / 8px 8px'
                    : p.value,
                }}
              />
            ))}
            {/* Custom color picker */}
            <input
              id="bg-color-custom"
              type="color"
              title="Custom color"
              value={settings.backgroundColor === 'transparent' ? '#000000' : settings.backgroundColor}
              onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
              style={{
                width: 30, height: 30, borderRadius: 7,
                border: '2px solid var(--glass-border)',
                background: 'none', cursor: 'pointer', padding: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Current: <code style={{ fontSize: 9 }}>{settings.backgroundColor}</code>
          </span>
        </div>

        {/* Preview */}
        <div style={{
          height: 60, borderRadius: 10,
          border: '1px solid var(--glass-border)',
          background: settings.backgroundColor === 'transparent'
            ? 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 0 0 / 12px 12px'
            : settings.backgroundColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          transition: 'background 0.3s ease',
        }}>
          Background Preview
        </div>
      </div>

    </div>
  );
};

export default AppearanceTab;
