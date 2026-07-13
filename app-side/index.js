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
      this.settingsStorage.addListener('change', ({ key, newValue }) => {
        console.log(`Settings changed: ${key} = ${newValue}`)
        this.sendToDevice({
          command: 'SETTINGS_UPDATED',
          key: key,
          value: newValue
        })
      })
    } catch (e) {
      console.log('Failed to add settingsStorage listener:', e)
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
              case 'FETCH_NEARBY_MOSQUES':
                this.fetchNearbyMosques(data.lat, data.lng, ctx)
                break
              case 'FETCH_MONTHLY_TIMES':
                this.fetchMonthlyTimes(data.latitude, data.longitude, data.method, ctx)
                break
              case 'TEST_PHONE_IP':
                this.testPhoneIP(ctx)
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

  async fetchMonthlyTimes(lat, lng, method, ctx) {
    try {
      // Two calendar months from AlAdhan ≈ a month+ of coverage from any start day
      const days = {}
      const start = new Date()
      for (let offset = 0; offset < 2; offset++) {
        const d = new Date(start.getFullYear(), start.getMonth() + offset, 1)
        const y = d.getFullYear()
        const mo = d.getMonth() + 1
        try {
          const res = await fetch({
            url: `https://api.aladhan.com/v1/calendar/${y}/${mo}?latitude=${lat}&longitude=${lng}&method=${method || 3}`,
            method: 'GET'
          })
          const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
          if (body && Array.isArray(body.data)) {
            body.data.forEach(day => {
              try {
                // gregorian date is "DD-MM-YYYY"; timings look like "04:23 (EET)"
                const [dd, mm, yyyy] = day.date.gregorian.date.split('-').map(Number)
                const clean = s => String(s).split(' ')[0]
                days[`${yyyy}-${mm}-${dd}`] = {
                  fajr:    clean(day.timings.Fajr),
                  sunrise: clean(day.timings.Sunrise),
                  dhuhr:   clean(day.timings.Dhuhr),
                  asr:     clean(day.timings.Asr),
                  maghrib: clean(day.timings.Maghrib),
                  isha:    clean(day.timings.Isha)
                }
              } catch (_) {}
            })
          }
        } catch (e) {
          console.log(`Calendar fetch failed for ${y}-${mo}:`, e)
        }
      }
      ctx.response({ data: { days, lat, lng, method: method || 3 } })
    } catch (e) {
      console.log('Error fetching monthly times:', e)
      ctx.response({ data: { days: {}, lat, lng, method: method || 3 } })
    }
  },

  async fetchNearbyMosques(lat, lng, ctx) {
    try {
      // GET request with URL-encoded query (POST fails without proper content-type on Zepp OS)
      // nwr = node+way+relation in one clause; regex religion match keeps the query short
      const query = `[out:json][timeout:25];(nwr["amenity"="place_of_worship"]["religion"~"^(muslim|islam)$"](around:5000,${lat},${lng});nwr["building"="mosque"](around:5000,${lat},${lng}););out center 30;`
      const encodedQuery = encodeURIComponent(query)
      console.log('Fetching mosques for lat=' + lat + ' lng=' + lng)

      // Try the main Overpass instance, then a mirror if it fails or returns nothing
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
      ]
      let data = null
      for (const endpoint of endpoints) {
        try {
          const res = await fetch({
            url: `${endpoint}?data=${encodedQuery}`,
            method: 'GET'
          })
          const body = typeof res.body === 'string' ? JSON.parse(res.body) : res.body
          if (body && Array.isArray(body.elements)) {
            data = body
            if (body.elements.length > 0) break
          }
        } catch (e) {
          console.log('Overpass endpoint failed:', endpoint, e)
        }
      }

      let mosques = []
      if (data && data.elements) {
        mosques = data.elements
          .map(el => {
            const elLat = el.lat || (el.center && el.center.lat)
            const elLng = el.lon || (el.center && el.center.lon)
            if (typeof elLat !== 'number' || typeof elLng !== 'number') return null
            const name = el.tags ? (el.tags['name:ar'] || el.tags.name || el.tags['name:en'] || 'مسجد') : 'مسجد'

            const R = 6371e3
            const φ1 = lat * Math.PI/180
            const φ2 = elLat * Math.PI/180
            const Δφ = (elLat-lat) * Math.PI/180
            const Δλ = (elLng-lng) * Math.PI/180
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distance = Math.round(R * c)
            return { id: el.id, name, lat: elLat, lng: elLng, distance }
          })
          .filter(Boolean)
        mosques.sort((a, b) => a.distance - b.distance)
        mosques = mosques.slice(0, 5)
      }

      // Respond with a flat { data: [...] } so the watch only needs one unwrap
      ctx.response({ data: mosques })

      if (mosques.length > 0) {
        this.settingsStorage.setItem('nearestMosque', JSON.stringify(mosques[0]))
      } else {
        this.settingsStorage.removeItem('nearestMosque')
      }
    } catch (e) {
      console.log('Error fetching mosques:', e)
      ctx.response({ data: [] })
    }
  },

  async testPhoneIP(ctx) {
    try {
      const res = await fetch({
        url: 'http://192.168.2.44:3000/api/health',
        method: 'GET',
        timeout: 5000
      })
      const isSuccess = res.status === 200 || res.status === 404; // Any response means connection succeeded
      this.sendToDevice({ type: 'TEST_IP_RESULT', success: isSuccess, message: 'Connected to 192.168.2.44' })
    } catch (e) {
      console.log('Test IP error:', e)
      this.sendToDevice({ type: 'TEST_IP_RESULT', success: false, message: 'Failed: ' + e.message })
    }
  },

  sendToDevice(data) {
    try {
      if (messageBuilder) messageBuilder.notify(data)
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
