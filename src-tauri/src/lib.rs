use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

mod auth;

/// Represents an HTTP request sent from the frontend.
#[derive(Debug, Deserialize)]
pub struct CosmoRequest {
    /// HTTP method (GET, POST, etc.)
    method: String,
    /// Target URL
    url: String,
    /// Optional HTTP headers
    headers: Option<HashMap<String, String>>,
    /// Optional request body
    body: Option<String>,
}

/// Categorizes different types of failures that can occur during request execution.
#[derive(Debug, Serialize)]
pub enum CosmoErrorType {
    NetworkError,
    TimeoutError,
    DnsError,
    SslError,
    InvalidUrl,
    UnknownError,
}

/// Structured error returned to the frontend when a request fails.
#[derive(Debug, Serialize)]
pub struct CosmoError {
    pub error_type: CosmoErrorType,
    pub message: String,
}

/// Successful HTTP response details.
#[derive(Debug, Serialize)]
pub struct CosmoResponse {
    /// HTTP status code (e.g., 200, 404)
    pub status: u16,
    /// Raw response body
    pub body: String,
    /// Response headers
    pub headers: HashMap<String, String>,
    /// Request duration in milliseconds
    pub duration_ms: u128,
}

/// Executes an HTTP request using reqwest.
/// Handles normalization, client initialization, and execution timing.
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

/// Saves collection data to a JSON file scoped by user and workspace.
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

/// Loads collection data from the local filesystem.
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

/// Persists workspace metadata to a JSON file scoped by user.
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

/// Loads workspace metadata from the local filesystem.
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

/// Saves request history to a JSON file scoped by user and workspace.
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

/// Loads request history from the local filesystem.
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

/// Entry point for the Tauri application.
/// Configures handlers, plugins, and setup logic.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
        execute_cosmo_request,
        save_collections,
        load_collections,
        save_workspaces,
        load_workspaces,
        save_history,
        load_history,
        // Google OAuth commands
        auth::google::start_google_auth,
        auth::storage::logout,
        auth::storage::restore_session,
        auth::token::refresh_token,
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

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::Server;

    #[tokio::test]
    async fn test_execute_get_request() {
        let mut server = Server::new_async().await;
        let _m = server.mock("GET", "/test")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{"message": "success"}"#)
            .create_async().await;

        let request = CosmoRequest {
            method: "GET".to_string(),
            url: format!("{}/test", server.url()),
            headers: None,
            body: None,
        };

        let result = execute_cosmo_request(request).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.status, 200);
        assert_eq!(response.body, r#"{"message": "success"}"#);
    }

    #[tokio::test]
    async fn test_execute_post_request() {
        let mut server = Server::new_async().await;
        let _m = server.mock("POST", "/submit")
            .with_status(201)
            .with_body("created")
            .create_async().await;

        let request = CosmoRequest {
            method: "POST".to_string(),
            url: format!("{}/submit", server.url()),
            headers: Some(HashMap::from([
                ("Content-Type".to_string(), "application/json".to_string())
            ])),
            body: Some(r#"{"data": 123}"#.to_string()),
        };

        let result = execute_cosmo_request(request).await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.status, 201);
        assert_eq!(response.body, "created");
    }

    #[tokio::test]
    async fn test_invalid_url() {
        let request = CosmoRequest {
            method: "GET".to_string(),
            url: "ht tp://invalid-url".to_string(),
            headers: None,
            body: None,
        };

        let result = execute_cosmo_request(request).await;
        assert!(result.is_err());
        let error = result.unwrap_err();
        match error.error_type {
             CosmoErrorType::InvalidUrl => assert!(true),
             _ => assert!(false, "Expected InvalidUrl error type"),
        }
    }
}
