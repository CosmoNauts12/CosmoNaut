use crate::auth::{Tokens, UserData};
use axum::{
    extract::{Json, Query},
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::oneshot;

/// Query parameters from OAuth callback (for errors)
#[derive(Debug, Deserialize)]
pub struct CallbackParams {
    #[serde(default)]
    error: String,
}

/// Tokens extracted from URL fragment by JavaScript
#[derive(Debug, Deserialize, Serialize)]
pub struct TokenPayload {
    id_token: String,
    access_token: String,
    state: String,
}

/// Starts a temporary HTTP server to handle OAuth callback
/// 
/// Returns the port number the server is listening on.
/// Server will automatically shutdown after receiving the callback.
pub async fn start_callback_server(
    app_handle: tauri::AppHandle,
    expected_state: String,
    port: u16,
) -> Result<u16, String> {
    // Create a channel to signal server shutdown
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    let shutdown_tx = Arc::new(tokio::sync::Mutex::new(Some(shutdown_tx)));

    // Clone app_handle for use in handlers
    let app_handle_clone = app_handle.clone();
    let _app_handle_clone2 = app_handle.clone();

    // Create router with callback handlers
    let app = Router::new()
        .route(
            "/callback",
            get({
                let shutdown_tx = shutdown_tx.clone();
                move |query: Query<CallbackParams>| {
                    handle_callback_get(query, shutdown_tx.clone())
                }
            }),
        )
        .route(
            "/process-tokens",
            post({
                let shutdown_tx = shutdown_tx.clone();
                let expected_state = expected_state.clone();
                move |payload: Json<TokenPayload>| {
                    handle_process_tokens(
                        payload,
                        app_handle_clone.clone(),
                        expected_state.clone(),
                        shutdown_tx.clone(),
                    )
                }
            }),
        );

    // Bind to localhost on fixed port
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| format!("Failed to bind server to port {}: {}", port, e))?;

    log::info!("Callback server listening on port {}", port);
    
    // Spawn server in background
    tokio::spawn(async move {
        axum::serve(listener, app)
            .with_graceful_shutdown(async {
                shutdown_rx.await.ok();
                log::info!("Callback server shutting down");
            })
            .await
            .expect("Server error");
    });

    Ok(port)
}

/// Handles the initial OAuth callback (GET request)
/// Returns HTML page that extracts tokens from URL fragment
async fn handle_callback_get(
    Query(params): Query<CallbackParams>,
    shutdown_tx: Arc<tokio::sync::Mutex<Option<oneshot::Sender<()>>>>,
) -> impl IntoResponse {
    log::info!("Received OAuth callback");

    // Check for errors from OAuth provider
    if !params.error.is_empty() {
        log::error!("OAuth error: {}", params.error);

        // Shutdown server
        if let Some(tx) = shutdown_tx.lock().await.take() {
            tx.send(()).ok();
        }

        return Html(error_page(&params.error));
    }

    // Return HTML page that extracts tokens from fragment
    Html(token_extraction_page())
}

