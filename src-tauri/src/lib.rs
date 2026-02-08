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
pub enum CosmoErrorType {
    NetworkError,
    TimeoutError,
    DnsError,
    SslError,
    InvalidUrl,
    UnknownError,
}

#[derive(Debug, Serialize)]
pub struct CosmoError {
    pub error_type: CosmoErrorType,
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct CosmoResponse {
    pub status: u16,
    pub body: String,
    pub headers: HashMap<String, String>,
    pub duration_ms: u128,
}

#[tauri::command]
async fn execute_cosmo_request(request: CosmoRequest) -> Result<CosmoResponse, CosmoError> {
    let client = reqwest::Client::builder()
        .user_agent("Cosmonaut/1.0 (Desktop API Client)")
        .build()
        .map_err(|e| CosmoError {
            error_type: CosmoErrorType::UnknownError,
            message: format!("Failed to initialize HTTP client: {}", e),
        })?;
        
    let start = Instant::now();

    let method = match request.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        _ => return Err(CosmoError {
            error_type: CosmoErrorType::UnknownError,
            message: format!("Unsupported method: {}", request.method),
        }),
    };

    let mut rb = client.request(method.clone(), &request.url);

    if let Err(e) = reqwest::Url::parse(&request.url) {
        return Err(CosmoError {
            error_type: CosmoErrorType::InvalidUrl,
            message: format!("Invalid URL format: {}. Please ensure the protocol (http/https) is correct.", e),
        });
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
        let error_type = if e.is_timeout() {
            CosmoErrorType::TimeoutError
        } else if e.is_connect() {
            CosmoErrorType::NetworkError
        } else if e.to_string().contains("dns") {
            CosmoErrorType::DnsError
        } else if e.is_request() && e.to_string().contains("ssl") {
            CosmoErrorType::SslError
        } else {
            CosmoErrorType::NetworkError
        };

        CosmoError {
            error_type,
            message: e.to_string(),
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

    let body = response.text().await.map_err(|e| CosmoError {
        error_type: CosmoErrorType::UnknownError,
        message: e.to_string(),
    })?;

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

#[tauri::command]
async fn save_history(
    app_handle: tauri::AppHandle, 
    user_id: String, 
    workspace_id: String, 
    history: String
) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let user_workspace_dir = app_dir.join("users").join(&user_id).join("workspaces").join(&workspace_id);
    std::fs::create_dir_all(&user_workspace_dir).map_err(|e| e.to_string())?;
    
    let file_path = user_workspace_dir.join("history.json");
    std::fs::write(file_path, history).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_history(
    app_handle: tauri::AppHandle, 
    user_id: String, 
    workspace_id: String
) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    let file_path = app_dir.join("users").join(&user_id).join("workspaces").join(&workspace_id).join("history.json");
    
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
        load_workspaces,
        save_history,
        load_history
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
