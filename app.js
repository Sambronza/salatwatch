// SalatWatch v2.1.3 — App Entry Point
// FIXED: MessageBuilder now gets appId + BLE transport for phone communication
import './shared/device-polyfill'
import { MessageBuilder } from './shared/message'
import { getPackageInfo } from '@zos/app'
import * as ble from '@zos/ble'
import { localStorage } from '@zos/storage'

const { appId } = getPackageInfo()
const messageBuilder = new MessageBuilder({ appId, ble })

// Default Iqama durations in minutes (per-prayer)
const DEFAULT_IQAMA = { fajr: 15, dhuhr: 15, asr: 15, maghrib: 10, isha: 15 }

App({
  globalData: {
    prayerTimes: null,
    latitude: null,
    longitude: null,
    calculationMethod: 3,
    language: 'en',
    asrJuristic: 0,
    selectedAdhan: 'makkah',
    alarmSettings: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      adhanSound: true,
      duaReminders: true,
      fastingAlerts: false
    },
    hijriDate: null,
    qiblaAngle: null,
    dailyAyah: null,
    messageBuilder: null,
    kpay: null,

    // v2.0 additions
    iqamaMinutes: { ...DEFAULT_IQAMA },
    iqamaOffset: 0, // 0 = use per-prayer defaults; >0 = user-chosen minutes for all prayers
    iqamaActive: false,
    iqamaEndTime: null
  },

  onCreate() {
    console.log('SalatWatch v2.0 — App Created')

    // Load all saved settings
    this._loadSettings()

    // Connect MessageBuilder
    this.globalData.messageBuilder = messageBuilder
    messageBuilder.connect()

    // Listen for live-sync setting updates from phone companion
    // MessageBuilder emits 'call' for Notify-type messages
    messageBuilder.on('call', (payload) => {
      try {
        const data = messageBuilder.buf2Json(payload.payload)
        if (data && data.command === 'SETTINGS_UPDATED') {
          console.log(`Live-sync: ${data.key} = ${data.value}`)
          localStorage.setItem('salatwatch_' + data.key, data.value)
          this._applySetting(data.key, data.value)
        }
      } catch (e) {
        console.log('Message parse error:', e)
      }
    })
  },

  /**
   * Load all settings from localStorage into globalData.
   */
  _loadSettings() {
    const gd = this.globalData
    const settingsMap = {
      language:          { target: 'language',          type: 'string' },
      calculationMethod: { target: 'calculationMethod', type: 'int' },
      asrJuristic:       { target: 'asrJuristic',       type: 'int' },
      adhanSound:        { target: 'alarmSettings.adhanSound',    type: 'bool' },
      duaReminders:      { target: 'alarmSettings.duaReminders',  type: 'bool' },
      fastingAlerts:     { target: 'alarmSettings.fastingAlerts',  type: 'bool' },
      selectedAdhan:     { target: 'selectedAdhan',     type: 'string' },
      iqamaOffset:       { target: 'iqamaOffset',       type: 'int' }
    }

    for (const [key, config] of Object.entries(settingsMap)) {
      try {
        const val = localStorage.getItem('salatwatch_' + key)
        if (val !== null && val !== undefined) {
          this._applySetting(key, val)
        }
      } catch (e) {
        // Ignore individual setting errors
      }
    }
  },

  /**
   * Apply a single setting value to globalData.
   */
  _applySetting(key, value) {
    const gd = this.globalData
    switch (key) {
      case 'language':
        gd.language = value
        break
      case 'calculationMethod':
        gd.calculationMethod = parseInt(value) || 3
        break
      case 'asrJuristic':
        gd.asrJuristic = parseInt(value) || 0
        break
      case 'adhanSound':
        gd.alarmSettings.adhanSound = String(value) === 'true'
        break
      case 'duaReminders':
        gd.alarmSettings.duaReminders = String(value) === 'true'
        break
      case 'fastingAlerts':
        gd.alarmSettings.fastingAlerts = String(value) === 'true'
        break
      case 'selectedAdhan':
        gd.selectedAdhan = value
        break
      case 'iqamaOffset':
        gd.iqamaOffset = parseInt(value) || 0
        break
    }
  },

  onDestroy() {
    console.log('SalatWatch App Destroyed')
    messageBuilder.disConnect()
  }
})