/// Handles the token processing (POST request from JavaScript)
async fn handle_process_tokens(
    Json(payload): Json<TokenPayload>,
    app_handle: tauri::AppHandle,
    _expected_state: String,
    shutdown_tx: Arc<tokio::sync::Mutex<Option<oneshot::Sender<()>>>>,
) -> impl IntoResponse {
    log::info!("Processing tokens from callback");

    // Validate state
    if let Err(e) = crate::auth::google::validate_state(&payload.state) {
        log::error!("State validation failed: {}", e);
        
        app_handle
            .emit("auth-error", serde_json::json!({
                "message": format!("Security validation failed: {}", e)
            }))
            .ok();

        // Shutdown server
        if let Some(tx) = shutdown_tx.lock().await.take() {
            tx.send(()).ok();
        }

        return Json(serde_json::json!({ "status": "error", "message": e }));
    }

    // Exchange Google ID token for Firebase ID token
    let exchange_result = crate::auth::token::exchange_google_token(&payload.id_token).await;

    match exchange_result {
        Ok(firebase_tokens) => {
            log::info!("Firebase token exchange successful");

            // Verify the new Firebase ID token
            match crate::auth::token::verify_firebase_token(&firebase_tokens.idToken).await {
                Ok(claims) => {
                    log::info!("Token verified for user: {:?}", claims.email);

                    // Extract user data
                    let user_data = UserData {
                        uid: claims.user_id.clone(),
                        email: claims.email.clone().unwrap_or_default(),
                        name: claims.name.clone(),
                        picture: claims.picture.clone(),
                    };

                    // Save tokens to keychain
                    let tokens = Tokens {
                        id_token: firebase_tokens.idToken,
                        access_token: payload.access_token.clone(), // Keep original Google access token if needed, or use firebase_tokens.access_token if available/needed
                        refresh_token: Some(firebase_tokens.refreshToken),
                    };

                    if let Err(e) = crate::auth::storage::save_tokens(&claims.user_id, &tokens) {
                        log::error!("Failed to save tokens: {}", e);
                        
                        app_handle
                            .emit("auth-error", serde_json::json!({
                                "message": format!("Failed to save credentials: {}", e)
                            }))
                            .ok();
                    } else {
                        // Emit success event to frontend
                        app_handle
                            .emit("auth-success", user_data)
                            .ok();
                    }

                    // Clear auth state
                    crate::auth::google::clear_auth_state();

                    // Shutdown server
                    if let Some(tx) = shutdown_tx.lock().await.take() {
                        tx.send(()).ok();
                    }

                    Json(serde_json::json!({ "status": "success" }))
                }
                Err(e) => {
                    log::error!("Token verification failed: {}", e);
                    
                    app_handle
                        .emit("auth-error", serde_json::json!({
                            "message": format!("Token verification failed: {}", e)
                        }))
                        .ok();

                    // Shutdown server
                    if let Some(tx) = shutdown_tx.lock().await.take() {
                        tx.send(()).ok();
                    }

                    Json(serde_json::json!({ "status": "error", "message": e }))
                }
            }
        }
        Err(e) => {
            log::error!("Token exchange failed: {}", e);
            
            app_handle
                .emit("auth-error", serde_json::json!({
                    "message": format!("Token exchange failed: {}", e)
                }))
                .ok();

            // Shutdown server
            if let Some(tx) = shutdown_tx.lock().await.take() {
                tx.send(()).ok();
            }

            Json(serde_json::json!({ "status": "error", "message": e }))
        }
    }
}

/// HTML page that extracts tokens from URL fragment and sends to backend
fn token_extraction_page() -> String {
    r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Authentication Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 { margin: 0 0 1rem 0; font-size: 1.5rem; }
        p { margin: 0; opacity: 0.9; font-size: 0.95rem; }
        .success { color: #4ade80; }
        .error { color: #f87171; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>Authentication Successful!</h1>
        <p id="status">Completing sign-in...</p>
    </div>
    
    <script>
        (async function() {
            try {
                // Extract tokens from URL fragment
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                
                const idToken = params.get('id_token');
                const accessToken = params.get('access_token');
                const state = params.get('state');
                
                if (!idToken || !accessToken || !state) {
                    throw new Error('Missing authentication tokens');
                }
                
                // Send tokens to backend
                const response = await fetch('/process-tokens', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_token: idToken,
                        access_token: accessToken,
                        state: state
                    })
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    document.getElementById('status').innerHTML = 
                        '<span class="success">✓ Sign-in complete!</span><br><small>You can close this window.</small>';
                    setTimeout(() => window.close(), 2000);
                } else {
                    throw new Error(result.message || 'Authentication failed');
                }
            } catch (error) {
                console.error('Auth error:', error);
                document.querySelector('.container').innerHTML = 
                    '<h1 class="error">❌ Error</h1><p>' + error.message + '</p><p style="margin-top: 1rem; font-size: 0.85rem;">You can close this window and try again.</p>';
            }
        })();
    </script>
</body>
</html>
"#.to_string()
}

/// Error page displayed when OAuth fails
fn error_page(error: &str) -> String {
    format!(
        r#"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Authentication Failed</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }}
        .container {{
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 400px;
        }}
        h1 {{ margin: 0 0 1rem 0; }}
        p {{ margin: 0; opacity: 0.9; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>❌ Authentication Failed</h1>
        <p>{}</p>
        <p style="margin-top: 1rem; font-size: 0.9rem;">You can close this window and try again.</p>
    </div>
</body>
</html>
"#,
        error
    )
}

