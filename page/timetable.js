// SalatWatch — Prayer Timetable (reached by swiping LEFT from home)
// Reads today's times from globalData (already computed by the home page).

import { createWidget, widget, align, text_style, prop } from '@zos/ui'
import { back } from '@zos/router'
import { onGesture, offGesture, GESTURE_RIGHT } from '@zos/interaction'

import { timeToMinutes, calculateLastThirdOfNight } from '../utils/prayerTimes'
import { getTimesForDate } from '../utils/timetable'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, PRAYER_COLORS } from '../utils/constants'

let gestureBound = false

function getGlobalData() {
  try { const a = getApp(); return a.globalData || (a._options && a._options.globalData) || {} } catch (_) { return {} }
}

Page({
  onInit() {},

  build() {
    const gd = getGlobalData()
    const lang = gd.language || 'en'
    const W = SCREEN.WIDTH
    const H = SCREEN.HEIGHT
    const now = new Date()

    // Use the times the home page already resolved; recompute only if absent
    let prayerTimes = gd.prayerTimes
    if (!prayerTimes || !prayerTimes.fajr) {
      const tz = -now.getTimezoneOffset() / 60
      const lat = gd.latitude || 32.9024
      const lng = gd.longitude || 13.1800
      prayerTimes = getTimesForDate(now, lat, lng, tz, gd.calculationMethod || 3, gd.asrJuristic || 0).times
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    let nextPrayer = 'fajr'
    for (const key of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      if (timeToMinutes(prayerTimes[key]) > currentMinutes) { nextPrayer = key; break }
    }

    // Swipe RIGHT returns home
    if (!gestureBound) {
      gestureBound = true
      onGesture({ callback: (e) => { if (e === GESTURE_RIGHT) { back(); return true } return false } })
    }

    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: COLORS.BG_PRIMARY })

    createWidget(widget.TEXT, {
      x: 0, y: sp(30), w: W, h: sp(36),
      text: t('today', lang), text_size: sp(30), color: COLORS.GOLD,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })
    createWidget(widget.FILL_RECT, {
      x: sp(80), y: sp(70), w: W - sp(160), h: sp(2), color: COLORS.GOLD_DIM
    })

    const allPrayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
    let rowY = sp(84)

    for (const key of allPrayers) {
      const isNext = key === nextPrayer
      const pTime = prayerTimes[key]
      const isPast = timeToMinutes(pTime) <= currentMinutes && !isNext

      createWidget(widget.FILL_RECT, {
        x: sp(24), y: rowY, w: W - sp(48), h: sp(44), radius: sp(10),
        color: isNext ? COLORS.EMERALD_DARK : COLORS.BG_CARD
      })
      createWidget(widget.FILL_RECT, {
        x: sp(38), y: rowY + sp(16), w: sp(10), h: sp(10), radius: sp(5),
        color: isNext ? COLORS.GOLD : (isPast ? COLORS.INACTIVE : (PRAYER_COLORS[key] || COLORS.TEXT_SECONDARY))
      })
      createWidget(widget.TEXT, {
        x: sp(56), y: rowY + sp(6), w: sp(180), h: sp(32),
        text: t(key, lang), text_size: sp(24),
        color: isNext ? COLORS.GOLD_LIGHT : (isPast ? COLORS.INACTIVE : COLORS.TEXT_PRIMARY),
        align_h: align.LEFT, text_style: text_style.NONE
      })
      createWidget(widget.TEXT, {
        x: W - sp(150), y: rowY + sp(6), w: sp(120), h: sp(32),
        text: pTime, text_size: sp(24),
        color: isNext ? COLORS.GOLD_LIGHT : (isPast ? COLORS.INACTIVE : COLORS.TEXT_SECONDARY),
        align_h: align.RIGHT, text_style: text_style.NONE
      })
      rowY += sp(50)
    }

    // Tahajjud row
    rowY += sp(6)
    createWidget(widget.FILL_RECT, {
      x: sp(24), y: rowY, w: W - sp(48), h: sp(38), radius: sp(10), color: COLORS.BG_CARD
    })
    createWidget(widget.TEXT, {
      x: sp(56), y: rowY + sp(6), w: sp(180), h: sp(26),
      text: t('tahajjudTime', lang), text_size: sp(18), color: COLORS.ISHA_COLOR,
      align_h: align.LEFT, text_style: text_style.NONE
    })
    createWidget(widget.TEXT, {
      x: W - sp(150), y: rowY + sp(6), w: sp(120), h: sp(26),
      text: calculateLastThirdOfNight(prayerTimes.maghrib, prayerTimes.fajr),
      text_size: sp(18), color: COLORS.TEXT_SECONDARY,
      align_h: align.RIGHT, text_style: text_style.NONE
    })

    createWidget(widget.TEXT, {
      x: 0, y: H - sp(40), w: W, h: sp(20),
      text: '→ ' + t('back', lang), text_size: sp(13), color: COLORS.INACTIVE,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })
  },

  onDestroy() {
    if (gestureBound) { try { offGesture() } catch (_) {} gestureBound = false }
  }
})
