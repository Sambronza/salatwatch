// SalatWatch v2.0 — Widget / Shortcut Card
// Shows next prayer name + time + countdown, updates every 60s
// Tap opens the app directly to page/index

import { createWidget, widget, align, text_style, prop } from '@zos/ui'
import { localStorage } from '@zos/storage'
import { push } from '@zos/router'
import { calculatePrayerTimes, timeToMinutes } from '../utils/prayerTimes'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT } from '../utils/constants'

let widgetTimer = null

AppWidget({
  state: {
    nextPrayer: 'fajr',
    nextTime: '--:--',
    lang: 'en'
  },

  onInit() {
    // Read language
    try {
      const savedLang = localStorage.getItem('salatwatch_lang')
      if (savedLang) this.state.lang = savedLang
    } catch (e) {}

    this._calculateNext()
  },

  build() {
    const lang = this.state.lang

    // Background card
    createWidget(widget.FILL_RECT, {
      x: sp(12), y: sp(12),
      w: SCREEN.WIDTH - sp(24), h: sp(100),
      radius: sp(16),
      color: COLORS.BG_CARD
    })

    // Gold accent bar on left
    createWidget(widget.FILL_RECT, {
      x: sp(12), y: sp(20),
      w: sp(4), h: sp(84),
      radius: sp(2),
      color: COLORS.GOLD
    })

    // "Next Prayer" label
    createWidget(widget.TEXT, {
      x: sp(26), y: sp(18),
      w: SCREEN.WIDTH - sp(52), h: sp(20),
      text: t('nextPrayer', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    // Prayer name
    const nameWidget = createWidget(widget.TEXT, {
      x: sp(26), y: sp(42),
      w: sp(180), h: sp(32),
      text: t(this.state.nextPrayer, lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    // Prayer time
    const timeWidget = createWidget(widget.TEXT, {
      x: SCREEN.WIDTH - sp(140), y: sp(42),
      w: sp(116), h: sp(32),
      text: this.state.nextTime,
      text_size: FONT.HEADER_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.RIGHT,
      text_style: text_style.NONE
    })

    // Minutes remaining
    const remainWidget = createWidget(widget.TEXT, {
      x: sp(26), y: sp(80),
      w: SCREEN.WIDTH - sp(52), h: sp(20),
      text: this._getRemainStr(),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.EMERALD_LIGHT,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    // Update every 60 seconds
    widgetTimer = setInterval(() => {
      this._calculateNext()
      try {
        nameWidget.setProperty(prop.TEXT, t(this.state.nextPrayer, lang))
        timeWidget.setProperty(prop.TEXT, this.state.nextTime)
        remainWidget.setProperty(prop.TEXT, this._getRemainStr())
      } catch (e) {}
    }, 60000)
  },

  _calculateNext() {
    const now = new Date()
    const timezone = -now.getTimezoneOffset() / 60
    let lat = 21.4225, lng = 39.8262

    try {
      const savedLat = localStorage.getItem('salatwatch_latitude')
      const savedLng = localStorage.getItem('salatwatch_longitude')
      if (savedLat && savedLng) {
        lat = parseFloat(savedLat) || lat
        lng = parseFloat(savedLng) || lng
      }
    } catch (e) {}

    let method = 3
    try {
      const m = localStorage.getItem('salatwatch_calculationMethod')
      if (m) method = parseInt(m) || 3
    } catch (e) {}

    const prayerTimes = calculatePrayerTimes(lat, lng, timezone, now, method, 0)
    const currentMin = now.getHours() * 60 + now.getMinutes()
    const order = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

    for (const key of order) {
      if (timeToMinutes(prayerTimes[key]) > currentMin) {
        this.state.nextPrayer = key
        this.state.nextTime = prayerTimes[key]
        return
      }
    }
    this.state.nextPrayer = 'fajr'
    this.state.nextTime = prayerTimes.fajr
  },

  _getRemainStr() {
    const now = new Date()
    const [h, m] = this.state.nextTime.split(':').map(Number)
    let target = new Date()
    target.setHours(h, m, 0, 0)
    let diffMin = Math.floor((target - now) / 60000)
    if (diffMin < 0) diffMin += 1440

    const rh = Math.floor(diffMin / 60)
    const rm = diffMin % 60
    return `${rh}h ${rm}m ${t('remaining', this.state.lang)}`
  },

  onDestroy() {
    if (widgetTimer) {
      clearInterval(widgetTimer)
    }
  }
})
