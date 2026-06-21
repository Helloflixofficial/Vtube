// ============================================================
// components/Settings/tabs/GeneralTab.tsx
// ============================================================

import { type FC } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppStore } from '../../../store/useAppStore';

const appWindow = getCurrentWindow();

const GeneralTab: FC = () => {
  const settings       = useAppStore((s) => s.settings);
  const isAlwaysOnTop  = useAppStore((s) => s.isAlwaysOnTop);
  const isHeadless     = useAppStore((s) => s.isHeadless);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetSettings  = useAppStore((s) => s.resetSettings);
  const setIsAlwaysOnTop = useAppStore((s) => s.setIsAlwaysOnTop);
  const setIsHeadless    = useAppStore((s) => s.setIsHeadless);

  const toggleAlwaysOnTop = async () => {
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    await invoke('set_always_on_top', { value: next });
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) resetSettings();
  };

  const handleHideToTray = () => invoke('hide_window');
  const handleExit       = () => invoke('exit_app');
  const handleMinimize   = () => appWindow.minimize();

  return (
    <div className="settings-content">

      {/* ── Window ──────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Window</div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">📌 Always on Top</span>
            <span className="settings-row-desc">Keep avatar above other windows</span>
          </div>
          <label className="toggle-switch" id="toggle-always-on-top">
            <input type="checkbox" checked={isAlwaysOnTop} onChange={toggleAlwaysOnTop} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">⬜ Headless Mode</span>
            <span className="settings-row-desc">Hide controls, show only avatar</span>
          </div>
          <label className="toggle-switch" id="toggle-headless">
            <input type="checkbox" checked={isHeadless} onChange={(e) => setIsHeadless(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">📷 Camera Preview Pip</span>
            <span className="settings-row-desc">Show webcam in corner of avatar</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.showCameraPreview}
              onChange={(e) => updateSettings({ showCameraPreview: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button id="btn-minimize-window" className="btn-secondary" onClick={handleMinimize}>
            ─  Minimize Window
          </button>
          <button id="btn-hide-to-tray" className="btn-secondary" onClick={handleHideToTray}>
            🔽  Hide to System Tray
          </button>
          <button id="btn-exit-app" className="btn-secondary btn-danger" onClick={handleExit}>
            ✕  Exit App
          </button>
        </div>
      </div>

      {/* ── Keyboard Shortcuts ───────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Keyboard Shortcuts</div>
        {[
          { label: 'Toggle Settings',   keys: ['S'] },
          { label: 'Toggle Camera',     keys: ['C'] },
          { label: 'Reset Expression',  keys: ['R'] },
          { label: 'Headless Mode',     keys: ['H'] },
          { label: 'Close Settings',    keys: ['Esc'] },
        ].map(({ label, keys }) => (
          <div className="settings-row" key={label}>
            <span className="settings-row-title">{label}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {keys.map((k) => <span key={k} className="hotkey-badge">{k}</span>)}
            </div>
          </div>
        ))}
      </div>

      {/* ── About ───────────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">About</div>
        <div className="settings-row settings-row-full">
          {[
            ['App',         'PNG VTuber'],
            ['Version',     '0.1.0'],
            ['Engine',      'Tauri v2 + React'],
            ['Face AI',     'MediaPipe Tasks Vision'],
            ['Model',       'FaceLandmarker (local)'],
            ['Inspired by', 'BongoCat ↗'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Danger Zone ─────────────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ color: 'var(--danger)' }}>Danger Zone</div>
        <button id="btn-reset-settings" className="btn-secondary btn-danger" onClick={handleReset}>
          🔄 Reset All Settings to Defaults
        </button>
      </div>

    </div>
  );
};

export default GeneralTab;
