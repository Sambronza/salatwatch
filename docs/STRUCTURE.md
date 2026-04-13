# Project Structure - SalatWatch

This document provides a detailed overview of the SalatWatch project directory structure and the responsibility of each module.

## 📂 Directory Tree

```text
SalatWatch/
├── app-side/               # Companion service (Phone-side logic)
│   └── index.js            # Handles internet fetch (Ayah, API)
├── assets/                 # Static media assets
│   ├── audio/              # Adhan sound files (.mp3)
│   └── default/            # UI icons and images (.png)
├── docs/                   # Project documentation
│   └── STRUCTURE.md        # This file
├── page/                   # UI Pages (Watch-side logic)
│   ├── index.js            # Main dashboard (Times & Countdown)
│   ├── compass.js          # Qibla direction tool
│   ├── tasbih.js           # Digital Dhikr counter
│   ├── settings.js         # User preferences & Alarms
│   ├── zakat.js            # Simple asset calculator
│   └── fasting.js          # Missed fast tracker
├── utils/                  # Shared business logic
│   ├── constants.js        # UI sizing, colors, and asset paths
│   ├── hijri.js            # Hijri calendar engine
│   ├── i18n.js             # Language translations (EN/AR)
│   ├── notifier.js         # Alarm & Notification scheduler
│   ├── prayerTimes.js      # Precision math for GPS prayer times
│   └── qibla.js            # Spherical trigonometry for Mecca
├── app.js                  # Global application lifecycle
├── app.json                # Project manifest & device configuration
├── package.json            # Node.js dependencies
└── README.md               # Main project overview
```

---

## 🏗️ Architectural Overview

### 1. Global State (`app.js`)
The `App()` instance maintains `globalData`, which acts as a single source of truth for:
- User's GPS coordinates.
- Current prayer times.
- Notification settings.
- App-wide language (English/Arabic).

### 2. Localization (`utils/i18n.js`)
All UI strings are abstracted into a translation engine. This allows the app to dynamically switch between **English** and **Arabic** without page reloads.

### 3. Precision Math (`utils/prayerTimes.js`)
Calculates the position of the sun based on Latitude, Longitude, and Timezone. It supports various conventions (Muslim World League, Umm al-Qura, etc.) and provides accuracy within 1-2 minutes.

### 4. Modular UI (`page/`)
Each feature is an independent module. Navigation is handled via `@zos/router`, ensuring low memory overhead during transitions.

### 5. Media Assets (`assets/`)
The Zepp OS build process automatically converts `.png` files in the `assets/` folder into `.tga` files for the watch's GPU and handles image resizing for different screen resolutions (GTR 4 vs GTS 4).

---

## 🛠️ Build Artifacts
Running `npx zeus build` generates the `dist/` folder, which contains the compiled watch app and the phone-side companion package, ready for deployment to the App Store or private preview.
