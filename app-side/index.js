/**
 * App-Side Service – SalatWatch
 *
 * Runs on the user's phone (companion).
 * Has internet access when phone is connected.
 *
 * Responsibilities:
 *  - Fetch prayer times from AlAdhan API (fallback/verification)
 *  - Fetch daily content (Ayah of the Day, Hadith of the Day)
 *  - Push notifications and data to the watch via Bluetooth messaging
 */

AppSideService({
  onInit() {
    console.log('SalatWatch App-Side Service initialized')

    // Listen for requests from the watch
    this.onMessage = (payload) => {
      try {
        const data = JSON.parse(payload)

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
    }
  },

  /**
   * Fetch prayer times from AlAdhan API
   */
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
        this.sendToDevice({
          type: 'PRAYER_TIMES',
          timings: body.data.timings,
          date: body.data.date
        })
      }
    } catch (e) {
      console.log('Error fetching prayer times:', e)
    }
  },

  /**
   * Fetch daily Islamic content
   */
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
        const payload = {
          type: 'DAILY_AYAH',
          text: ayahBody.data.text,
          surah: language === 'ar' ? ayahBody.data.surah.name : ayahBody.data.surah.englishName,
          number: ayahBody.data.numberInSurah
        }
        console.log('Sending Ayah to device:', payload.surah)
        this.sendToDevice(payload)
      }
    } catch (e) {
      console.log('Fetch error:', e)
    }
  },

  /**
   * Fetch Hijri date from API for verification
   */
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
        this.sendToDevice({
          type: 'HIJRI_DATE',
          hijri: body.data.hijri
        })
      }
    } catch (e) {
      console.log('Error fetching Hijri date:', e)
    }
  },

  /**
   * Send data back to the watch device
   */
  sendToDevice(data) {
    try {
      this.send(JSON.stringify(data))
    } catch (e) {
      console.log('Error sending to device:', e)
    }
  },

  onRun() {
    console.log('App-Side Service running')
    // Automatically fetch daily content on startup
    this.fetchDailyContent('en')
  },

  onDestroy() {
    console.log('App-Side Service destroyed')
  }
})
