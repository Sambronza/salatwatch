import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { push } from '@zos/router'
import { localStorage } from '@zos/storage'

import { calculatePrayerTimes, timeToMinutes, calculateLastThirdOfNight } from '../utils/prayerTimes'
import { gregorianToHijri, detectIslamicHoliday, formatHijriDate, isRamadan } from '../utils/hijri'
import { schedulePrayerAlarms } from '../utils/notifier'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS, IMG_ASSETS } from '../utils/constants'

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
    const app = getApp()
    const gd = getGlobalData()
    if (!gd) {
      console.log('SalatWatch ERROR: globalData is null!')
      return
    }

    // Read language from localStorage (set by lang page)
    try {
      const savedLang = localStorage.getItem('salatwatch_lang')
      if (savedLang) gd.language = savedLang
    } catch (e) {}

    const lang = gd.language || 'en'
    const now = new Date()
    console.log('SalatWatch: Using language: ' + lang)

    // ─── Background ────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT * 4,
      color: COLORS.BG_PRIMARY
    })

    // ─── Decorative Gold Border Frame ──────────────────────────────
    // Outer gold ring
    createWidget(widget.ARC, {
      x: sp(8), y: sp(8),
      w: SCREEN.WIDTH - sp(16), h: SCREEN.WIDTH - sp(16),
      start_angle: 0, end_angle: 360,
      color: COLORS.GOLD_DIM,
      line_width: sp(2)
    })
    // Inner gold ring
    createWidget(widget.ARC, {
      x: sp(18), y: sp(18),
      w: SCREEN.WIDTH - sp(36), h: SCREEN.WIDTH - sp(36),
      start_angle: 0, end_angle: 360,
      color: COLORS.GOLD_DIM,
      line_width: sp(1)
    })

    // ─── Crescent Moon Icon (centered, small) ──────────────────────
    const crescentSize = sp(28)
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - crescentSize) / 2,
      y: sp(30),
      w: crescentSize,
      h: crescentSize,
      src: IMG_ASSETS.CRESCENT
    })

    // ─── Hijri Date ────────────────────────────────────────────────
    const hijri = gregorianToHijri(now)
    const hijriStr = formatHijriDate(hijri, lang)
    gd.hijriDate = hijri

    createWidget(widget.TEXT, {
      x: 0, y: sp(62), w: SCREEN.WIDTH, h: sp(24),
      text: hijriStr,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.GOLD_DIM,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Holiday Banner ────────────────────────────────────────────
    const holiday = detectIslamicHoliday(hijri.month, hijri.day)
    let yOffset = sp(90)
    if (holiday) {
      createWidget(widget.FILL_RECT, {
        x: sp(40), y: yOffset, w: SCREEN.WIDTH - sp(80), h: sp(32), radius: sp(16),
        color: COLORS.GOLD_DIM
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: yOffset + sp(4), w: SCREEN.WIDTH - sp(80), h: sp(26),
        text: lang === 'ar' ? holiday.ar : holiday.en,
        text_size: FONT.SMALL_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
        text_style: text_style.NONE
      })
      yOffset += sp(40)
    }

    // ─── GPS & Prayer Times ────────────────────────────────────────
    let prayerTimes = null
    const timezone = -now.getTimezoneOffset() / 60

    try {
      console.log('SalatWatch: Initializing Geolocation...')
      const { Geolocation } = require('@zos/sensor')
      geoSensor = new Geolocation()
      geoSensor.start()

      const lat = geoSensor.getLatitude()
      const lng = geoSensor.getLongitude()
      console.log(`SalatWatch: GPS Found: ${lat}, ${lng}`)

      if (lat && lng && lat !== 0 && lng !== 0) {
        gd.latitude = lat
        gd.longitude = lng
        prayerTimes = calculatePrayerTimes(lat, lng, timezone, now, gd.calculationMethod, 0)
        gd.prayerTimes = prayerTimes

        if (gd.alarmSettings.adhanSound) {
          schedulePrayerAlarms(prayerTimes)
        }
      }
    } catch (e) {
      console.log('GPS not available:', e)
    }

    if (!prayerTimes) {
      prayerTimes = calculatePrayerTimes(21.4225, 39.8262, 3, now, gd.calculationMethod, 0)
      gd.prayerTimes = prayerTimes
    }

    // Request fresh data from companion
    app.requestCompanionData = () => {
      try {
        const appInst = getApp()
        if (appInst.messaging) {
          appInst.messaging.request({
            command: 'FETCH_PRAYER_TIMES',
            latitude: gd.latitude || 21.4225,
            longitude: gd.longitude || 39.8262,
            method: gd.calculationMethod
          }).catch(e => console.log('Companion request error:', e))
          appInst.messaging.request({
            command: 'FETCH_DAILY_CONTENT',
            language: lang
          }).catch(e => console.log('Companion request error:', e))
        }
      } catch (e) {
        console.log('Error requesting companion data:', e)
      }
    }
    app.requestCompanionData()

    // ─── Next Prayer Calculation ───────────────────────────────────
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

    // ─── "Next Prayer: Dhuhr • 12:34" (Single Line, Screenshot Style) ──
    createWidget(widget.TEXT, {
      x: sp(20), y: yOffset, w: SCREEN.WIDTH - sp(40), h: sp(28),
      text: `${t('nextPrayer', lang)}:`,
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    createWidget(widget.TEXT, {
      x: sp(20), y: yOffset + sp(28), w: SCREEN.WIDTH - sp(40), h: sp(36),
      text: `${t(nextPrayer, lang)} \u2022 ${nextPrayerTime}`,
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    yOffset += sp(72)

    // ─── Top separator ─────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(50), y: yOffset, w: SCREEN.WIDTH - sp(100), h: sp(1),
      color: COLORS.GOLD_DIM
    })
    yOffset += sp(12)

    // ─── Full Timetable (Compact, matching screenshot) ─────────────
    // Show all prayers + sunrise in a clean aligned list
    const allRows = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

    for (const key of allRows) {
      const isNext = key === nextPrayer
      const pTime = prayerTimes[key]
      const pMin = timeToMinutes(pTime)
      const isPast = key !== 'sunrise' && pMin <= currentMinutes && !isNext
      const isSunrise = key === 'sunrise'

      // Highlight row background for next prayer
      if (isNext) {
        createWidget(widget.FILL_RECT, {
          x: sp(40), y: yOffset - sp(2),
          w: SCREEN.WIDTH - sp(80), h: sp(32),
          radius: sp(6),
          color: COLORS.BG_ELEVATED
        })
      }

      // Prayer name (left-aligned)
      createWidget(widget.TEXT, {
        x: sp(55), y: yOffset, w: sp(160), h: sp(28),
        text: t(key, lang),
        text_size: isNext ? FONT.BODY_SIZE : (isSunrise ? FONT.SMALL_SIZE : FONT.CAPTION_SIZE),
        color: isNext ? COLORS.GOLD : (isPast ? COLORS.INACTIVE : (isSunrise ? COLORS.TEXT_SECONDARY : COLORS.TEXT_PRIMARY)),
        align_h: align.LEFT,
        text_style: text_style.NONE
      })

      // Prayer time (right-aligned)
      createWidget(widget.TEXT, {
        x: SCREEN.WIDTH - sp(180), y: yOffset, w: sp(125), h: sp(28),
        text: pTime,
        text_size: isNext ? FONT.BODY_SIZE : (isSunrise ? FONT.SMALL_SIZE : FONT.CAPTION_SIZE),
        color: isNext ? COLORS.GOLD : (isPast ? COLORS.INACTIVE : COLORS.TEXT_SECONDARY),
        align_h: align.RIGHT,
        text_style: text_style.NONE
      })

      yOffset += isNext ? sp(36) : sp(30)
    }

    // ─── Bottom separator ──────────────────────────────────────────
    yOffset += sp(4)
    createWidget(widget.FILL_RECT, {
      x: sp(50), y: yOffset, w: SCREEN.WIDTH - sp(100), h: sp(1),
      color: COLORS.GOLD_DIM
    })
    yOffset += sp(16)

    // ─── Live Update Timer ─────────────────────────────────────────
    // (Not visible — just updates the countdown internally)
    timerInterval = setInterval(() => {
      // Silent timer to keep track, main display will update on next build
    }, 60000)

    // ─── Ayah of the Day Card ──────────────────────────────────────
    if (gd.dailyAyah) {
      createWidget(widget.FILL_RECT, {
        x: sp(24), y: yOffset, w: SCREEN.WIDTH - sp(48), h: sp(140), radius: sp(16),
        color: COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(36), y: yOffset + sp(12), w: SCREEN.WIDTH - sp(72), h: sp(80),
        text: gd.dailyAyah.text,
        text_size: FONT.SMALL_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H,
        text_style: text_style.WRAP
      })
      createWidget(widget.TEXT, {
        x: sp(36), y: yOffset + sp(96), w: SCREEN.WIDTH - sp(72), h: sp(24),
        text: `— ${gd.dailyAyah.surah} [${gd.dailyAyah.number}]`,
        text_size: FONT.SMALL_SIZE,
        color: COLORS.GOLD_DIM,
        align_h: align.CENTER_H
      })
      yOffset += sp(152)
    }

    // ─── Navigation Buttons ────────────────────────────────────────
    const navButtons = [
      { label: t('qiblaCompass', lang), url: 'page/compass', color: COLORS.EMERALD_DARK },
      { label: t('tasbih', lang), url: 'page/tasbih', color: COLORS.EMERALD_DARK },
      { label: t('zakatCalculator', lang), url: 'page/zakat', color: COLORS.EMERALD_DARK },
      { label: t('fastingTracker', lang), url: 'page/fasting', color: COLORS.EMERALD_DARK },
      { label: t('settings', lang), url: 'page/settings', color: COLORS.BG_ELEVATED }
    ]

    for (const nav of navButtons) {
      const btn = createWidget(widget.FILL_RECT, {
        x: sp(30), y: yOffset, w: SCREEN.WIDTH - sp(60), h: sp(48), radius: sp(24),
        color: nav.color
      })
      createWidget(widget.TEXT, {
        x: sp(30), y: yOffset + sp(10), w: SCREEN.WIDTH - sp(60), h: sp(28),
        text: nav.label,
        text_size: FONT.BODY_SIZE,
        color: nav.color === COLORS.BG_ELEVATED ? COLORS.TEXT_SECONDARY : COLORS.GOLD_LIGHT,
        align_h: align.CENTER_H,
        text_style: text_style.NONE
      })
      const url = nav.url
      btn.addEventListener(event.CLICK_UP, () => {
        push({ url })
      })
      yOffset += sp(58)
    }

    // ─── Footer ────────────────────────────────────────────────────
    yOffset += sp(10)
    createWidget(widget.FILL_RECT, {
      x: sp(80), y: yOffset, w: SCREEN.WIDTH - sp(160), h: sp(1),
      color: COLORS.GOLD_DIM
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
