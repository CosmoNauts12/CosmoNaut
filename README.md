# Cosmonaut 🚀

**A High-Performance, Liquid-Glass Desktop API Client.**

Cosmonaut is a modern, developer-first API testing tool designed to provide a premium desktop experience. Built for speed and aesthetics, it bridges the gap between powerful functionality and a stunning "liquid glass" interface.

---

## 🛰️ Overview

Cosmonaut is a cross-platform desktop application that streamlines your API development workflow. Whether you're debugging production endpoints or building new services, Cosmonaut provides a robust set of tools to execute, organize, and track your HTTP requests with precision and style.

---

## ✨ Features

- **Desktop-First Execution**: Leveraging **Tauri**, Cosmonaut runs as a native application with direct access to system resources and performance.
- **Request Builder**: Full support for `GET`, `POST`, `PUT`, `DELETE`, and more.
- **Multi-Tab Interface**: Manage multiple active "missions" simultaneously with a centralized tab system.
- **Deep Configuration**: Dedicated tabs for **Params**, **Auth** (Basic/Bearer), **Headers**, and **Body** (JSON).
- **Workspaces & Collections**: Organize your requests into isolated workspaces and nested collections for team or project-specific data.
- **Automated History**: Every request you send is automatically logged to your local history for quick re-execution.
- **Liquid Glass UI**: A bespoke design system featuring glassmorphism, smooth animations, and optimized light/dark modes.
- **Robust Error Handling**: Sophisticated backend error classification (Network, DNS, Timeout, SSL) with human-friendly feedback.
- **Persistent Local Storage**: Your workspaces, collections, and history are stored safely on your device, ensuring data privacy and offline availability.

---

## 🏗️ Architecture

Cosmonaut is engineered with a separation of concerns between its aesthetic interface and its high-performance execution engine.

- **Frontend**: Built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. It handles state management, UI rendering, and request normalization.
- **Backend**: A **Rust**-based Tauri layer that handles the heavy lifting of executing HTTP requests via `reqwest`, managing file I/O for persistence, and interfacing with the operating system.
- **Local Persistence**: Data is scoped per user and workspace, persisted in JSON format within the user's application data directory.

---

## ⚙️ How It Works

1.  **Normalization**: The UI collects request data (URL, methods, auth, etc.) and normalizes it into a standard `CosmoRequest` object.
2.  **Tauri Bridge**: The frontend invokes a secure Rust command through the Tauri bridge.
3.  **Core Execution**: The Rust backend executes the request using highly-optimized crates, handling low-level networking and SSL/TLS.
4.  **Response Synthesis**: Results are classified (status codes, headers, timing) and returned to the UI for visualization.

---

## 🚀 Getting Started

### Prerequisites

- **Bun**: The fast JavaScript runtime.
- **Rust/Cargo**: Required for building the Tauri core.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Adith1207/CosmoNaut.git
    cd cosmoNaut
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```

### Development

Start the application in development mode:
```bash
bun tauri dev
```

### Build

Create a production-ready desktop bundle:
```bash
bun tauri build
```

---

## 📖 Collections vs. History

Cosmonaut handles your request data in two distinct ways:

- **Collections (Explicit Save)**: These are your "Golden Requests." When you've perfected a request, save it to a collection. They are named, organized into folders, and persisted as part of your workspace architecture.
- **History (Automatic Logging)**: Every request you execute is automatically captured in your history. It acts as an activity feed, allowing you to backtrack to recent missions without manual saving.

---

## 🗺️ Roadmap

- [ ] Variable Support (Environment Variables)
- [ ] GraphQL Support
- [ ] Websocket / gRPC Integration
- [ ] Response Body Searching & Formatting
- [ ] Export to Postman/Insomnia Formats

---

## 📜 License

Cosmonaut is open-source and available under the MIT License.

---

*Designed and developed for the next generation of API explorers.*
