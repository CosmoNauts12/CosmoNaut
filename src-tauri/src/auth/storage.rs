use crate::auth::{Tokens, UserData, KEYCHAIN_SERVICE};
use keyring::Entry;

/// Saves authentication tokens to OS keychain
/// 
/// Tokens are stored securely using platform-specific credential storage:
/// - macOS: Keychain
/// - Windows: Credential Manager
/// - Linux: Secret Service (libsecret)
pub fn save_tokens(user_id: &str, tokens: &Tokens) -> Result<(), String> {
    log::info!("Saving tokens to keychain for user: {}", user_id);

    // Save ID token
    let id_token_entry = Entry::new(KEYCHAIN_SERVICE, &format!("{}_id_token", user_id))
        .map_err(|e| format!("Failed to create keychain entry: {}", e))?;
    id_token_entry
        .set_password(&tokens.id_token)
        .map_err(|e| format!("Failed to save ID token: {}", e))?;

    // Save access token
    let access_token_entry = Entry::new(KEYCHAIN_SERVICE, &format!("{}_access_token", user_id))
        .map_err(|e| format!("Failed to create keychain entry: {}", e))?;
    access_token_entry
        .set_password(&tokens.access_token)
        .map_err(|e| format!("Failed to save access token: {}", e))?;

    // Save refresh token if present
    if let Some(ref refresh_token) = tokens.refresh_token {
        let refresh_token_entry =
            Entry::new(KEYCHAIN_SERVICE, &format!("{}_refresh_token", user_id))
                .map_err(|e| format!("Failed to create keychain entry: {}", e))?;
        refresh_token_entry
            .set_password(refresh_token)
            .map_err(|e| format!("Failed to save refresh token: {}", e))?;
    }

    log::info!("Tokens saved successfully");
    Ok(())
}

/// Loads authentication tokens from OS keychain
pub fn load_tokens(user_id: &str) -> Result<Tokens, String> {
    log::info!("Loading tokens from keychain for user: {}", user_id);

    // Load ID token
    let id_token_entry = Entry::new(KEYCHAIN_SERVICE, &format!("{}_id_token", user_id))
        .map_err(|e| format!("Failed to create keychain entry: {}", e))?;
    let id_token = id_token_entry
        .get_password()
        .map_err(|e| format!("Failed to load ID token: {}", e))?;

    // Load access token
    let access_token_entry = Entry::new(KEYCHAIN_SERVICE, &format!("{}_access_token", user_id))
        .map_err(|e| format!("Failed to create keychain entry: {}", e))?;
    let access_token = access_token_entry
        .get_password()
        .map_err(|e| format!("Failed to load access token: {}", e))?;

    // Load refresh token (optional)
    let refresh_token = Entry::new(KEYCHAIN_SERVICE, &format!("{}_refresh_token", user_id))
        .ok()
        .and_then(|entry| entry.get_password().ok());

    log::info!("Tokens loaded successfully");

    Ok(Tokens {
        id_token,
        access_token,
        refresh_token,
    })
}

/// Deletes authentication tokens from OS keychain
pub fn delete_tokens(user_id: &str) -> Result<(), String> {
    log::info!("Deleting tokens from keychain for user: {}", user_id);

    // Delete ID token
    if let Ok(entry) = Entry::new(KEYCHAIN_SERVICE, &format!("{}_id_token", user_id)) {
        entry.delete_password().ok();
    }

    // Delete access token
    if let Ok(entry) = Entry::new(KEYCHAIN_SERVICE, &format!("{}_access_token", user_id)) {
        entry.delete_password().ok();
    }

    // Delete refresh token
    if let Ok(entry) = Entry::new(KEYCHAIN_SERVICE, &format!("{}_refresh_token", user_id)) {
        entry.delete_password().ok();
    }

    log::info!("Tokens deleted successfully");
    Ok(())
}

/// Logs out the user by deleting tokens from keychain
#[tauri::command]
pub async fn logout(user_id: String) -> Result<(), String> {
    log::info!("Logging out user: {}", user_id);
    delete_tokens(&user_id)?;
    Ok(())
}

/// Restores user session from keychain on app startup
/// 
/// Returns user data if valid session exists, None otherwise
#[tauri::command]
pub async fn restore_session(user_id: String) -> Result<Option<UserData>, String> {
    log::info!("Attempting to restore session for user: {}", user_id);

    // Try to load tokens
    let tokens = match load_tokens(&user_id) {
        Ok(t) => t,
        Err(_) => {
            log::info!("No saved tokens found");
            return Ok(None);
        }
    };

    // Verify the ID token
    match crate::auth::token::verify_firebase_token(&tokens.id_token).await {
        Ok(claims) => {
            log::info!("Session restored successfully");
            Ok(Some(UserData {
                uid: claims.user_id,
                email: claims.email.unwrap_or_default(),
                name: claims.name,
                picture: claims.picture,
                google_id_token: None,
            }))
        }
        Err(e) => {
            log::warn!("Token verification failed during session restore: {}", e);
            // Token might be expired, try to refresh
            if let Some(refresh_token) = tokens.refresh_token {
                log::info!("Attempting to refresh token");
                match crate::auth::token::refresh_token(refresh_token).await {
                    Ok(new_tokens_json) => {
                        // Extract new tokens and save them
                        if let Some(new_id_token) = new_tokens_json.get("id_token").and_then(|v| v.as_str()) {
                            let new_tokens = Tokens {
                                id_token: new_id_token.to_string(),
                                access_token: new_tokens_json.get("access_token")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or(&tokens.access_token)
                                    .to_string(),
                                refresh_token: new_tokens_json.get("refresh_token")
                                    .and_then(|v| v.as_str())
                                    .map(|s| s.to_string()),
                            };
                            
                            save_tokens(&user_id, &new_tokens)?;
                            
                            // Verify the new token
                            match crate::auth::token::verify_firebase_token(&new_tokens.id_token).await {
                                Ok(claims) => {
                                    log::info!("Session restored with refreshed token");
                                    return Ok(Some(UserData {
                                        uid: claims.user_id,
                                        email: claims.email.unwrap_or_default(),
                                        name: claims.name,
                                        picture: claims.picture,
                                        google_id_token: None,
                                    }));
                                }
                                Err(e) => {
                                    log::error!("Refreshed token verification failed: {}", e);
                                }
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Token refresh failed: {}", e);
                    }
                }
            }
            
            // If we get here, session restore failed
            delete_tokens(&user_id)?;
            Ok(None)
        }
    }
}
