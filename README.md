# 🐱 PNG VTuber App

An ultra-sleek, premium, desktop PNG VTuber application built with **React**, **TypeScript**, **Zustand**, and **Tauri**. It leverages on-device AI via **MediaPipe** for facial expression detection and the **Web Audio API** with an adaptive noise-suppression gate for microphone-driven speech animations.

---

## ✨ Features

- **🎭 Live AI Expression Tracking**: Automatically detects your facial expressions locally in real-time (Normal, Happy, Happy Tears, Disturbed) using MediaPipe Face Landmarker.
- **🎙️ Adaptive Mic Speaking Trigger**: The avatar bounces and triggers the speaking state (`happy.png`) when you talk. Features an adaptive room noise-floor subtraction gate to filter out static, keyboard clicks, and computer fans.
- **🖱️ Drag-to-Reposition System**: Click and drag your avatar anywhere on the screen. The position automatically persists across sessions and stays synchronized during speaking animations.
- **🖼️ Custom PNG Uploads**: Easily upload your own PNG/JPEG/WebP images for each expression directly from the settings panel.
- **🔒 100% Local & Private**: All video feed, face tracking, and microphone analysis run client-side. No data is ever sent to external servers.
- **💎 Premium Glassmorphism UI**: Completely clean home screen view (no watermark, transparent bottom bar, subtle status indicator dot next to the settings gear).

---

## 🛠️ Tech Stack

- **Frontend Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Desktop Runtime**: [Tauri v2](https://tauri.app/) (runs natively with a lightweight Rust backend)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (high-performance state store)
- **Facial Expression AI**: [Google MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker)
- **Audio Processing**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (analyzes frequencies between 300Hz and 4000Hz for human speech)

---

## 🚀 Getting Started

### 📋 Prerequisites

Before setting up the project, make sure you have the following installed on your computer:

1. **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
2. **[Rust & Cargo](https://www.rust-lang.org/tools/install)** (required by Tauri to compile the desktop window wrapper)
3. **Tauri Windows System Dependencies**:
   - Install **[C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-loop/)** (via Visual Studio Installer, select the "Desktop development with C++" workload).

---

### 📦 Installation

Follow these steps to set up the project locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Helloflixofficial/Vtube.git
   cd png-vtuber
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install
   ```

---

### 💻 Running the App

#### Run in Development Mode
To start the app with hot-reloading (changes will update instantly in the window):
```bash
npm run tauri dev
```

#### Build Production Standalone App
To package the app into a lightweight, standalone `.exe` installer:
```bash
npm run tauri build
```
*The compiled binary will be generated under `src-tauri/target/release/bundle/`.*

---

## ⚙️ Configuration & Customization

Click the **Settings Gear** (`⚙️`) in the bottom-right corner of the window to access the options:

### 1. **Avatar** (`🎭` Tab)
- Upload custom images for **Normal**, **Happy**, **Happy Tears**, and **Disturbed** expressions.
- Revert back to the default cat avatar at any time by clicking "Reset".

### 2. **Camera & Mic** (`📷` Tab)
- **Start/Stop Camera**: Start the AI face tracker.
- **Use Camera Mouth Tracking**: (Optional) Triggers speaking when you open your mouth on camera.
- **Use Microphone Voice Trigger**: Triggers speaking and avatar bounces when you talk.
- **Mic Sensitivity Threshold**: Adjusts how loud your voice needs to be to trigger speaking. The visual feedback bar turns green when you talk.

### 3. **Appearance** (`🎨` Tab)
- **Avatar Scale**: Scale the size of your avatar.
- **Window Background**: Choose between a transparent window or a green screen keying color.
- **Draggable Alignment Offset**: Fine-tune your avatar's X/Y offset values manually.

---

## 📂 Project Structure

```text
png-vtuber/
├── src/                      # React Frontend Source
│   ├── components/           # UI Components
│   │   ├── AvatarDisplay/    # Renders Avatar & handles drags/animations
│   │   ├── Camera/           # Handles webcam streams
│   │   └── Settings/         # Settings modal & tabs
│   ├── hooks/                # Custom React Hooks
│   │   ├── useFaceTracking.ts# MediaPipe tracking logic
│   │   └── useMicSpeech.ts   # Audio Analyzer & Noise Floor gate
│   ├── store/                # Zustand State Stores
│   │   └── useAppStore.ts    # Global Application state
│   ├── types/                # TypeScript Interfaces & Defaults
│   └── App.tsx               # Main Application Layout
├── src-tauri/                # Tauri Rust Core Configuration
│   ├── src/                  # Native Rust command controllers
│   ├── tauri.conf.json       # App window and capability settings
│   └── Cargo.toml            # Rust dependency manifest
└── package.json              # Node dependency manifest
```

---

## 🔒 Security & Privacy

This application processes all camera and microphone feeds locally on your computer. 
- **Zero Cloud Processing**: MediaPipe models execute locally in your browser context.
- **Web Audio Analysis**: Audio streams are analyzed for amplitude levels and are discarded immediately after processing. No audio is ever recorded or saved.

---

Happy VTubing! 🎉
