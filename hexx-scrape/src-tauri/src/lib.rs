use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn get_settings_path(app: AppHandle) -> Result<PathBuf, String> {
    let mut path = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push("settings.json");
    Ok(path)
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<String, String> {
    let path = get_settings_path(app)?;
    if path.exists() {
        fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        Ok("{}".to_string())
    }
}

#[tauri::command]
fn save_settings(app: AppHandle, settings_json: String) -> Result<(), String> {
    let path = get_settings_path(app)?;
    fs::write(path, settings_json).map_err(|e| e.to_string())
}

#[tauri::command]
async fn run_scraper(app: tauri::AppHandle, payload_json: String) -> Result<(), String> {
    // Note: To avoid the stdin compiler issue, we can pass the payload as a command line argument,
    // or try using standard child.write() if it's available.
    // For safety and to guarantee no compile errors, we will use standard Rust std::process::Command 
    // for dev, or tauri's sidecar, but pass the JSON via a temporary file or argument.
    // Wait, the Python script uses sys.stdin.read(). 
    // Let's try child.write() which is the correct method in tauri-plugin-shell v2.
    
    let settings_path = get_settings_path(app.clone())?.to_string_lossy().to_string();
    
    let sidecar_command = app.shell()
        .sidecar("python-engine").map_err(|e| e.to_string())?
        .env("SETTINGS_PATH", settings_path);
    
    let (mut rx, mut child) = sidecar_command
        .spawn()
        .map_err(|e| e.to_string())?;

    // In tauri-plugin-shell v2, write directly on child:
    child.write(payload_json.as_bytes()).map_err(|e| e.to_string())?;
    child.write(b"\n").map_err(|e| e.to_string())?;

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    let _ = app.emit("sidecar-stdout", text);
                }
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    let _ = app.emit("sidecar-stderr", text);
                }
                _ => {}
            }
        }
        let _ = app.emit("sidecar-exit", "Process finished");
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            run_scraper
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}