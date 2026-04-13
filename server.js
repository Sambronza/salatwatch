const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SalatWatch - Zepp OS App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0a1628;
      color: #e8d5a3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 2.5rem;
      color: #d4a843;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 1rem;
      color: #8a9bb5;
      max-width: 500px;
    }
    .badge {
      display: inline-block;
      background: #1c3a5e;
      border: 1px solid #d4a843;
      color: #d4a843;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      max-width: 900px;
      width: 100%;
      margin-bottom: 40px;
    }
    .card {
      background: #0f2040;
      border: 1px solid #1c3a5e;
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #d4a843; }
    .card-icon { font-size: 2rem; margin-bottom: 12px; }
    .card h3 { color: #d4a843; font-size: 1rem; margin-bottom: 8px; }
    .card p { color: #8a9bb5; font-size: 0.875rem; line-height: 1.5; }
    .section {
      background: #0f2040;
      border: 1px solid #1c3a5e;
      border-radius: 12px;
      padding: 28px;
      max-width: 900px;
      width: 100%;
      margin-bottom: 24px;
    }
    .section h2 { color: #d4a843; margin-bottom: 16px; font-size: 1.2rem; }
    .cmd {
      background: #0a1628;
      border: 1px solid #1c3a5e;
      border-radius: 8px;
      padding: 16px 20px;
      font-family: monospace;
      font-size: 0.9rem;
      color: #5dbb7f;
      margin-bottom: 10px;
    }
    .cmd span { color: #8a9bb5; }
    .pages-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .page-tag {
      background: #1c3a5e;
      color: #e8d5a3;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .footer {
      color: #4a5a70;
      font-size: 0.8rem;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">Zepp OS 2.0 / 3.0</div>
    <h1>🕋 SalatWatch</h1>
    <p>A premium Islamic companion app for Amazfit / Zepp OS smartwatch devices</p>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-icon">📅</div>
      <h3>Prayer Timetable</h3>
      <p>GPS-based calculation of Fajr, Dhuhr, Asr, Maghrib & Isha with live countdown and Hijri calendar.</p>
    </div>
    <div class="card">
      <div class="card-icon">🧭</div>
      <h3>Qibla Compass</h3>
      <p>Real-time Kaaba direction using the device's magnetometer and GPS with visual feedback.</p>
    </div>
    <div class="card">
      <div class="card-icon">📿</div>
      <h3>Digital Tasbih</h3>
      <p>Haptic counter that auto-cycles through SubhanAllah, Alhamdulillah, and Allahu Akbar.</p>
    </div>
    <div class="card">
      <div class="card-icon">💰</div>
      <h3>Zakat Calculator</h3>
      <p>Offline calculator for gold, silver, and cash Zakat obligations.</p>
    </div>
    <div class="card">
      <div class="card-icon">🌙</div>
      <h3>Fasting Tracker</h3>
      <p>Manual tracker for missed fasts with progress recording.</p>
    </div>
    <div class="card">
      <div class="card-icon">🔔</div>
      <h3>Adhan Notifications</h3>
      <p>Background alarm service with Makkah Adhan audio and daily Ayah of the Day.</p>
    </div>
  </div>

  <div class="section">
    <h2>App Pages</h2>
    <div class="pages-list">
      <span class="page-tag">page/index.js</span>
      <span class="page-tag">page/compass.js</span>
      <span class="page-tag">page/tasbih.js</span>
      <span class="page-tag">page/settings.js</span>
      <span class="page-tag">page/zakat.js</span>
      <span class="page-tag">page/fasting.js</span>
    </div>
  </div>

  <div class="section">
    <h2>Development Commands</h2>
    <div class="cmd"><span># Install dependencies</span><br/>npm install</div>
    <div class="cmd"><span># Build the app for deployment to device</span><br/>npx zeus build</div>
    <div class="cmd"><span># Preview on a physical Zepp OS device (requires Zepp app)</span><br/>npx zeus preview --device &lt;device_id&gt;</div>
    <div class="cmd"><span># Run in Zepp OS Simulator</span><br/>npx zeus dev</div>
    <div class="cmd"><span># Run diagnostic logic check</span><br/>node check_logic.js</div>
  </div>

  <div class="section">
    <h2>Project Structure</h2>
    <div class="cmd">
      app.js &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span># Global app lifecycle & shared data</span><br/>
      app.json &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span># App manifest (pages, permissions, targets)</span><br/>
      page/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span># UI pages (index, compass, tasbih, settings...)</span><br/>
      utils/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span># Math engines (prayerTimes, qibla, hijri, i18n)</span><br/>
      app-side/ &nbsp;&nbsp;&nbsp;&nbsp;<span># Phone companion service</span><br/>
      assets/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span># Audio (Adhan MP3) and image assets</span>
    </div>
  </div>

  <div class="footer">
    SalatWatch v1.0.0 &mdash; MIT License &mdash; Zepp OS Mini Program
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(PORT, HOST, () => {
  console.log('SalatWatch dev dashboard running at http://' + HOST + ':' + PORT);
});
