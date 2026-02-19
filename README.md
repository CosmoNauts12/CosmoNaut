# Cosmonaut

## A High-Performance, Liquid-Glass Desktop API Client

Cosmonaut is a modern, developer-first API testing tool designed to provide a premium desktop experience. Built for speed and aesthetics, it bridges the gap between powerful functionality and a polished, liquid-glass user interface.

---

## Overview

Cosmonaut is a cross-platform desktop application that streamlines your API development workflow. Whether you're debugging production endpoints or building new services, Cosmonaut provides a robust set of tools to execute, organize, and track your HTTP requests with precision.

---

## Features

- Desktop-first execution using Tauri for native performance and low resource usage  
- Request builder with full support for GET, POST, PUT, DELETE, and more  
- Multi-tab interface to manage multiple requests simultaneously  
- Deep configuration with dedicated tabs for Params, Auth (Basic/Bearer), Headers, and Body (JSON)  
- Workspaces and collections to organize requests by project or team  
- Automated request history with local persistence  
- Glassmorphism-inspired UI with smooth animations and light/dark mode support  
- Robust error handling with classified network, DNS, timeout, and SSL errors  
- Persistent local storage ensuring privacy and offline access  

---

## Architecture

Cosmonaut is designed with a strong separation of concerns between the interface and the execution engine.

### Frontend
- Built with Next.js 15, TypeScript, and Tailwind CSS  
- Handles UI rendering, state management, and request normalization  

### Backend
- Rust-based Tauri core  
- Executes HTTP requests using `reqwest`  
- Manages local file I/O and operating system interactions  

### Local Persistence
- Data is scoped per user and workspace  
- Stored in JSON format inside the user’s application data directory  

---

## How It Works

1. The UI collects request data such as URL, method, headers, authentication, and body  
2. The data is normalized into a standard `CosmoRequest` object  
3. The frontend invokes a secure Rust command via the Tauri bridge  
4. The Rust backend executes the request and handles networking, SSL, and errors  
5. The response is classified and returned to the UI for visualization  

---

## Getting Started

### Prerequisites

- Bun (JavaScript runtime)
- Rust and Cargo (required for Tauri)

### Installation

Clone the repository:

```bash
git clone https://github.com/Adith1207/CosmoNaut.git
cd cosmoNaut
```

Install dependencies:
```bash
bun install
```

Development:
```bash
bun tauri dev
```

Build:
```bash
bun tauri build
```

## 🌐 Website & Marketing
The public-facing website is located in the `website/` directory. It is designed to be deployed independently to platforms like **Vercel**.

- **URL:** [cosmonaut.vercel.app](https://cosmonaut.vercel.app) (Example)
- **Features:** Interactive Odyssey scrollytelling, dynamic download linking, and Firebase-integrated authentication.

## 🚀 Release Automation
We use **GitHub Actions** to automate the build and distribution of the desktop application.

1. **Tagging:** Push a tag (e.g., `v0.1.0`) to trigger the build.
2. **Multi-Platform:** GitHub will build installers for Windows (`.msi`, `.exe`), macOS (`.dmg`), and Linux (`.deb`).
3. **Draft Release:** Builds are automatically uploaded to a new Release in GitHub.
4. **Website Sync:** The website automatically detects the latest Release and updates the download buttons.

## Collections vs History:
Cosmonaut separates request data into two distinct systems.
### Collections (Explicit Save):
Collections are manually saved requests intended for long-term use. They are named, organized into folders, and persisted as part of the workspace architecture.

### History (Automatic Logging):
Every executed request is automatically logged into history. This acts as an activity feed and allows quick re-execution without manual saving.


## Roadmap:
- Variable and environment support

- GraphQL request support

- WebSocket and gRPC integration

- Response body search and formatting tools

- Export and import compatibility with Postman and Insomnia

## License:
Cosmonaut is open-source software licensed under the MIT License.
