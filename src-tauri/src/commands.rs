// ============================================================
// commands.rs — Tauri IPC commands
// ============================================================

use std::sync::Arc;
use tauri::{AppHandle, Manager, State};

use crate::state::{AppState, Settings};

// ─── Settings ────────────────────────────────────────────

#[tauri::command]
pub fn get_settings(state: State<'_, Arc<AppState>>) -> Result<Settings, String> {
    Ok(state.get_settings())
}

#[tauri::command]
pub fn save_settings(
    settings: Settings,
    state: State<'_, Arc<AppState>>,
) -> Result<(), String> {
    state.update_settings(settings);
    Ok(())
}

// ─── Window control ─────────────────────────────────────

#[tauri::command]
pub fn set_always_on_top(app: AppHandle, value: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.set_always_on_top(value).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

// ─── System helpers ─────────────────────────────────────

/// Open Windows Camera Privacy Settings so the user can allow camera access.
#[tauri::command]
pub async fn open_camera_settings() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", "ms-settings:privacy-webcam"])
            .spawn()
            .map_err(|e| format!("Failed to open settings: {e}"))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        // macOS / Linux camera settings
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Camera")
            .spawn();
    }
    Ok(())
}
