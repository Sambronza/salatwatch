# SalatWatch

## Overview
SalatWatch is a premium Islamic companion application built for **Zepp OS 2.0/3.0** devices (Amazfit GTR 4, GTS 4, T-Rex 2, and similar). It runs directly on Zepp OS smartwatches — not in a web browser.

## Tech Stack
- **Platform:** Zepp OS 2.0/3.0 Mini Program framework
- **Language:** JavaScript (ES6+)
- **Build Tool:** Zeus CLI (`@zeppos/zeus-cli`)
- **Package Manager:** npm
- **Preview server:** Node.js (`server.js`) — serves a project dashboard at port 5000

## Features
- Prayer timetable (GPS-based, Fajr/Dhuhr/Asr/Maghrib/Isha)
- Qibla compass (magnetometer + GPS)
- Digital Tasbih counter with haptic feedback
- Zakat calculator
- Fasting tracker
- Adhan notifications (background alarm service)
- Hijri calendar
- Multi-language (English & Arabic)

## Project Structure
```
app.js          # Global app lifecycle & shared globalData
app.json        # App manifest (pages, permissions, targets)
page/           # UI pages
  index.js      # Main dashboard (prayer times, countdown)
  compass.js    # Qibla compass
  tasbih.js     # Tasbih counter
  settings.js   # Settings (calculation method, alarms)
  zakat.js      # Zakat calculator
  fasting.js    # Fasting tracker
utils/          # Core math engines
  prayerTimes.js
  qibla.js
  hijri.js
  i18n.js
  notifier.js
app-side/       # Phone companion service (Ayah of the Day)
assets/         # Audio (Adhan MP3) and image assets
server.js       # Dev dashboard web server (port 5000)
check_logic.js  # PC-side diagnostic script
```

## Development Commands
```bash
npm install           # Install dependencies
npx zeus build        # Build for device deployment
npx zeus preview      # Preview on physical device via QR code
npx zeus dev          # Run in Zepp OS Simulator
node check_logic.js   # Run local logic diagnostics
```

## Replit Setup
- The workflow "Start application" runs `node server.js` and serves a project dashboard at port 5000
- This dashboard is for orientation only — the actual app runs on Zepp OS devices
- Deployment is configured as `autoscale` running `node server.js`
