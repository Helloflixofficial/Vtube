// ============================================================
// state.rs — Application state
// ============================================================

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/// App-wide settings that can be saved/loaded.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub camera_device_id: String,
    pub show_camera_preview: bool,
    pub always_on_top: bool,
    pub avatar_scale: f64,
    pub background_color: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            camera_device_id: String::new(),
            show_camera_preview: true,
            always_on_top: false,
            avatar_scale: 1.0,
            background_color: "#07070e".to_string(),
        }
    }
}

/// Shared application state managed by Tauri.
pub struct AppState {
    pub settings: Mutex<Settings>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            settings: Mutex::new(Settings::default()),
        }
    }
}

impl AppState {
    pub fn get_settings(&self) -> Settings {
        self.settings
            .lock()
            .map(|s| s.clone())
            .unwrap_or_default()
    }

    pub fn update_settings(&self, settings: Settings) {
        if let Ok(mut current) = self.settings.lock() {
            *current = settings;
        }
    }
}
