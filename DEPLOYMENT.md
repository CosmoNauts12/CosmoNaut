# 🚀 CosmoNaut Deployment Guide

This guide will walk you through the process of building, packaging, and deploying your CosmoNaut desktop application. Since this is a **Tauri** application with a **Next.js** frontend, the process involves bundling both web assets and a Rust-based backend into a single installer.

---

## 🛠 Prerequisites

Before building the application, ensure you have the following installed on your local machine:

1.  **Rust**: The core backend engine.
    *   [Install Rust](https://www.rust-lang.org/tools/install)
2.  **Bun** (or Node.js): For building the Next.js frontend.
    *   [Install Bun](https://bun.sh/)
3.  **OS Dependencies**:
    *   **Windows**: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (Usually included in Windows 10/11).
    *   **macOS**: Xcode Command Line Tools (`xcode-select --install`).
    *   **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`.

---

## 💻 Manual Build Process

To build a production-ready installer on your local machine:

1.  **Install Frontend Dependencies**:
    ```bash
    bun install
    ```
2.  **Build the Application**:
    Run the following command to build both the frontend and the Rust backend:
    ```bash
    bun tauri build
    ```
    *This command will:*
    - Run `next build` (as defined in `tauri.conf.json`).
    - Export static HTML/JS/CSS to the `out/` folder.
    - Compile the Rust code into a binary.
    - Bundle everything into an installer (e.g., `.msi` for Windows, `.dmg` for macOS).

3.  **Locate your Installers**:
    After a successful build, you can find the installers in:
    `src-tauri/target/release/bundle/`

---

## 🤖 Automated CI/CD with GitHub Actions

Building for multiple operating systems (Windows, macOS, Linux) manually is tedious. GitHub Actions allows you to automate this: every time you push a "release tag", GitHub will build the installers for you and upload them as a release.

### 📝 Step-by-Step Setup

1.  **Create the Workflow File**:
    In your project root, create a folder named `.github/workflows` and add a file named `release.yml`.

2.  **Workflow Template**:
    Copy and paste the following configuration into `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    tags:
      - 'v*' # Triggers whenever you push a tag starting with 'v' (e.g., v1.0.0)

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev patchelf

      - name: Install frontend dependencies
        run: bun install

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__ # This will be replaced by the tauri-action automatically
          releaseName: "CosmoNaut v__VERSION__"
          releaseBody: "See the assets, to download the latest version."
          releaseDraft: true
          prerelease: false
```

### 🚀 How to trigger a Release

Once you have pushed this file to GitHub:

1.  **Update Version**: Change the version in `package.json` and `src-tauri/tauri.conf.json` (e.g., `0.1.1`).
2.  **Commit and Tag**:
    ```bash
    git add .
    git commit -m "chore: release v0.1.1"
    git tag v0.1.1
    git push origin main --tags
    ```
3.  **Check GitHub**: Go to your repository's **Actions** tab. You'll see the build running. Once finished, a draft release will appear in the **Releases** section.

---

## 🔏 Code Signing (Important)

If you distribute your app without signing, users will see scary warnings:
- **Windows**: "Windows protected your PC" (SmartScreen).
- **macOS**: "App is damaged and can't be opened" or "Unidentified Developer".

### ✅ Windows
For a beginner, the easiest way is to ignore this until you have users. To go professional, you'll need to buy a **Standard Code Signing Certificate** (cheapest) or an **EV Certificate** (removes SmartScreen immediately).

### ✅ macOS
You MUST join the **Apple Developer Program** ($99/year) to notarize your app so users can open it without complex workarounds.

---

## 🌍 Distribution Channels

1.  **GitHub Releases**: Easiest for open-source or internal tools.
2.  **Microsoft Store**: Requires a developer account ($19 once).
3.  **Personal Website**: Host the `.msi` or `.dmg` files and provide download links.

---

## 💡 Quick Tips for Beginners
- Always test your `bun tauri build` locally before pushing to CI/CD.
- If the CI/CD fails, check the **Actions Logs** in GitHub; it usually tells you exactly which Rust or Node dependency is missing.
- Use a **custom icon**! Replace the icons in `src-tauri/icons` to make your app look professional.
