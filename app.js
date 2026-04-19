import './shared/device-polyfill'
import { MessageBuilder } from './shared/message'
import { getPackageInfo } from '@zos/app'
import * as ble from '@zos/ble'
import { kpayConfig } from './shared/kpay-config'
import kpayApp from 'kpay-amazfit/app'

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
    dailyAyah: null,
    messageBuilder: null,
    kpay: null
  },

  onCreate() {
    console.log('SalatWatch App Created')
    try { const { setStatusBarVisible } = require('@zos/ui'); setStatusBarVisible(false) } catch(e) {}

    // Initialize KPay and MessageBuilder
    const { appId } = getPackageInfo()
    const messageBuilder = new MessageBuilder({ appId, appDevicePort: 20, appSidePort: 0, ble })
    this.globalData.messageBuilder = messageBuilder
    messageBuilder.connect()
    
    const kpay = new kpayApp({ ...kpayConfig, dialogPath: 'page/kpay/index.page', messageBuilder });
    this.globalData.kpay = kpay;
    kpay.init();

    this.messaging = messageBuilder

    // Bridge messaging setup
    if (this.messaging) {
      this.messaging.on('request', (ctx) => {
        try {
          const payload = this.messaging.buf2Json(ctx.request.payload)
          console.log('Received message from phone:', payload)
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
    this.globalData.messageBuilder && this.globalData.messageBuilder.disConnect()
  }
})
