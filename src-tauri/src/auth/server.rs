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
use tauri::{Emitter, Manager};
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
            match crate::auth::token::verify_firebase_token(&firebase_tokens.id_token).await {
                Ok(claims) => {
                    log::info!("Token verified for user: {:?}", claims.email);

                    // Extract user data
                    let user_data = UserData {
                        uid: claims.user_id.clone(),
                        email: claims.email.clone().unwrap_or_default(),
                        name: claims.name.clone(),
                        picture: claims.picture.clone(),
                        google_id_token: Some(payload.id_token.clone()),
                    };

                    // Save tokens to keychain
                    let tokens = Tokens {
                        id_token: firebase_tokens.id_token,
                        access_token: payload.access_token.clone(), // Keep original Google access token if needed, or use firebase_tokens.access_token if available/needed
                        refresh_token: Some(firebase_tokens.refresh_token),
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

                        // Attempt to focus the main app window
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful - CosmoNaut</title>
    <style>
        :root {
            /* Light Mode Variables */
            --background: #F0F9FF;
            --foreground: #0F172A;
            --card-bg: rgba(255, 255, 255, 0.7);
            --card-border: rgba(255, 255, 255, 0.5);
            --primary: #0284C7;
            --primary-glow: rgba(2, 132, 199, 0.3);
            --secondary: #0D9488;
            --muted: #64748B;
            --success: #10B981;
            --error: #EF4444;
            --glass-shimmer: rgba(255, 255, 255, 0.6);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                /* Dark Mode Variables */
                --background: #020617;
                --foreground: #E5F6FF;
                --card-bg: rgba(20, 40, 60, 0.45);
                --card-border: rgba(255, 255, 255, 0.1);
                --primary: #38BDF8;
                --primary-glow: rgba(56, 189, 248, 0.3);
                --secondary: #2DD4BF;
                --muted: #94A3B8;
                --success: #34D399;
                --error: #F87171;
                --glass-shimmer: rgba(255, 255, 255, 0.1);
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: var(--background);
            color: var(--foreground);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            position: relative;
            transition: background-color 0.5s ease, color 0.5s ease;
        }

        /* Star Background Animations */
        .stars-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            overflow: hidden;
            pointer-events: none;
        }

        .star {
            position: absolute;
            background-color: white;
            border-radius: 50%;
            animation: twinkle var(--duration, 3s) infinite ease-in-out alternate;
            opacity: 0;
        }

        /* Create 3 layers of stars with different sizes/speeds */
        .stars-sm .star { width: 1px; height: 1px; box-shadow: 0 0 2px white; }
        .stars-md .star { width: 2px; height: 2px; box-shadow: 0 0 4px white; }
        .stars-lg .star { width: 3px; height: 3px; box-shadow: 0 0 6px white; }

        @keyframes twinkle {
            0% { opacity: 0.1; transform: scale(0.8); }
            100% { opacity: 0.9; transform: scale(1.2); box-shadow: 0 0 10px rgba(255,255,255,0.8); }
        }

        /* Ambient Background Elements (kept behind stars) */
        .ambient-glow {
            position: absolute;
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, var(--primary-glow) 0%, transparent 60%);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
            opacity: 0.8;
            animation: pulse-glow 6s ease-in-out infinite alternate;
        }

        @keyframes pulse-glow {
            0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
            100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); }
        }

        /* Liquid Glass Card Container */
        .container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 440px;
            padding: 40px 32px;
            margin: 20px;
            background: var(--card-bg);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            box-shadow: 
                0 30px 60px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                0 15px 40px var(--primary-glow);
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Logo Area */
        .logo {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .logo svg {
            width: 28px;
            height: 28px;
            color: var(--primary);
            filter: drop-shadow(0 0 8px var(--primary-glow));
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--card-border), transparent);
            margin: 0 -32px 32px -32px;
        }

        /* Status Icon Animations */
        .status-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 0 1px var(--card-border) inset;
        }

        /* Spinner for loading state */
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(148, 163, 184, 0.2);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        /* Success Checkmark */
        .checkmark-svg {
            width: 40px;
            height: 40px;
            color: var(--success);
            display: none; /* Hidden initially */
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.5));
        }

        /* Error X */
        .error-svg {
            width: 40px;
            height: 40px;
            color: var(--error);
            display: none;
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
        }

        @keyframes draw {
            to { stroke-dashoffset: 0; }
        }

        @keyframes pop-in {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes fade-in-up {
            to { opacity: 1; transform: translateY(0); }
        }

        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--foreground);
            letter-spacing: -0.5px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        p {
            font-size: 15px;
            line-height: 1.5;
            color: var(--muted);
            margin-bottom: 32px;
        }

        /* Primary Button */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            outline: none;
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
        }
        
        .btn.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            box-shadow: 0 4px 15px var(--primary-glow), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px var(--primary-glow), inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        /* Subtle text below button */
        .sub-text {
            font-size: 13px;
            color: var(--muted);
            margin-top: 16px;
            margin-bottom: 0;
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .sub-text.visible {
            opacity: 0.7;
        }

        /* State Classes */
        .state-success .spinner { display: none; }
        .state-success .status-icon { box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), 0 0 0 1px var(--card-border) inset; }
        .state-success .checkmark-svg { 
            display: block; 
            animation: draw 0.8s cubic-bezier(0.65, 0, 0.45, 1) forwards, pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .state-error .spinner { display: none; }
        .state-error .status-icon { box-shadow: 0 0 30px rgba(239, 68, 68, 0.3), 0 0 0 1px var(--card-border) inset; }
        .state-error .error-svg { 
            display: block;
            animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
    </style>
</head>
<body>
    <div class="stars-container" id="stars-bg">
        <div class="stars-sm" id="stars-sm"></div>
        <div class="stars-md" id="stars-md"></div>
        <div class="stars-lg" id="stars-lg"></div>
    </div>
    <div class="ambient-glow"></div>
    
    <div class="container" id="card">
        <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 0 0-7.09 17.09c.12-.12.25-.24.38-.35.43-.36.96-.58 1.5-.64.55-.06 1.11.02 1.63.22.45.18.91.4 1.39.63.48.23 1 .45 1.53.58A10.05 10.05 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"></path>
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                <path d="M16.5 18s-1.5-2-4.5-2-4.5 2-4.5 2"></path>
            </svg>
            CosmoNaut
        </div>
        
        <div class="divider"></div>

        <div class="status-icon">
            <div class="spinner"></div>
            <!-- Success Checkmark -->
            <svg class="checkmark-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <!-- Error X -->
            <svg class="error-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>

        <h1 id="title">Authenticating...</h1>
        <p id="description">Please wait while we securely log you in.</p>

        <button id="action-btn" class="btn btn-primary" onclick="closeTab()">
            Return to Application
        </button>
        <p id="sub-msg" class="sub-text">You may close this tab manually if tracking fails.</p>
    </div>
    
    <script>
        // Generate Star Background
        function createStars(containerId, count) {
            const container = document.getElementById(containerId);
            for (let i = 0; i < count; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = `${Math.random() * 100}%`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.setProperty('--duration', `${2 + Math.random() * 4}s`);
                star.style.animationDelay = `${Math.random() * 5}s`;
                container.appendChild(star);
            }
        }

        // Initialize stars (more stars for a "space" feel)
        createStars('stars-sm', 100);
        createStars('stars-md', 50);
        createStars('stars-lg', 20);

        (async function() {
            const card = document.getElementById('card');
            const title = document.getElementById('title');
            const desc = document.getElementById('description');
            const btn = document.getElementById('action-btn');
            const subMsg = document.getElementById('sub-msg');
            
            window.closeTab = function() {
                btn.textContent = "Please switch to the app manually";
                btn.style.background = "var(--card-border)";
                subMsg.textContent = "Your browser prevents automatic closing.";
                subMsg.classList.add('visible');
            };

            function showSuccess() {
                card.classList.add('state-success');
                title.textContent = 'Authentication Successful';
                desc.textContent = 'You have successfully signed in. You can now return to the CosmoNaut app.';
                btn.textContent = 'Close Tab & Return';
                btn.classList.add('visible');
                subMsg.classList.add('visible');
            }
            
            function showError(message) {
                card.classList.add('state-error');
                title.textContent = 'Authentication Failed';
                desc.textContent = message || 'An unexpected error occurred during sign in.';
                btn.textContent = 'Close Tab';
                btn.classList.add('visible');
                subMsg.classList.add('visible');
            }

            try {
                // Extract tokens from URL fragment
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);
                
                const idToken = params.get('id_token');
                const accessToken = params.get('access_token');
                const state = params.get('state');
                
                if (!idToken || !accessToken || !state) {
                    throw new Error('Missing authentication tokens in callback URL.');
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
                    showSuccess();
                } else {
                    throw new Error(result.message || 'Authentication failed on server.');
                }
            } catch (error) {
                console.error('Auth error:', error);
                showError(error.message);
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Failed - CosmoNaut</title>
    <style>
        :root {{
            /* Light Mode Variables */
            --background: #F0F9FF;
            --foreground: #0F172A;
            --card-bg: rgba(255, 255, 255, 0.7);
            --card-border: rgba(255, 255, 255, 0.5);
            --primary: #0284C7;
            --primary-glow: rgba(2, 132, 199, 0.3);
            --secondary: #0D9488;
            --muted: #64748B;
            --success: #10B981;
            --error: #EF4444;
            --glass-shimmer: rgba(255, 255, 255, 0.6);
        }}

        @media (prefers-color-scheme: dark) {{
            :root {{
                /* Dark Mode Variables */
                --background: #020617;
                --foreground: #E5F6FF;
                --card-bg: rgba(20, 40, 60, 0.45);
                --card-border: rgba(255, 255, 255, 0.1);
                --primary: #38BDF8;
                --primary-glow: rgba(56, 189, 248, 0.3);
                --secondary: #2DD4BF;
                --muted: #94A3B8;
                --success: #34D399;
                --error: #F87171;
                --glass-shimmer: rgba(255, 255, 255, 0.1);
            }}
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: var(--background);
            color: var(--foreground);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            position: relative;
            transition: background-color 0.5s ease, color 0.5s ease;
        }}

        /* Ambient Background Elements */
        .ambient-glow {{
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
            opacity: 0.5;
            animation: pulse-glow 4s ease-in-out infinite alternate;
        }}

        @keyframes pulse-glow {{
            0% {{ opacity: 0.4; transform: translate(-50%, -50%) scale(0.95); }}
            100% {{ opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }}
        }}

        /* Liquid Glass Card Container */
        .container {{
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 440px;
            padding: 40px 32px;
            margin: 20px;
            background: var(--card-bg);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                0 10px 30px rgba(239, 68, 68, 0.1);
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }}

        /* Logo Area */
        .logo {{
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }}
        
        .logo svg {{
            width: 28px;
            height: 28px;
            color: var(--primary);
        }}

        .divider {{
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--card-border), transparent);
            margin: 0 -32px 32px -32px;
        }}

        /* Status Icon Animations */
        .status-icon {{
            width: 80px;
            height: 80px;
            margin: 0 auto 24px auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2), 0 0 0 1px var(--card-border) inset;
        }}

        /* Error X */
        .error-svg {{
            width: 40px;
            height: 40px;
            color: var(--error);
            animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }}

        @keyframes pop-in {{
            0% {{ transform: scale(0.8); opacity: 0; }}
            50% {{ transform: scale(1.1); }}
            100% {{ transform: scale(1); opacity: 1; }}
        }}

        @keyframes fade-in-up {{
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        h1 {{
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--foreground);
            letter-spacing: -0.5px;
        }}

        p {{
            font-size: 15px;
            line-height: 1.5;
            color: var(--muted);
            margin-bottom: 32px;
        }}

        /* Primary Button */
        .btn {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            outline: none;
        }}

        .btn-primary {{
            background: var(--card-border);
            color: var(--foreground);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }}

        .btn-primary:hover {{
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }}

        .btn-primary:active {{
            transform: translateY(0);
        }}

        /* Subtle text below button */
        .sub-text {{
            font-size: 13px;
            color: var(--muted);
            margin-top: 16px;
            margin-bottom: 0;
            opacity: 0.7;
        }}
    </style>
</head>
<body>
    <div class="ambient-glow"></div>
    
    <div class="container">
        <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 0 0-7.09 17.09c.12-.12.25-.24.38-.35.43-.36.96-.58 1.5-.64.55-.06 1.11.02 1.63.22.45.18.91.4 1.39.63.48.23 1 .45 1.53.58A10.05 10.05 0 0 0 12 22a10 10 0 0 0 10-10A10 10 0 0 0 12 2Z"></path>
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                <path d="M16.5 18s-1.5-2-4.5-2-4.5 2-4.5 2"></path>
            </svg>
            CosmoNaut
        </div>
        
        <div class="divider"></div>

        <div class="status-icon">
            <svg class="error-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </div>

        <h1>Authentication Failed</h1>
        <p>{}</p>

        <button class="btn btn-primary" onclick="this.textContent = 'Please switch to the app manually'; this.style.background = 'var(--card-border)'; document.getElementById('sub-msg').style.opacity = '1';">
            Close Tab
        </button>
        <p id="sub-msg" class="sub-text" style="opacity:0">Your browser prevents automatic closing.</p>
    </div>
</body>
</html>
"#,
        error
    )
}

