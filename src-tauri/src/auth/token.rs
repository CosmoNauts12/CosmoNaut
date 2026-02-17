use crate::auth::FIREBASE_PROJECT_ID;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Firebase ID token claims
#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub iss: String,
    pub aud: String,
    pub auth_time: i64,
    pub user_id: String,
    pub sub: String,
    pub iat: i64,
    pub exp: i64,
    pub email: Option<String>,
    pub email_verified: Option<bool>,
    pub name: Option<String>,
    pub picture: Option<String>,
    pub firebase: Option<FirebaseClaims>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FirebaseClaims {
    pub identities: Option<HashMap<String, Vec<String>>>,
    pub sign_in_provider: Option<String>,
}

/// Verifies a Firebase ID token
/// 
/// Steps:
/// 1. Fetch Firebase public keys
/// 2. Decode JWT header to get key ID
/// 3. Verify signature with matching public key
/// 4. Validate claims (iss, aud, exp, iat)
/// 
/// Returns decoded claims if valid, error otherwise
pub async fn verify_firebase_token(id_token: &str) -> Result<TokenClaims, String> {
    log::info!("Verifying Firebase ID token");

    // Decode header to get key ID
    let header = decode_header(id_token)
        .map_err(|e| format!("Failed to decode token header: {}", e))?;

    let kid = header
        .kid
        .ok_or_else(|| "Token header missing 'kid' field".to_string())?;

    // Fetch Firebase public keys
    let public_keys = fetch_firebase_public_keys()
        .await
        .map_err(|e| format!("Failed to fetch public keys: {}", e))?;

    // Get the matching public key
    let public_key_pem = public_keys
        .get(&kid)
        .ok_or_else(|| format!("No public key found for kid: {}", kid))?;

    // Create decoding key from PEM
    let decoding_key = DecodingKey::from_rsa_pem(public_key_pem.as_bytes())
        .map_err(|e| format!("Failed to create decoding key: {}", e))?;

    // Set up validation
    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&[FIREBASE_PROJECT_ID]);
    validation.set_issuer(&[format!(
        "https://securetoken.google.com/{}",
        FIREBASE_PROJECT_ID
    )]);

    // Decode and validate token
    let token_data = decode::<TokenClaims>(id_token, &decoding_key, &validation)
        .map_err(|e| format!("Token validation failed: {}", e))?;

    log::info!("Token verified successfully for user: {:?}", token_data.claims.email);

    Ok(token_data.claims)
}

/// Fetches Firebase public keys from Google's servers
async fn fetch_firebase_public_keys() -> Result<HashMap<String, String>, String> {
    let url = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("Failed to fetch public keys: {}", e))?;

    let keys: HashMap<String, String> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse public keys: {}", e))?;

    Ok(keys)
}

/// Refreshes an expired ID token using refresh token
/// 
/// Calls Firebase token refresh endpoint and returns new tokens
#[tauri::command]
pub async fn refresh_token(refresh_token: String) -> Result<serde_json::Value, String> {
    log::info!("Refreshing ID token");

    let client = reqwest::Client::new();
    let url = format!(
        "https://securetoken.googleapis.com/v1/token?key=AIzaSyDfRbTA2Qi3RYmXcJKZkpspOUqypcA5wgs"
    );

    let response = client
        .post(&url)
        .json(&serde_json::json!({
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to refresh token: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", error_text));
    }

    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

    log::info!("Token refreshed successfully");

    Ok(result)
}
