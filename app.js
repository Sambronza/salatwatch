// Minimal app.js — stripped down for real device testing
// No kpay, no polyfill, no MessageBuilder

App({
  globalData: {
    prayerTimes: null,
    latitude: null,
    longitude: null,
    calculationMethod: 3,
    language: 'en',
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
    kpay: null
  },

  onCreate() {
    console.log('SalatWatch App Created - minimal mode')
  },

  onDestroy() {
    console.log('SalatWatch App Destroyed')
  }
})
