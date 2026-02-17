# Technical Report: Cosmonaut Rust Backend Architecture
**Author**: Cosmonaut Engineering / Assistant
**Subject**: In-depth analysis of the native Rust backend logic in a Tauri-based API client.

## 📌 Executive Summary
The Cosmonaut backend is a high-performance native layer written in Rust. It serves as the "engine" of the application, handling everything that a standard web browser cannot: native network execution (to bypass CORS), direct filesystem access for local-first persistence, and robust error classification. This report details the architectural decisions and internal mechanisms that make Cosmonaut a professional-grade desktop tool.

---

## 🔭 The 5W + 1H Framework

### 1. WHAT: The Backend’s Responsibility
The Rust backend is responsible for three primary domains:
*   **Native Request Execution**: Performing raw HTTP transactions that are not bound by browser limitations.
*   **Local Persistence**: Managing the physical storage of user data (workspaces, collections, history) on the host machine’s disk.
*   **Bridge Logic**: Translating complex native responses and system errors into a structured format that the Next.js frontend can easily render.

### 2. WHY: Use of Rust and Tauri
*   **CORS Bypass (Primary Driver)**: Modern web browsers enforce Cross-Origin Resource Sharing (CORS) for security. However, as an API development tool, Cosmonaut must be able to interact with any endpoint regardless of its CORS configuration. By executing requests at the OS level using Rust, we bypass the webview's security sandbox entirely.
*   **Performance & Concurrency**: Using Rust’s `tokio` runtime allows the backend to handle asynchronous operations with minimal overhead, ensuring the UI remains responsive even during heavy network I/O.
*   **Memory Safety**: Rust's "ownership" model prevents common bugs like null pointer dereferences or data races, which is critical when handling sensitive API tokens and large JSON payloads.

### 3. WHO: The Interaction Loop
The backend does not operate in a vacuum. It interacts with:
*   **The Frontend Layer**: Through Tauri’s `invoke` API, the Next.js application sends structured request data to Rust.
*   **System Networking Stack**: via the `reqwest` crate, which interacts with the OS-level TCP/IP stacks.
*   **The Physical Disk**: Through the `std::fs` module to manage data integrity and persistence.

### 4. WHEN: Lifecycle of Invocations
*   **Boot & Rehydration**: On application launch, the backend is invoked to load the user's last active workspace and collections.
*   **Action-Triggered**: Whenever a user clicks "Send", "Save", or "Rename", a specific Tauri command is executed.
*   **Continuous Logging**: As results return, the backend is called to update the `history.json` file asynchronously.

### 5. WHERE: Operating Environment
The backend operates strictly in the **Native OS Layer**. It lives outside the browser's JavaScript environment.
*   **Filesystem Pathing**: It resolves paths dynamically using `app_handle.path().app_data_dir()`, ensuring data is stored in the correct system-compliant location (e.g., `~/.local/share/` on Linux).
*   **Network Level**: It operates at the system socket level, allowing it to send custom user agents (e.g., `Cosmonaut/1.0`) and handle complex SSL/TLS certificates.

### 6. HOW: Internal Mechanics

#### A. The Tauri Command Mechanism
Cosmonaut utilizes the `#[tauri::command]` macro to expose Rust functions to the frontend. These functions use `serde` to automatically de-serialize incoming JavaScript objects into typed Rust structs like `CosmoRequest`.

#### B. Native Execution via `reqwest`
When a request is initiated:
1.  A `reqwest::Client` is initialized with a specific user agent.
2.  The request method (GET, POST, etc.) is mapped from a string to a `reqwest::Method`.
3.  Headers and body payloads are attached conditionally based on the request configuration.
4.  The request is awaited using `tokio`, capturing the exact duration in milliseconds.

#### C. Persistence Strategy: Scoped Silos
Data is stored in a hierarchical, user-scoping structure to ensure privacy and organization:
```text
AppDataDir/
└── users/
    └── {firebase_user_id}/
        ├── workspaces.json
        └── workspaces/
            └── {workspace_id}/
                ├── collections.json
                └── history.json
```
This structure allows for easy backup and prevents data leakage between users sharing the same machine.

#### D. Error Handling & Classification
Rather than passing raw network errors to the user, the backend classifies them into a `CosmoErrorType` enum:
- `NetworkError`: Connection drops or DNS failures.
- `TimeoutError`: Server took too long to respond.
- `SslError`: Certificate validation issues.
- `InvalidUrl`: Malformed endpoint strings.

---

## 🏁 Conclusion
The Rust backend of Cosmonaut is designed for **Reliability**, **Security**, and **Persistence**. By offloading heavy execution and storage logic to the native layer, the application achieves a level of robustness that purely web-based clients cannot match. It effectively bridges the gap between the modern, interactive UI of Next.js and the raw power of the underlying operating system.
