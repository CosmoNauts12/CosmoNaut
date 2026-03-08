# CosmoNaut

## A High-Performance, Liquid-Glass Desktop API Client

CosmoNaut is a modern, developer-first API testing and orchestration tool designed to provide a premium desktop experience. Built for speed and aesthetics, it bridges the gap between powerful functionality and a polished, liquid-glass user interface.

---

## Overview

CosmoNaut is a cross-platform desktop application that streamlines your API development workflow. Whether you're debugging production endpoints, building new services, or orchestrating complex API workflows, CosmoNaut provides a robust set of tools to execute, organize, and track your HTTP requests with precision.

---

## Features

- **Blazing Fast Desktop Native:** Execution using Tauri for native performance, low resource usage, and deep OS integration.
- **Robust Request Builder:** Full support for GET, POST, PUT, DELETE, PATCH, and more, with dynamic URL parameter normalization.
- **Deep Configuration:** Dedicated tabs for Params, Auth (Basic/Bearer), Headers, and JSON Body.
- **Workspaces & Collections:** Organize requests by project or team. Instantly switch between contexts.
- **Role-Based Access Control (RBAC):** Simulate admin/read-only user roles for safe collaborative environments where editors can't build collections or accidentally mutate flows.
- **Missions Flow (API Orchestration):** A premium Canva-style endless graphical canvas to build multi-step API execution pipelines. Connect "Start", "Requests", and "Schedule" nodes.
- **Flow Oracle (AI Assistant):** An integrated AI context-aware assistant specifically designed to help debug, explain, and write workflows directly from the canvas. 
- **Automated Request History:** Every executed request is automatically logged into local history for easy re-execution without manual saving.
- **Dynamic Liquid-Glass UI:** Inspired by modern aesthetics with smooth animations, dark-mode styling, and transparent glassmorphism panels.
- **Intelligent Errors:** Robust error handling with classified network, DNS, timeout, and SSL errors.
- **Privacy First:** Persistent local storage ensuring complete privacy and offline access.

---

## Architecture

CosmoNaut is designed with a strong separation of concerns between the interface and the execution engine.

### Frontend
- Built with React, Next.js 15, TypeScript, and Tailwind CSS.
- Handles UI rendering, state management, drag-and-drop flow building, and request normalization.

### Backend
- Rust-based Tauri core.
- Executes lightning-fast HTTP requests using `reqwest`.
- Manages local file I/O and operating system interactions.

### Local Persistence
- Data is scoped per user and workspace.
- Stored in fast access JSON format inside the user’s application data directory.

---

## How It Works

1. The UI collects request data such as URL, method, headers, authentication, and body.
2. The data is normalized into a standard `CosmoRequest` object.
3. The frontend invokes a secure Rust command via the Tauri bridge.
4. The Rust backend executes the request and handles networking, SSL, and errors.
5. The response is classified and returned to the UI for visualization.

---

## Getting Started

### Prerequisites

- Bun (JavaScript runtime)
- Rust and Cargo (required for Tauri)

### Installation

Clone the repository:

```bash
git clone https://github.com/Adith1207/CosmoNaut.git
cd CosmoNaut
```

Install dependencies:
```bash
bun install
```

Development:
```bash
bun tauri dev
```
*(Or use `npm install` and `npm run tauri dev`)*

Build:
```bash
bun tauri build
```

---

## Core Systems

### Collections (Explicit Save)
Collections are manually saved requests intended for long-term use. They are named, organized into folders, and persisted as part of the workspace architecture. You can easily import Collection requests into your visual Flows.

### History (Automatic Logging)
Every executed request is automatically logged into history. This acts as an activity feed and allows quick re-execution without manual saving. Successful and failed requests are cleanly designated.

### Flows (Orchestration)
Link collections of API calls together visually. Trigger sequentially, view step-by-step payloads, and utilize the Flow Oracle to help debug execution failures.

---

## Roadmap
- Variable and environment support interpolation (`{{base_url}}`)
- GraphQL request support
- WebSocket and gRPC integration
- Response body search, filtering, and JSON-Path formatting tools
- Export and import compatibility with Postman and Insomnia

## License
CosmoNaut is open-source software licensed under the MIT License.
