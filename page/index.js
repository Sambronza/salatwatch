import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { push } from '@zos/router'

import { calculatePrayerTimes, timeToMinutes, calculateLastThirdOfNight } from '../utils/prayerTimes'
import { gregorianToHijri, detectIslamicHoliday, formatHijriDate, isRamadan } from '../utils/hijri'
import { schedulePrayerAlarms } from '../utils/notifier'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS } from '../utils/constants'

let geoSensor = null
let timerInterval = null

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

Page({
  onInit() {
    console.log('SalatWatch: onInit() called')
  },

  build() {
    console.log('SalatWatch: build() started')
      const gd = getGlobalData()
      if (!gd) {
        console.log('SalatWatch ERROR: globalData is null!')
        return
      }
      const lang = gd.language || 'en'
      const now = new Date()
      console.log('SalatWatch: Using language: ' + lang)

    // ─── Background ──────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT * 3,
      color: COLORS.BG_PRIMARY
    })

    // ─── Islamic Header Ornament ─────────────────────────────────────
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - sp(48)) / 2,
      y: sp(12),
      src: DECORATIONS.CRESCENT
    })

    // ─── Hijri Date ──────────────────────────────────────────────────
    const hijri = gregorianToHijri(now)
    const hijriStr = formatHijriDate(hijri, lang)
    gd.hijriDate = hijri

    createWidget(widget.TEXT, {
      x: 0, y: sp(48), w: SCREEN.WIDTH, h: sp(30),
      text: hijriStr,
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Holiday Banner ──────────────────────────────────────────────
    const holiday = detectIslamicHoliday(hijri.month, hijri.day)
    let yOffset = sp(82)
    if (holiday) {
      createWidget(widget.FILL_RECT, {
        x: sp(40), y: yOffset, w: SCREEN.WIDTH - sp(80), h: sp(40), radius: sp(20),
        color: COLORS.GOLD_DIM
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: yOffset + sp(4), w: SCREEN.WIDTH - sp(80), h: sp(34),
        text: lang === 'ar' ? holiday.ar : holiday.en,
        text_size: FONT.SMALL_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
        text_style: text_style.NONE
      })
      yOffset += sp(48)
    }

    // ─── GPS & Prayer Times ──────────────────────────────────────────
    let prayerTimes = null
    const timezone = -now.getTimezoneOffset() / 60

    // Try to get GPS location
    try {
      console.log('SalatWatch: Initializing Geolocation...')
      const { Geolocation } = require('@zos/sensor')
      geoSensor = new Geolocation()
      geoSensor.start()
      console.log('SalatWatch: Geolocation started')

      const lat = geoSensor.getLatitude()
      const lng = geoSensor.getLongitude()
      console.log(`SalatWatch: GPS Found: ${lat}, ${lng}`)

      if (lat && lng && lat !== 0 && lng !== 0) {
        gd.latitude = lat
        gd.longitude = lng
        prayerTimes = calculatePrayerTimes(lat, lng, timezone, now, gd.calculationMethod, 0)
        gd.prayerTimes = prayerTimes
        
        // Schedule alarms for the day
        if (gd.alarmSettings.adhanSound) {
          schedulePrayerAlarms(prayerTimes)
        }
      }
    } catch (e) {
      console.log('GPS not available:', e)
    }

    if (!prayerTimes) {
      // Fallback: Default coordinates (Mecca) if GPS not ready
      prayerTimes = calculatePrayerTimes(21.4225, 39.8262, 3, now, gd.calculationMethod, 0)
      gd.prayerTimes = prayerTimes
    }

    // Request fresh data from companion (App-Side)
    app.requestCompanionData = () => {
      const appInst = getApp()
      appInst.messaging && appInst.messaging.send({
        command: 'FETCH_PRAYER_TIMES',
        latitude: gd.latitude || 21.4225,
        longitude: gd.longitude || 39.8262,
        method: gd.calculationMethod
      })
      appInst.messaging && appInst.messaging.send({
        command: 'FETCH_DAILY_CONTENT',
        language: lang
      })
    }
    app.requestCompanionData()

    // ─── Next Prayer Calculation ─────────────────────────────────────
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
    let nextPrayer = null
    let nextPrayerTime = null
    let minutesRemaining = 0

    for (const key of prayerOrder) {
      const pMin = timeToMinutes(prayerTimes[key])
      if (pMin > currentMinutes) {
        nextPrayer = key
        nextPrayerTime = prayerTimes[key]
        minutesRemaining = pMin - currentMinutes
        break
      }
    }
    if (!nextPrayer) {
      nextPrayer = 'fajr'
      nextPrayerTime = prayerTimes.fajr
      minutesRemaining = (24 * 60 - currentMinutes) + timeToMinutes(prayerTimes.fajr)
    }

    const hoursLeft = Math.floor(minutesRemaining / 60)
    const minsLeft = minutesRemaining % 60

    // ─── Arc Progress Ring ───────────────────────────────────────────
    // Shows how much time has passed until the next prayer
    const maxPrayerGap = 360 // arbitrary full range
    const progressLevel = Math.min(100, Math.round(((maxPrayerGap - minutesRemaining) / maxPrayerGap) * 100))

    createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(90),
      y: yOffset + sp(110) - sp(90),
      w: sp(180),
      h: sp(180),
      start_angle: -90,
      end_angle: -90 + Math.round(3.6 * progressLevel),
      color: PRAYER_COLORS[nextPrayer] || COLORS.EMERALD,
      line_width: sp(8)
    })

    // Outer decorative ring
    createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(98),
      y: yOffset + sp(110) - sp(98),
      w: sp(196),
      h: sp(196),
      start_angle: 0,
      end_angle: 360,
      color: COLORS.BG_ELEVATED,
      line_width: sp(2)
    })

    // ─── Next Prayer Label ───────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: yOffset + sp(56), w: SCREEN.WIDTH, h: sp(28),
      text: t('nextPrayer', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Next Prayer Name ────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: yOffset + sp(82), w: SCREEN.WIDTH, h: sp(40),
      text: `${DECORATIONS.STAR} ${t(nextPrayer, lang)} ${DECORATIONS.STAR}`,
      text_size: FONT.HEADER_SIZE,
      color: PRAYER_COLORS[nextPrayer] || COLORS.GOLD,
      align_h: align.CENTER_H
    })

    // ─── Next Prayer Time ────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: yOffset + sp(116), w: SCREEN.WIDTH, h: sp(38),
      text: nextPrayerTime,
      text_size: FONT.TIME_SIZE - sp(10),
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H
    })

    // ─── Countdown ───────────────────────────────────────────────────
    const countdownLabel = createWidget(widget.TEXT, {
      x: 0, y: yOffset + sp(150), w: SCREEN.WIDTH, h: sp(24),
      text: `${hoursLeft}h ${minsLeft}m`,
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Live Update Timer ───────────────────────────────────────────
    timerInterval = setInterval(() => {
      const ts = new Date()
      const cMins = ts.getHours() * 60 + ts.getMinutes()
      let mRem = timeToMinutes(nextPrayerTime) - cMins
      if (mRem < 0) mRem = 0
      const hLeft = Math.floor(mRem / 60)
      const mLeft = mRem % 60
      countdownLabel.setProperty(prop.TEXT, `${hLeft}h ${mLeft}m`)
    }, 60000)

    // ─── Full Timetable ──────────────────────────────────────────────
    let tableY = yOffset + sp(200)
    createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY - sp(6), w: SCREEN.WIDTH - sp(60), h: sp(2),
      color: COLORS.GOLD_DIM
    })
    tableY += sp(6)

    for (const key of prayerOrder) {
      const isNext = key === nextPrayer
      const pTime = prayerTimes[key]
      const pMin = timeToMinutes(pTime)
      const isPast = pMin <= currentMinutes && !isNext

      // Prayer name (left)
      createWidget(widget.TEXT, {
        x: sp(50), y: tableY, w: sp(180), h: sp(34),
        text: `${isNext ? DECORATIONS.CRESCENT + ' ' : '  '}${t(key, lang)}`,
        text_size: isNext ? FONT.BODY_SIZE : FONT.CAPTION_SIZE,
        color: isNext ? COLORS.ACTIVE : (isPast ? COLORS.INACTIVE : COLORS.TEXT_PRIMARY),
        align_h: align.LEFT
      })

      // Prayer time (right)
      createWidget(widget.TEXT, {
        x: SCREEN.WIDTH - sp(200), y: tableY, w: sp(150), h: sp(34),
        text: pTime,
        text_size: isNext ? FONT.BODY_SIZE : FONT.CAPTION_SIZE,
        color: isNext ? COLORS.ACTIVE : (isPast ? COLORS.INACTIVE : COLORS.TEXT_SECONDARY),
        align_h: align.RIGHT
      })

      tableY += sp(38)
    }

    // Sunrise row (smaller, informational)
    createWidget(widget.TEXT, {
      x: sp(50), y: tableY, w: sp(180), h: sp(28),
      text: `  ${t('sunrise', lang)}`,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.LEFT
    })
    createWidget(widget.TEXT, {
      x: SCREEN.WIDTH - sp(200), y: tableY, w: sp(150), h: sp(28),
      text: prayerTimes.sunrise,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.RIGHT
    })
    tableY += sp(38)

    // ─── Separator ───────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(2),
      color: COLORS.GOLD_DIM
    })
    tableY += sp(20)

    // ─── Ayah of the Day Card ───────────────────────────────────────
    if (gd.dailyAyah) {
      tableY += sp(20)
      createWidget(widget.FILL_RECT, {
        x: sp(20), y: tableY, w: SCREEN.WIDTH - sp(40), h: sp(160), radius: sp(20),
        color: COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: tableY + sp(15), w: SCREEN.WIDTH - sp(80), h: sp(100),
        text: gd.dailyAyah.text,
        text_size: FONT.CAPTION_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
        text_style: text_style.WRAP
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: tableY + sp(110), w: SCREEN.WIDTH - sp(80), h: sp(30),
        text: `— ${gd.dailyAyah.surah} [${gd.dailyAyah.number}]`,
        text_size: FONT.SMALL_SIZE,
        color: COLORS.GOLD_DIM,
        align_h: align.CENTER_H
      })
      tableY += sp(180)
    }

    // ─── Navigation Buttons ──────────────────────────────────────────

    // Qibla Compass Button
    const compassBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(56), radius: sp(28),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: tableY + sp(12), w: SCREEN.WIDTH - sp(60), h: sp(34),
      text: `${DECORATIONS.CRESCENT} ${t('qiblaCompass', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })
    compassBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/compass' })
    })

    tableY += sp(68)

    // Tasbih Button
    const tasbihBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(56), radius: sp(28),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: tableY + sp(12), w: SCREEN.WIDTH - sp(60), h: sp(34),
      text: `${DECORATIONS.STAR} ${t('tasbih', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })
    tasbihBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/tasbih' })
    })

    tableY += sp(68)

    // Zakat Button
    const zakatBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(56), radius: sp(28),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: tableY + sp(12), w: SCREEN.WIDTH - sp(60), h: sp(34),
      text: `${DECORATIONS.STAR} ${t('zakatCalculator', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })
    zakatBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/zakat' })
    })

    tableY += sp(68)

    // Fasting Button
    const fastingBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(56), radius: sp(28),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: tableY + sp(12), w: SCREEN.WIDTH - sp(60), h: sp(34),
      text: `${DECORATIONS.CRESCENT} ${t('fastingTracker', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })
    fastingBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/fasting' })
    })

    tableY += sp(68)

    // Settings Button
    const settingsBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: tableY, w: SCREEN.WIDTH - sp(60), h: sp(56), radius: sp(28),
      color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: tableY + sp(12), w: SCREEN.WIDTH - sp(60), h: sp(34),
      text: `⚙ ${t('settings', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })
    settingsBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/settings' })
    })

    // ─── Footer Ornament ─────────────────────────────────────────────
    tableY += sp(76)
    createWidget(widget.TEXT, {
      x: 0, y: tableY, w: SCREEN.WIDTH, h: sp(30),
      text: `${DECORATIONS.ORNAMENT_L} ${DECORATIONS.SEPARATOR} ${DECORATIONS.ORNAMENT_R}`,
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.GOLD_DIM,
      align_h: align.CENTER_H
    })
  },

  onDestroy() {
    if (geoSensor) {
      try { geoSensor.stop() } catch (e) {}
    }
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  }
})
