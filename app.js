// import { setStatusBarVisible } from '@zos/ui'

App({
  globalData: {
    prayerTimes: null,
    latitude: null,
    longitude: null,
    calculationMethod: 3, // Muslim World League default
    language: 'en',
    selectedAdhan: 'makkah', // Default selection (we only have adhan_makkah.mp3)
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
    dailyAyah: null
  },

  onCreate() {
    console.log('SalatWatch App Created')
    try { const { setStatusBarVisible } = require('@zos/ui'); setStatusBarVisible(false) } catch(e) {}

    // Bridge messaging setup
    if (this._options && this._options.messaging) {
      this.messaging = this._options.messaging
      
      this.messaging.onCall((payload) => {
        console.log('Received message from phone:', payload)
        try {
          const data = typeof payload === 'string' ? JSON.parse(payload) : payload
          
          if (data.type === 'PRAYER_TIMES') {
            this.globalData.prayerTimes = data.timings
            // Notify pages to refresh if active
          } else if (data.type === 'DAILY_AYAH') {
            this.globalData.dailyAyah = data
          }
        } catch (e) {
          console.log('Error parsing payload:', e)
        }
      })
    }
  },

  onDestroy() {
    console.log('SalatWatch App Destroyed')
  }
})
