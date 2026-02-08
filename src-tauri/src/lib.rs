use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Debug, Deserialize)]
pub struct CosmoRequest {
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CosmoResponse {
    status: u16,
    body: String,
    headers: HashMap<String, String>,
    duration_ms: u128,
}

#[tauri::command]
async fn execute_cosmo_request(request: CosmoRequest) -> Result<CosmoResponse, String> {
    let client = reqwest::Client::builder()
        .user_agent("Cosmonaut/1.0 (Desktop API Client)")
        .build()
        .map_err(|e| format!("Failed to initialize HTTP client: {}", e))?;
        
    let start = Instant::now();

    let method = match request.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        _ => return Err(format!("Unsupported method: {}", request.method)),
    };

    let mut rb = client.request(method.clone(), &request.url);

    if let Err(e) = reqwest::Url::parse(&request.url) {
        return Err(format!("Invalid URL format: {}. Please ensure the protocol (http/https) is correct.", e));
    }

    if let Some(headers) = request.headers {
        for (key, value) in headers {
            rb = rb.header(key, value);
        }
    }

    if let Some(body) = request.body {
        rb = rb.body(body);
    }

    let response = rb.send().await.map_err(|e| {
        if e.is_timeout() {
            "Request timed out. Check your internet connection or the server status.".to_string()
        } else if e.is_connect() {
            format!("Connection failed: The server at '{}' could not be reached. It might be down or your internet is disconnected.", request.url)
        } else {
            format!("Request failed: {}", e)
        }
    })?;
    let duration = start.elapsed().as_millis();

    let status = response.status().as_u16();
    let mut headers = HashMap::new();
    for (name, value) in response.headers().iter() {
        headers.insert(
            name.to_string(),
            value.to_str().unwrap_or("").to_string(),
        );
    }

    let body = response.text().await.map_err(|e| e.to_string())?;

    Ok(CosmoResponse {
        status,
        body,
        headers,
        duration_ms: duration,
    })
}

#[tauri::command]
async fn save_collections(
    app_handle: tauri::AppHandle, 
    user_id: String, 
    workspace_id: String, 
    collections: String
) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let user_workspace_dir = app_dir.join("users").join(&user_id).join("workspaces").join(&workspace_id);
    std::fs::create_dir_all(&user_workspace_dir).map_err(|e| e.to_string())?;
    
    let file_path = user_workspace_dir.join("collections.json");
    std::fs::write(file_path, collections).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_collections(
    app_handle: tauri::AppHandle, 
    user_id: String, 
    workspace_id: String
) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let file_path = app_dir.join("users").join(&user_id).join("workspaces").join(&workspace_id).join("collections.json");
    
    if !file_path.exists() {
        return Ok("[]".to_string());
    }
    
    std::fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_workspaces(
    app_handle: tauri::AppHandle, 
    user_id: String, 
    workspaces: String
) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let user_dir = app_dir.join("users").join(&user_id);
    std::fs::create_dir_all(&user_dir).map_err(|e| e.to_string())?;
    
    let file_path = user_dir.join("workspaces.json");
    std::fs::write(file_path, workspaces).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_workspaces(
    app_handle: tauri::AppHandle, 
    user_id: String
) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let file_path = app_dir.join("users").join(&user_id).join("workspaces.json");
    
    if !file_path.exists() {
        return Ok("[]".to_string());
    }
    
    std::fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![
        execute_cosmo_request,
        save_collections,
        load_collections,
        save_workspaces,
        load_workspaces
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
