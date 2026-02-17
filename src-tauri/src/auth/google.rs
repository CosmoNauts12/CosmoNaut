use crate::auth::{AuthState, FIREBASE_WEB_CLIENT_ID};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;
use std::sync::{Arc, Mutex};
use tauri_plugin_opener::OpenerExt;

lazy_static::lazy_static! {
    static ref AUTH_STATE: Arc<Mutex<Option<AuthState>>> = Arc::new(Mutex::new(None));
}

/// Initiates Google Sign-In flow via system browser
/// 
/// This command:
/// 1. Generates secure random state and nonce
/// 2. Starts local callback server
/// 3. Builds Firebase Google auth URL
/// 4. Opens system browser
/// 
/// Returns immediately after opening browser.
/// Frontend should listen for 'auth-success' or 'auth-error' events.
#[tauri::command]
pub async fn start_google_auth(app_handle: tauri::AppHandle) -> Result<(), String> {
    log::info!("Starting Google authentication flow");

    // Generate cryptographically secure random values
    let state = generate_random_string(32);
    let nonce = generate_random_string(32);

    // Start local callback server on fixed port 35585
    let port = 35585;
    crate::auth::server::start_callback_server(app_handle.clone(), state.clone(), port)
        .await
        .map_err(|e| format!("Failed to start callback server: {}", e))?;

    log::info!("Callback server started on port {}", port);

    // Store state for validation
    {
        let mut auth_state = AUTH_STATE.lock().unwrap();
        *auth_state = Some(AuthState {
            state: state.clone(),
            nonce: nonce.clone(),
            port,
        });
    }

    // Build Firebase Google auth URL
    let redirect_uri = format!("http://localhost:{}/callback", port);
    let auth_url = build_google_auth_url(&redirect_uri, &state, &nonce);

    log::info!("Opening browser with auth URL");

    // Open system browser using tauri-plugin-opener
    app_handle
        .opener()
        .open_url(&auth_url, None::<&str>)
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    Ok(())
}

/// Validates the state parameter from OAuth callback
pub fn validate_state(received_state: &str) -> Result<(), String> {
    let auth_state = AUTH_STATE.lock().unwrap();
    
    match auth_state.as_ref() {
        Some(state) if state.state == received_state => {
            log::info!("State validation successful");
            Ok(())
        }
        Some(_) => {
            log::error!("State mismatch - possible CSRF attack");
            Err("Invalid state parameter".to_string())
        }
        None => {
            log::error!("No auth state found");
            Err("No authentication in progress".to_string())
        }
    }
}

/// Clears stored auth state
pub fn clear_auth_state() {
    let mut auth_state = AUTH_STATE.lock().unwrap();
    *auth_state = None;
}

/// Builds the Google OAuth URL for Firebase
fn build_google_auth_url(redirect_uri: &str, state: &str, nonce: &str) -> String {
    let base_url = "https://accounts.google.com/o/oauth2/v2/auth";
    
    let params = [
        ("client_id", FIREBASE_WEB_CLIENT_ID),
        ("redirect_uri", redirect_uri),
        ("response_type", "id_token token"),
        ("scope", "openid email profile"),
        ("state", state),
        ("nonce", nonce),
        ("prompt", "select_account"), // Force account selection
    ];

    let query_string: String = params
        .iter()
        .map(|(key, value)| format!("{}={}", key, urlencoding::encode(value)))
        .collect::<Vec<_>>()
        .join("&");

    format!("{}?{}", base_url, query_string)
}

fn generate_random_string(length: usize) -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..length).map(|_| rng.gen()).collect();
    URL_SAFE_NO_PAD.encode(&bytes)
}
