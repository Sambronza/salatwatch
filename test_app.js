/**
 * Test harness – mocks Zepp OS runtime to find crashes
 */

// Mock Zepp OS modules
const mockWidgets = []
const mockWidget = {
  FILL_RECT: 'FILL_RECT',
  TEXT: 'TEXT',
  ARC: 'ARC',
  ARC_PROGRESS: undefined, // This should NOT be used in mini programs
  IMG: 'IMG',
  prop: {
    TEXT: 'TEXT',
    COLOR: 'COLOR',
    MORE: 'MORE',
    VISIBLE: 'VISIBLE'
  }
}

const mockCreateWidget = (type, opts) => {
  if (type === undefined) {
    throw new Error(`CRASH: createWidget called with undefined widget type! Options: ${JSON.stringify(opts)}`)
  }
  const w = {
    _type: type,
    _opts: opts,
    setProperty: (p, v) => { /* mock */ },
    addEventListener: (e, cb) => { /* mock */ }
  }
  mockWidgets.push(w)
  return w
}

// Mock modules
const modules = {
  '@zos/ui': {
    createWidget: mockCreateWidget,
    widget: mockWidget,
    align: { CENTER_H: 'CENTER_H', LEFT: 'LEFT', RIGHT: 'RIGHT' },
    text_style: { NONE: 'NONE', WRAP: 'WRAP' },
    event: { CLICK_UP: 'CLICK_UP' },
    prop: mockWidget.prop,
    setStatusBarVisible: () => {}
  },
  '@zos/router': {
    push: (opts) => console.log('  [ROUTER] push:', opts.url),
    back: () => console.log('  [ROUTER] back')
  },
  '@zos/device': {
    getDeviceInfo: () => ({ width: 480, height: 480, screenShape: 0 })
    // NOTE: getApp should NOT be here - it's a global
  },
  '@zos/sensor': {
    Geolocation: class {
      start() {}
      stop() {}
      getLatitude() { return 21.4225 }
      getLongitude() { return 39.8262 }
    },
    Compass: class {
      start() {}
      stop() {}
      getDirectionAngle() { return 45 }
    }
  },
  '@zos/media': {
    create: () => ({
      source: { FILE: 'FILE' },
      event: { PREPARE: 'PREPARE' },
      setSource: () => {},
      addEventListener: () => {},
      prepare: () => {},
      start: () => {},
      stop: () => {},
      release: () => {}
    }),
    id: { PLAYER: 'PLAYER' }
  },
  '@zos/alarm': {
    Alarm: class {
      constructor(opts) { this.opts = opts }
      set() {}
    }
  },
  '@zos/interaction': {
    createMotor: () => ({ start: () => {} })
  }
}

// Override require
const Module = require('module')
const origResolve = Module._resolveFilename
Module._resolveFilename = function(request, parent, isMain, options) {
  if (modules[request]) return request
  return origResolve.call(this, request, parent, isMain, options)
}
const origLoad = Module._cache
Module._load_orig = Module._load
Module._load = function(request, parent, isMain) {
  if (modules[request]) return modules[request]
  return Module._load_orig.call(this, request, parent, isMain)
}

// Mock global getApp
const globalData = {
  prayerTimes: null,
  latitude: 21.4225,
  longitude: 39.8262,
  calculationMethod: 3,
  language: 'en',
  selectedAdhan: 'makkah',
  alarmSettings: {
    fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true,
    adhanSound: true, duaReminders: true, fastingAlerts: false
  },
  hijriDate: null,
  qiblaAngle: null,
  dailyAyah: null
}

global.getApp = () => ({
  _options: { globalData },
  messaging: null,
  requestCompanionData: () => {}
})

// Mock App and Page
global.App = (config) => {
  console.log('✓ App() registered')
  if (config.onCreate) {
    try {
      config.onCreate.call(config)
      console.log('  ✓ App.onCreate() passed')
    } catch (e) {
      console.error('  ✗ App.onCreate() CRASHED:', e.message)
    }
  }
}

global.Page = (config) => {
  console.log('✓ Page() registered')
  if (config.onInit) {
    try {
      config.onInit.call(config)
      console.log('  ✓ Page.onInit() passed')
    } catch (e) {
      console.error('  ✗ Page.onInit() CRASHED:', e.message)
    }
  }
  if (config.build) {
    try {
      config.build.call(config)
      console.log('  ✓ Page.build() passed')
    } catch (e) {
      console.error('  ✗ Page.build() CRASHED:', e.message)
      console.error('    Stack:', e.stack.split('\n').slice(0,3).join('\n'))
    }
  }
  if (config.onDestroy) {
    try {
      config.onDestroy.call(config)
      console.log('  ✓ Page.onDestroy() passed')
    } catch (e) {
      console.error('  ✗ Page.onDestroy() CRASHED:', e.message)
    }
  }
}

global.AppSideService = (config) => {
  console.log('✓ AppSideService() registered')
}

// Run tests
const files = [
  ['app.js', 'App Entry'],
  ['utils/constants.js', 'Constants'],
  ['utils/prayerTimes.js', 'Prayer Times'],
  ['utils/hijri.js', 'Hijri Calendar'],
  ['utils/qibla.js', 'Qibla Direction'],
  ['utils/i18n.js', 'i18n Translations'],
  ['utils/notifier.js', 'Notifier'],
  ['page/index.js', 'Main Dashboard'],
  ['page/compass.js', 'Qibla Compass'],
  ['page/tasbih.js', 'Tasbih Counter'],
  ['page/settings.js', 'Settings Page'],
  ['page/zakat.js', 'Zakat Calculator'],
  ['page/fasting.js', 'Fasting Tracker'],
]

console.log('=== SalatWatch Runtime Test ===\n')

for (const [file, name] of files) {
  console.log(`\n--- Testing: ${name} (${file}) ---`)
  try {
    delete require.cache[require.resolve('./' + file)]
    require('./' + file)
    console.log(`✓ ${name} loaded successfully`)
  } catch (e) {
    console.error(`✗ ${name} FAILED:`, e.message)
    console.error('  Stack:', e.stack.split('\n').slice(1,4).join('\n'))
  }
}

console.log('\n=== Test Complete ===')
