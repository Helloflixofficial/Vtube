// ============================================================
// components/Settings/SettingsPanel.tsx — BongoCat-style settings
// ============================================================

import { type FC } from 'react';
import { useAppStore } from '../../store/useAppStore';
import AvatarTab from './tabs/AvatarTab';
import CameraTab from './tabs/CameraTab';
import AppearanceTab from './tabs/AppearanceTab';
import GeneralTab from './tabs/GeneralTab';

const TABS = [
  { id: 'avatar',      label: 'Avatar',        icon: '🎭' },
  { id: 'camera',      label: 'Camera & Mic',  icon: '📷' },
  { id: 'appearance',  label: 'Appearance',    icon: '🎨' },
  { id: 'general',     label: 'General',       icon: '⚙️' },
] as const;

const SettingsPanel: FC = () => {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const settingsTab  = useAppStore((s) => s.settingsTab);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setSettingsTab  = useAppStore((s) => s.setSettingsTab);

  if (!settingsOpen) return null;

  const renderTab = () => {
    switch (settingsTab) {
      case 'avatar':     return <AvatarTab />;
      case 'camera':     return <CameraTab />;
      case 'appearance': return <AppearanceTab />;
      case 'general':    return <GeneralTab />;
    }
  };

  return (
    <div className="settings-overlay" id="settings-overlay">
      {/* Click backdrop to close */}
      <div
        className="settings-backdrop"
        id="settings-backdrop"
        onClick={() => setSettingsOpen(false)}
      />

      <div className="settings-panel" id="settings-panel">

        {/* Header */}
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <button
            id="settings-close-btn"
            className="settings-close-btn"
            onClick={() => setSettingsOpen(false)}
            title="Close settings"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              role="tab"
              aria-selected={settingsTab === tab.id}
              className={`settings-tab ${settingsTab === tab.id ? 'active' : ''}`}
              onClick={() => setSettingsTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderTab()}
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <div className="version-info">PNG VTuber v0.1.0 — All settings saved automatically</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
