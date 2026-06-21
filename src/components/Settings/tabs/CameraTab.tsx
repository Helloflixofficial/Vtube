// ============================================================
// components/Settings/tabs/CameraTab.tsx
// ============================================================

import { type FC, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../../store/useAppStore';

const CameraTab: FC = () => {
  const cameraActive    = useAppStore((s) => s.cameraActive);
  const setCameraActive = useAppStore((s) => s.setCameraActive);
  const faceMetrics     = useAppStore((s) => s.faceMetrics);
  const faceDetected    = useAppStore((s) => s.faceDetected);
  const settings        = useAppStore((s) => s.settings);
  const updateSettings  = useAppStore((s) => s.updateSettings);
  const trackingStatus  = useAppStore((s) => s.trackingStatus);
  const trackingError   = useAppStore((s) => s.trackingError);
  const micLevel        = useAppStore((s) => s.micLevel);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Enumerate cameras (no getUserMedia — just listing devices)
  const loadDevices = async () => {
    setLoading(true);
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === 'videoinput'));
    } catch (err) {
      console.warn('[VTuber] enumerateDevices failed:', err);
    }
    setLoading(false);
  };

  useEffect(() => { loadDevices(); }, []);

  const handleSensitivity = (key: keyof typeof settings.sensitivity, val: number) => {
    updateSettings({ sensitivity: { ...settings.sensitivity, [key]: val } });
  };

  // Status badge
  const statusLabel = (() => {
    switch (trackingStatus) {
      case 'requesting_camera': return '📷 Requesting camera…';
      case 'loading_model':     return '🧠 Loading AI model…';
      case 'detecting':         return faceDetected ? '✅ Face detected!' : '🔍 Searching for face…';
      case 'error':             return '❌ Error (see below)';
      default:                  return '○ Camera off';
    }
  })();

  const m = faceMetrics;
  const metrics = [
    { name: 'Jaw Open 😮',   value: m.mouthOpen,  threshold: settings.sensitivity.mouthOpen },
    { name: 'Smile 😊',      value: m.smile,       threshold: settings.sensitivity.smile },
    { name: 'Brow Raise 😲', value: m.surprise,    threshold: settings.sensitivity.surprise },
    { name: 'Eye Squint 😂', value: m.squint,      threshold: settings.sensitivity.blinkThreshold },
    { name: 'Blink L 👁',    value: m.blinkLeft,   threshold: 0 },
    { name: 'Blink R 👁',    value: m.blinkRight,  threshold: 0 },
  ];

  return (
    <div className="settings-content">

      {/* ── Tracking Status ───────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Tracking Status</div>
        <div style={{
          padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: trackingStatus === 'detecting' && faceDetected
            ? 'rgba(34,197,94,0.08)' : trackingStatus === 'error'
            ? 'rgba(239,68,68,0.08)' : 'var(--glass-hover)',
          border: '1px solid var(--glass-border)',
          color: trackingStatus === 'detecting' && faceDetected
            ? 'var(--success)' : trackingStatus === 'error'
            ? 'var(--danger)' : 'var(--text-muted)',
        }}>
          {statusLabel}
        </div>

        {/* Error detail */}
        {trackingError && (
          <div style={{
            padding: '8px 10px', borderRadius: 8, fontSize: 11,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'rgba(255,160,160,0.9)',
          }}>
            {trackingError}
          </div>
        )}
      </div>

      {/* ── Windows Camera Fix ─────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Camera Access (Windows)</div>
        <div style={{
          padding: '10px 12px', borderRadius: 10, fontSize: 11,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: 'rgba(255,160,160,0.9)', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontWeight: 600, fontSize: 12 }}>🔒 Camera permission denied?</div>
          <ol style={{ paddingLeft: 14, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <li>Click button below to open Windows Privacy Settings</li>
            <li>Turn ON "Allow apps to access your camera"</li>
            <li>Turn ON "Allow desktop apps to access your camera"</li>
            <li>Close & reopen this app, then click Start Camera</li>
          </ol>
          <button id="btn-open-windows-camera" className="btn-secondary"
            style={{ fontSize: 11, padding: '7px 12px' }}
            onClick={() => invoke('open_camera_settings')}>
            🔧 Open Windows Camera Settings
          </button>
        </div>
      </div>

      {/* ── Device Selector ───────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Camera Device</div>
        <select id="camera-device-select" className="device-select"
          value={settings.cameraDeviceId}
          onChange={(e) => updateSettings({ cameraDeviceId: e.target.value })}>
          <option value="">Default Camera</option>
          {devices.map((d, i) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${i + 1}`}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6 }}>
          <button id="btn-refresh-cameras" className="btn-secondary"
            style={{ flex: 1, fontSize: 11 }} onClick={loadDevices} disabled={loading}>
            {loading ? <span className="spinner" /> : '🔄'} Refresh
          </button>
          <button id={cameraActive ? 'btn-stop-camera' : 'btn-start-camera'}
            className="btn-primary" style={{ flex: 2, fontSize: 11 }}
            onClick={() => setCameraActive(!cameraActive)}
            disabled={trackingStatus === 'requesting_camera' || trackingStatus === 'loading_model'}>
            {trackingStatus === 'requesting_camera' ? '⏳ Requesting…'
              : trackingStatus === 'loading_model' ? '🧠 Loading AI…'
              : cameraActive ? '⏹ Stop Camera' : '▶ Start Camera'}
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">Auto-Start on Launch</span>
            <span className="settings-row-desc">Enable camera when app opens</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={settings.autoStartCamera}
              onChange={(e) => updateSettings({ autoStartCamera: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">Use Camera Mouth Tracking</span>
            <span className="settings-row-desc">Trigger speaking when you open your mouth on camera (can be jittery)</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={settings.cameraMouthTrigger}
              onChange={(e) => updateSettings({ cameraMouthTrigger: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* ── Live Face Metrics ──────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Live Face Metrics</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            color: faceDetected ? 'var(--success)' : cameraActive ? 'var(--warning)' : 'var(--text-subtle)',
          }}>
            {faceDetected ? '● TRACKING' : cameraActive ? '◌ SEARCHING…' : '○ OFFLINE'}
          </span>
        </div>
        <div className="face-metrics">
          {metrics.map(({ name, value, threshold }) => (
            <div className="metric-row" key={name}>
              <span className="metric-name">{name}</span>
              <div className="metric-bar-bg" style={{ position: 'relative' }}>
                <div className="metric-bar" style={{
                  width: `${Math.min(100, Math.round(value * 100))}%`,
                  background: value > threshold && threshold > 0 ? 'var(--accent-light)' : 'var(--accent)',
                }} />
                {threshold > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${threshold * 100}%`, width: 1,
                    background: 'rgba(255,255,255,0.4)',
                  }} />
                )}
              </div>
              <span className="metric-value">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>
          Thin lines = threshold. Bar turns bright when expression triggers.
        </div>
      </div>

      {/* ── Sensitivity Sliders ────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Expression Thresholds</div>
        <div className="info-box">
          <span className="info-box-icon">💡</span>
          <span>Lower = triggers more easily. Watch the bars above while adjusting.</span>
        </div>
        {[
          { key: 'smile'          as const, label: '😊 Smile → Happy',           min: 0.05, max: 0.6 },
          { key: 'mouthOpen'      as const, label: '😮 Jaw Open → Disturbed',    min: 0.05, max: 0.7 },
          { key: 'surprise'       as const, label: '😲 Brow Raise → Disturbed',  min: 0.05, max: 0.7 },
          { key: 'blinkThreshold' as const, label: '😂 Eye Squint → HappyTears', min: 0.05, max: 0.6 },
        ].map(({ key, label, min, max }) => (
          <div className="slider-row" key={key}>
            <div className="slider-header">
              <span className="slider-label">{label}</span>
              <span className="slider-value">{Math.round(settings.sensitivity[key] * 100)}%</span>
            </div>
            <input id={`slider-${key}`} type="range" min={min} max={max} step={0.01}
              value={settings.sensitivity[key]}
              onChange={(e) => handleSensitivity(key, parseFloat(e.target.value))} />
          </div>
        ))}
      </div>

      {/* ── Microphone Settings ────────────────────── */}
      <div className="settings-section">
        <div className="settings-section-title">Microphone Speech Detection</div>
        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-title">Use Microphone Voice Trigger</span>
            <span className="settings-row-desc">Simulates mouth movement/speaking when you talk</span>
          </div>
          <label className="toggle-switch">
            <input id="chk-mic-enabled" type="checkbox" checked={settings.micEnabled}
              onChange={(e) => updateSettings({ micEnabled: e.target.checked })} />
            <span className="toggle-slider" />
          </label>
        </div>

        {settings.micEnabled && (
          <>
            {/* Live Mic Level progress bar */}
            <div className="slider-row" style={{ marginBottom: 10 }}>
              <div className="slider-header">
                <span className="slider-label">🔊 Live Mic Level</span>
                <span className="slider-value" style={{ color: micLevel > settings.micSensitivity ? 'var(--success)' : 'var(--text-subtle)' }}>
                  {micLevel}%
                </span>
              </div>
              <div className="metric-bar-bg" style={{ position: 'relative', height: 8, borderRadius: 4 }}>
                <div className="metric-bar" style={{
                  height: '100%',
                  borderRadius: 4,
                  width: `${Math.min(100, micLevel)}%`,
                  background: micLevel > settings.micSensitivity ? 'var(--success)' : 'var(--accent)',
                  transition: 'width 0.05s ease',
                }} />
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${settings.micSensitivity}%`, width: 2,
                  background: 'rgba(255,255,255,0.6)',
                  zIndex: 2,
                }} title={`Threshold: ${settings.micSensitivity}%`} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>
                White line is threshold. Bar turns green when speaking triggers.
              </div>
            </div>

            <div className="slider-row">
              <div className="slider-header">
                <span className="slider-label">🎙️ Mic Sensitivity Threshold</span>
                <span className="slider-value">{settings.micSensitivity}%</span>
              </div>
              <input id="slider-mic-sensitivity" type="range" min={2} max={60} step={1}
                value={settings.micSensitivity}
                onChange={(e) => updateSettings({ micSensitivity: parseInt(e.target.value) })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-subtle)', marginTop: 2 }}>
                <span>Very Sensitive (2%)</span>
                <span>Loud Voice Only (60%)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Privacy ────────────────────────────────── */}
      <div className="settings-section">
        <div className="info-box" style={{ background: 'rgba(34,197,94,0.07)', borderColor: 'rgba(34,197,94,0.2)' }}>
          <span className="info-box-icon">🔒</span>
          <span style={{ color: 'rgba(134,239,172,0.9)' }}>
            All AI and Audio processing runs locally. No audio or video is sent to any server.
          </span>
        </div>
      </div>
    </div>
  );
};

export default CameraTab;
