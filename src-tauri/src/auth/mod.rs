use serde::{Deserialize, Serialize};

pub mod google;
pub mod server;
pub mod storage;
pub mod token;

/// OAuth state stored in memory during auth flow
#[derive(Debug, Clone)]
pub struct AuthState {
    pub state: String,
    pub nonce: String,
    pub port: u16,
}

/// User data extracted from verified token
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserData {
    pub uid: String,
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

/// Tokens returned from OAuth flow
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tokens {
    pub id_token: String,
    pub access_token: String,
    pub refresh_token: Option<String>,
}

/// Firebase project configuration
pub const FIREBASE_PROJECT_ID: &str = "software-project-45fdc";
pub const FIREBASE_WEB_CLIENT_ID: &str = "260320074179-YOUR_CLIENT_ID.apps.googleusercontent.com"; // TODO: Replace with actual Web Client ID
pub const KEYCHAIN_SERVICE: &str = "com.cosmonaut.auth";
