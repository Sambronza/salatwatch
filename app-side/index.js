/**
 * App-Side Service – SalatWatch
 * Runs on the phone, handles API calls and KPay
 */

let messageBuilder = null
let kpay = null

try {
  const { MessageBuilder } = require('../shared/message-side')
  messageBuilder = new MessageBuilder()
} catch (e) {
  console.log('MessageBuilder init failed:', e)
}

try {
  const { kpayConfig } = require('../shared/kpay-config')
  const kpayAppSide = require('kpay-amazfit/app-side')
  const KPayClass = kpayAppSide.default || kpayAppSide
  if (messageBuilder) {
    kpay = new KPayClass({ ...kpayConfig, messageBuilder })
  }
} catch (e) {
  console.log('KPay app-side init failed (non-fatal):', e)
}

AppSideService({
  onInit() {
    console.log('SalatWatch App-Side Service initialized')

    try {
      if (kpay) kpay.init()
    } catch (e) {
      console.log('KPay init failed:', e)
    }

    try {
      if (messageBuilder) {
        messageBuilder.listen(() => {})

        messageBuilder.on('request', (ctx) => {
          try {
            const payload = messageBuilder.buf2Json(ctx.request.payload)

            // Pass to kpay first
            if (kpay && kpay.onRequest && kpay.onRequest(payload)) {
              return
            }

            const data = payload
            switch (data.command) {
              case 'FETCH_PRAYER_TIMES':
                this.fetchPrayerTimes(data.latitude, data.longitude, data.method)
                break
              case 'FETCH_DAILY_CONTENT':
                this.fetchDailyContent(data.language)
                break
              case 'FETCH_HIJRI_DATE':
                this.fetchHijriDate()
                break
              default:
                console.log('Unknown command:', data.command)
            }
          } catch (e) {
            console.log('Message parsing error:', e)
          }
        })
      }
    } catch (e) {
      console.log('MessageBuilder listen failed:', e)
    }
  },

  async fetchPrayerTimes(lat, lng, method) {
    try {
      const today = new Date()
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
      const res = await fetch({
        url: `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method || 3}`,
        method: 'GET'
      })
      const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
      if (body && body.data && body.data.timings) {
        this.sendToDevice({ type: 'PRAYER_TIMES', timings: body.data.timings, date: body.data.date })
      }
    } catch (e) {
      console.log('Error fetching prayer times:', e)
    }
  },

  async fetchDailyContent(language) {
    try {
      const edition = language === 'ar' ? 'ar.alafasy' : 'en.asad'
      const randomAyah = Math.floor(Math.random() * 6236) + 1
      const ayahRes = await fetch({
        url: `https://api.alquran.cloud/v1/ayah/${randomAyah}/${edition}`,
        method: 'GET'
      })
      const ayahBody = typeof ayahRes.body === 'string' ? JSON.parse(ayahRes.body) : ayahRes.body
      if (ayahBody && ayahBody.data) {
        this.sendToDevice({
          type: 'DAILY_AYAH',
          text: ayahBody.data.text,
          surah: language === 'ar' ? ayahBody.data.surah.name : ayahBody.data.surah.englishName,
          number: ayahBody.data.numberInSurah
        })
      }
    } catch (e) {
      console.log('Fetch error:', e)
    }
  },

  async fetchHijriDate() {
    try {
      const today = new Date()
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
      const res = await fetch({
        url: `https://api.aladhan.com/v1/gpiToH/${dateStr}`,
        method: 'GET'
      })
      const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
      if (body && body.data && body.data.hijri) {
        this.sendToDevice({ type: 'HIJRI_DATE', hijri: body.data.hijri })
      }
    } catch (e) {
      console.log('Error fetching Hijri date:', e)
    }
  },

  sendToDevice(data) {
    try {
      if (messageBuilder) messageBuilder.call(data)
    } catch (e) {
      console.log('Error sending to device:', e)
    }
  },

  onRun() {
    console.log('App-Side Service running')
  },

  onDestroy() {
    console.log('App-Side Service destroyed')
    try { if (kpay) kpay.destroy() } catch (e) {}
  }
})
