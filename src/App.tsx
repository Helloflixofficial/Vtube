// ============================================================
// App.tsx — PNG VTuber main window
// ============================================================

import { type FC, useEffect, useCallback, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from './store/useAppStore';
import AvatarDisplay from './components/AvatarDisplay/AvatarDisplay';
import SettingsPanel from './components/Settings/SettingsPanel';
import { EXPRESSION_META } from './types';
import type { Expression } from './types';
import './App.css';

const appWindow = getCurrentWindow();

const App: FC = () => {
  const expression      = useAppStore((s) => s.expression);
  const cameraActive    = useAppStore((s) => s.cameraActive);
  const faceDetected    = useAppStore((s) => s.faceDetected);
  const settingsOpen    = useAppStore((s) => s.settingsOpen);
  const isAlwaysOnTop   = useAppStore((s) => s.isAlwaysOnTop);
  const isHeadless      = useAppStore((s) => s.isHeadless);
  const settings        = useAppStore((s) => s.settings);
  const trackingStatus  = useAppStore((s) => s.trackingStatus);
  const trackingError   = useAppStore((s) => s.trackingError);
  const setCameraActive   = useAppStore((s) => s.setCameraActive);
  const setSettingsOpen   = useAppStore((s) => s.setSettingsOpen);
  const setExpression     = useAppStore((s) => s.setExpression);
  const setIsAlwaysOnTop  = useAppStore((s) => s.setIsAlwaysOnTop);
  const setIsHeadless     = useAppStore((s) => s.setIsHeadless);

  // ── Tray events from Rust ───────────────────────────────
  useEffect(() => {
    const unlisten1 = listen('tray-open-settings', () => setSettingsOpen(true));
    const unlisten2 = listen('tray-toggle-always-top', () => {
      const next = !useAppStore.getState().isAlwaysOnTop;
      setIsAlwaysOnTop(next);
      invoke('set_always_on_top', { value: next });
    });
    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
    };
  }, [setSettingsOpen, setIsAlwaysOnTop]);

  // ── Auto-start camera if enabled ────────────────────────
  useEffect(() => {
    if (settings.autoStartCamera) {
      const t = setTimeout(() => setCameraActive(true), 1500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const s = useAppStore.getState();
    switch (e.key.toLowerCase()) {
      case 's': setSettingsOpen(!s.settingsOpen); break;
      case 'c': setCameraActive(!s.cameraActive); break;
      case 'r': setExpression('normal'); break;
      case 'h': setIsHeadless(!s.isHeadless); break;
      case 'escape': if (s.settingsOpen) setSettingsOpen(false); break;
    }
  }, [setSettingsOpen, setCameraActive, setExpression, setIsHeadless]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Window controls ─────────────────────────────────────
  const toggleAlwaysOnTop = async () => {
    const next = !isAlwaysOnTop;
    setIsAlwaysOnTop(next);
    await invoke('set_always_on_top', { value: next });
  };
  const handleMinimize  = () => appWindow.minimize();
  const handleHide      = () => invoke('hide_window');
  const handleClose     = () => invoke('exit_app');
  const handleStartDrag = () => appWindow.startDragging();

  // ── Status pill text ────────────────────────────────────
  const statusText = (() => {
    switch (trackingStatus) {
      case 'requesting_camera': return 'Camera…';
      case 'loading_model':     return 'Loading AI…';
      case 'detecting':         return faceDetected ? 'Tracking' : 'No Face';
      case 'error':             return 'Error';
      default:                  return 'Offline';
    }
  })();

  const statusClass = (() => {
    if (trackingStatus === 'detecting' && faceDetected) return 'detected';
    if (trackingStatus === 'detecting') return 'on';
    if (trackingStatus === 'requesting_camera' || trackingStatus === 'loading_model') return 'loading';
    if (trackingStatus === 'error') return 'error';
    return 'off';
  })();

  const meta = EXPRESSION_META[expression];

  return (
    <div
      id="app-root"
      className={`app-root ${isHeadless ? 'headless' : ''}`}
      style={{ background: settings.backgroundColor }}
    >
      {/* ── Custom Titlebar ─────────────────────────── */}
      {!isHeadless && (
        <header className="app-titlebar" id="app-titlebar" onMouseDown={handleStartDrag}>
          <div className="titlebar-logo" onMouseDown={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="titlebar-logo-icon">🎭</div>
            {/* Status dot */}
            <div
              className={`status-pill ${statusClass}`}
              title={statusText}
              style={{ padding: 0, minWidth: 'auto', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}
            >
              <span className="status-dot" style={{ margin: 0, width: 8, height: 8 }} />
            </div>
          </div>

          {/* Window control buttons */}
          <div className="titlebar-btns" onMouseDown={(e) => e.stopPropagation()}>
            <button
              id="btn-settings"
              className={`win-btn ${settingsOpen ? 'active' : ''}`}
              title="Settings (S)"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >⚙️</button>
            <button id="btn-pin" className={`win-btn ${isAlwaysOnTop ? 'active' : ''}`}
              title="Always on Top" onClick={toggleAlwaysOnTop}>📌</button>
            <button id="btn-headless" className="win-btn"
              title="Headless mode (H)" onClick={() => setIsHeadless(true)}>⬜</button>
            <button id="btn-minimize" className="win-btn"
              title="Minimize" onClick={handleMinimize}>─</button>
            <button id="btn-hide-tray" className="win-btn"
              title="Hide to tray" onClick={handleHide}>🔽</button>
            <button id="btn-close" className="win-btn win-btn-close"
              title="Exit" onClick={handleClose}>✕</button>
          </div>
        </header>
      )}

      {/* ── Headless drag handle ─────────────────────── */}
      {isHeadless && (
        <div className="headless-drag-handle" onMouseDown={handleStartDrag}>
          <button id="btn-exit-headless" className="headless-exit-btn"
            title="Exit headless mode (H)"
            onClick={() => setIsHeadless(false)}
            onMouseDown={(e) => e.stopPropagation()}>⬛</button>
        </div>
      )}

      {/* ── Avatar ──────────────────────────────────── */}
      <main className="avatar-section" id="avatar-section">
        <AvatarDisplay />
      </main>

      {/* ── Error Banner ─────────────────────────────── */}
      {trackingError && (
        <div className="perm-banner">
          <span className="perm-icon">⚠️</span>
          <div className="perm-text">
            <strong>Camera Error</strong>
            <span>{trackingError}</span>
          </div>
          <button
            id="btn-fix-camera"
            className="perm-fix-btn"
            onClick={() => {
              invoke('open_camera_settings');
              useAppStore.getState().setTrackingError(null);
            }}
          >
            Fix
          </button>
        </div>
      )}

      <SettingsPanel />
    </div>
  );
};

export default App;
