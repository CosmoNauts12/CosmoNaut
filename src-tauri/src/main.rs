// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Entry point for the CosmoNaut desktop application.
/// Initializes the Tauri app and starts the event loop.
fn main() {
  app_lib::run();
}
