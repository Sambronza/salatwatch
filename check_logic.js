/**
 * check_logic.js - PC Diagnostic Tool (v3)
 * Run: node check_logic.js
 */
const fs = require('fs');
const path = require('path');

// 1. Setup Environment
const mockUI = {
  createWidget: (t, o) => {
    if (!t) throw new Error("CRASH: Widget type is undefined (did you use ARC_PROGRESS?)");
    return { setProperty: () => {}, addEventListener: () => {} };
  },
  widget: { FILL_RECT: 'FR', TEXT: 'TX', ARC: 'AR', IMG: 'IM', BUTTON: 'BT', ARC_PROGRESS: undefined },
  prop: { TEXT: 'T', COLOR: 'C', MORE: 'M', VISIBLE: 'V' },
  align: { CENTER_H: 1, LEFT: 2, RIGHT: 3 },
  text_style: { NONE: 0, WRAP: 1 }, event: { CLICK_UP: 'CU' }, setStatusBarVisible: () => {}
};

global.getApp = () => ({
  globalData: { language: 'en', alarmSettings: { adhanSound: true }, prayerTimes: {} },
  _options: { globalData: { language: 'en' } },
  messaging: { send: () => {} }
});

// 2. Custom Loader to ignore exports/imports
const originalRequire = require('module').prototype.require;
require('module').prototype.require = function(request) {
  if (request.includes('@zos/ui')) return mockUI;
  if (request.includes('@zos/device')) return { getDeviceInfo: () => ({ width: 480, height: 480 }), getApp: global.getApp };
  if (request.includes('@zos/')) return { start: () => {}, stop: () => {}, push: () => {}, back: () => {}, source: { FILE: 1 }, id: { PLAYER: 1 }, event: { PREPARE: 1 } };
  
  if (request.startsWith('../utils/') || request.startsWith('./')) {
    const parts = request.split('/');
    const fileName = parts[parts.length - 1].replace('.js', '') + '.js';
    const utilPath = path.resolve(path.dirname(__filename), 'utils', fileName);
    if (!fs.existsSync(utilPath)) return {};
    return {}; // Assume utils are okay for logic check
  }
  return originalRequire.apply(this, arguments);
};

// 3. Test Function
function test(file) {
  process.stdout.write(`Testing ${file}... `);
  try {
    let code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    // Minimal transform to make it runnable in Node
    code = code.replace(/import .* from .*/g, '');
    global.Page = (c) => { if (c.build) c.build(); };
    global.getGlobalData = () => global.getApp().globalData;
    global.prop = mockUI.prop; 
    global.widget = mockUI.widget; 
    global.align = mockUI.align;
    global.text_style = mockUI.text_style;
    global.event = mockUI.event;
    global.createWidget = mockUI.createWidget;
    
    // Define missing constants for the test
    global.SCREEN = { WIDTH: 480, HEIGHT: 480, CENTER_X: 240, CENTER_Y: 240 };
    global.COLORS = { BG_PRIMARY: 0, GOLD: 1, TEXT_PRIMARY: 2 };
    global.FONT = { HEADER_SIZE: 20, BODY_SIZE: 18 };
    global.DECORATIONS = { CRESCENT: 'C', STAR: 'S', ORNAMENT_L: '[', ORNAMENT_R: ']' };
    global.sp = (v) => v;
    global.t = (k) => k;

    eval(code);
    console.log(`✓ PASSED`);
  } catch (e) {
    console.log(`✗ CRASHED`);
    console.error(`  Error: ${e.message}`);
    console.error(`  Line: ${e.stack.split('\n')[1]}`);
  }
}

console.log('=== SalatWatch Final Logic Check ===');
const pages = ['page/index.js', 'page/compass.js', 'page/tasbih.js', 'page/settings.js', 'page/zakat.js', 'page/fasting.js'];
pages.forEach(p => { if(fs.existsSync(path.join(__dirname, p))) test(p) });
