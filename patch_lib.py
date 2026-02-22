import re

with open("src-tauri/src/lib.rs", "r") as f:
    code = f.read()


new_commands = """

/// Gets the current demo request count from secure local storage
#[tauri::command]
async fn get_demo_request_count(app_handle: tauri::AppHandle) -> Result<u32, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join("demo_state.json");
    if !file_path.exists() {
        return Ok(0);
    }
    
    let content = std::fs::read_to_string(file_path).unwrap_or_else(|_| "0".to_string());
    let count: u32 = content.parse().unwrap_or(0);
    Ok(count)
}

/// Increments the current demo request count in secure local storage
#[tauri::command]
async fn increment_demo_request_count(app_handle: tauri::AppHandle) -> Result<u32, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join("demo_state.json");
    
    let mut count: u32 = 0;
    if file_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&file_path) {
            count = content.parse().unwrap_or(0);
        }
    }
    
    count += 1;
    
    std::fs::write(&file_path, count.to_string()).map_err(|e| e.to_string())?;
    
    Ok(count)
}

/// Entry point for the Tauri application.
"""

code = code.replace("/// Entry point for the Tauri application.", new_commands)


new_handler = """        // Google OAuth commands
        auth::google::start_google_auth,
        auth::storage::logout,
        auth::storage::restore_session,
        auth::token::refresh_token,
        save_user_preferences,
        load_user_preferences,
        get_demo_request_count,
        increment_demo_request_count,"""

code = code.replace("""        // Google OAuth commands
        auth::google::start_google_auth,
        auth::storage::logout,
        auth::storage::restore_session,
        auth::token::refresh_token,
        save_user_preferences,
        load_user_preferences,""", new_handler)


with open("src-tauri/src/lib.rs", "w") as f:
    f.write(code)

print("Done")
