// SalatWatch v2.2 — Home (remake)
// Design goals: minimal widget count, minimal per-tick redraws, no buttons.
//   Navigation:  ↑ Compass   ↓ Mosque   ← Timetable   → Tools
//   Per second we update exactly ONE text widget (the countdown).
//   The edge gauge redraws at most once per minute.
//   GPS is one-shot: the sensor stops as soon as a good fix is saved.

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { push } from '@zos/router'
import { localStorage } from '@zos/storage'
import { onGesture, offGesture, GESTURE_UP, GESTURE_DOWN, GESTURE_LEFT, GESTURE_RIGHT } from '@zos/interaction'

import { timeToMinutes } from '../utils/prayerTimes'
import { getTimesForDate, monthlyCacheNeedsRefresh, saveMonthlyCache } from '../utils/timetable'
import { gregorianToHijri, detectIslamicHoliday, formatHijriDate } from '../utils/hijri'
import { schedulePrayerAlarms, triggerAdhanAlert, stopAdhanAlert } from '../utils/notifier'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS } from '../utils/constants'

let geoSensor = null
let countdownTimer = null
let gestureBound = false

const FALLBACK_LAT = 32.9024
const FALLBACK_LNG = 13.1800
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getGlobalData() {
  const app = getApp()
  if (!app) return {}
  return app.globalData || (app._options && app._options.globalData) || {}
}

function fmtCountdown(totalSec) {
  if (totalSec <= 0) return '00:00:00'
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function secondsUntil(timeStr) {
  const now = new Date()
  const [h, m] = timeStr.split(':').map(Number)
  const target = new Date()
  target.setHours(h, m, 0, 0)
  let diff = Math.floor((target - now) / 1000)
  if (diff < 0) diff += 86400
  return diff
}

Page({
  onInit(param) {
    this._launchParam = typeof param === 'string' ? param : ''
  },

  build() {
    const gd = getGlobalData()
    if (!gd.alarmSettings) {
      gd.alarmSettings = { adhanSound: true, duaReminders: true, fastingAlerts: false }
    }
    try {
      const savedLang = localStorage.getItem('salatwatch_lang')
      if (savedLang) gd.language = savedLang
    } catch (e) {}

    const lang = gd.language || 'en'
    const now = new Date()
    const timezone = -now.getTimezoneOffset() / 60
    const W = SCREEN.WIDTH
    const H = SCREEN.HEIGHT
    const CX = Math.round(W / 2)

    // ═══ GESTURE NAVIGATION (no buttons anywhere) ═══
    if (!gestureBound) {
      gestureBound = true
      onGesture({
        callback: (e) => {
          if (e === GESTURE_UP)    { push({ url: 'page/compass' });   return true }
          if (e === GESTURE_DOWN)  { push({ url: 'page/mosque' });    return true }
          if (e === GESTURE_LEFT)  { push({ url: 'page/timetable' }); return true }
          if (e === GESTURE_RIGHT) { push({ url: 'page/tools' });     return true }
          return false
        }
      })
    }

    // Alarm launch → play Adhan right away
    if (this._launchParam && this._launchParam.indexOf('adhan=') !== -1) {
      try { triggerAdhanAlert(gd.selectedAdhan) } catch (e) {}
      this._launchParam = ''
    }

    // ─── Location: saved coords now, one-shot GPS refinement ──────
    let usedLat = FALLBACK_LAT
    let usedLng = FALLBACK_LNG
    try {
      const savedLat = parseFloat(localStorage.getItem('salatwatch_latitude'))
      const savedLng = parseFloat(localStorage.getItem('salatwatch_longitude'))
      if (savedLat && savedLng) { usedLat = savedLat; usedLng = savedLng }
    } catch (e) {}
    gd.latitude = usedLat
    gd.longitude = usedLng

    try {
      const { Geolocation } = require('@zos/sensor')
      geoSensor = new Geolocation()
      geoSensor.start()
      if (typeof geoSensor.onChange === 'function') {
        geoSensor.onChange(() => {
          try {
            const status = geoSensor.getStatus ? geoSensor.getStatus() : 'A'
            const la = geoSensor.getLatitude()
            const lo = geoSensor.getLongitude()
            if (status !== 'A' || !la || !lo || la === 0 || lo === 0) return
            gd.latitude = la
            gd.longitude = lo
            localStorage.setItem('salatwatch_latitude', String(la))
            localStorage.setItem('salatwatch_longitude', String(lo))
            const n = new Date()
            try { dateWidget.setProperty(prop.TEXT, `${n.getDate()} ${MONTHS[n.getMonth()]} · GPS ✓`) } catch (e) {}
            // Fix saved — stop the sensor, it costs battery and jank
            try { geoSensor.offChange && geoSensor.offChange() } catch (e) {}
            try { geoSensor.stop() } catch (e) {}
            geoSensor = null
          } catch (e) {}
        })
      }
    } catch (e) {}

    // ─── Prayer times ──────────────────────────────────────────────
    const method = gd.calculationMethod || 3
    const asrJur = gd.asrJuristic || 0
    const todayResult = getTimesForDate(now, usedLat, usedLng, timezone, method, asrJur)
    const prayerTimes = todayResult.times
    gd.prayerTimes = prayerTimes

    if (gd.alarmSettings.adhanSound) {
      try {
        const tomorrow = new Date(now.getTime() + 86400000)
        const tomorrowTimes = getTimesForDate(tomorrow, usedLat, usedLng, timezone, method, asrJur).times
        schedulePrayerAlarms(prayerTimes, tomorrowTimes)
      } catch (e) {}
    }

    const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
    function computeNextPrayer(nowMinutes) {
      for (const key of prayerOrder) {
        if (timeToMinutes(prayerTimes[key]) > nowMinutes) return { key, time: prayerTimes[key] }
      }
      return { key: 'fajr', time: prayerTimes.fajr }
    }
    function computePrevMinutes(nowMinutes) {
      let prev = timeToMinutes(prayerTimes.isha) - 1440
      for (const key of prayerOrder) {
        const min = timeToMinutes(prayerTimes[key])
        if (min <= nowMinutes) prev = min
      }
      return prev
    }
    let { key: nextPrayer, time: nextPrayerTime } = computeNextPrayer(now.getHours() * 60 + now.getMinutes())

    const hijri = gregorianToHijri(now)
    const holiday = detectIslamicHoliday(hijri.month, hijri.day)

    // ════════════════ LAYOUT ════════════════
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: COLORS.BG_PRIMARY })

    // Mosque skyline art along the bottom
    createWidget(widget.IMG, {
      x: 0, y: H - sp(110), w: W, h: sp(110), auto_scale: true,
      src: 'mosque_skyline.png'
    })

    // Edge gauge: dim track + gold progress (prev prayer → next prayer)
    createWidget(widget.ARC, {
      x: sp(3), y: sp(3), w: W - sp(6), h: H - sp(6),
      start_angle: -90, end_angle: 270, color: COLORS.BG_ELEVATED, line_width: sp(6)
    })
    const progressArc = createWidget(widget.ARC, {
      x: sp(3), y: sp(3), w: W - sp(6), h: H - sp(6),
      start_angle: -90, end_angle: -90, color: COLORS.GOLD, line_width: sp(6)
    })
    let lastArcMin = -1
    function updateProgressArc(force) {
      const n = new Date()
      const nowMin = n.getHours() * 60 + n.getMinutes()
      if (!force && nowMin === lastArcMin) return
      lastArcMin = nowMin
      const prevMin = computePrevMinutes(nowMin)
      let nextMin = timeToMinutes(nextPrayerTime)
      if (nextMin <= nowMin) nextMin += 1440
      const span = nextMin - prevMin
      const frac = span > 0 ? Math.min(1, Math.max(0, (nowMin - prevMin) / span)) : 0
      try {
        progressArc.setProperty(prop.MORE, {
          x: sp(3), y: sp(3), w: W - sp(6), h: H - sp(6),
          start_angle: -90, end_angle: Math.round(-90 + 360 * frac), line_width: sp(6)
        })
      } catch (e) {}
    }

    // Crescent + hijri date
    createWidget(widget.CIRCLE, { center_x: CX, center_y: sp(46), radius: sp(17), color: COLORS.GOLD })
    createWidget(widget.CIRCLE, { center_x: CX + sp(8), center_y: sp(42), radius: sp(14), color: COLORS.BG_PRIMARY })
    createWidget(widget.TEXT, {
      x: sp(30), y: sp(68), w: W - sp(60), h: sp(24),
      text: formatHijriDate(hijri, lang),
      text_size: sp(16), color: COLORS.GOLD_DIM, align_h: align.CENTER_H, text_style: text_style.NONE
    })

    let y = sp(96)
    if (holiday) {
      createWidget(widget.TEXT, {
        x: sp(40), y: y, w: W - sp(80), h: sp(20),
        text: lang === 'ar' ? holiday.ar : holiday.en,
        text_size: sp(14), color: COLORS.GOLD_LIGHT, align_h: align.CENTER_H, text_style: text_style.NONE
      })
      y += sp(24)
    }

    // Next prayer block
    createWidget(widget.TEXT, {
      x: 0, y: y, w: W, h: sp(20), text: t('nextPrayer', lang),
      text_size: sp(16), color: COLORS.TEXT_SECONDARY, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    const prayerNameWidget = createWidget(widget.TEXT, {
      x: 0, y: y + sp(20), w: W, h: sp(64), text: t(nextPrayer, lang),
      text_size: sp(54), color: COLORS.TEXT_PRIMARY, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    const prayerTimeWidget = createWidget(widget.TEXT, {
      x: 0, y: y + sp(84), w: W, h: sp(50), text: nextPrayerTime,
      text_size: sp(42), color: COLORS.GOLD, align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // Countdown (no card box — cleaner, fewer widgets; tap to silence Adhan)
    const cdY = y + sp(140)
    const countdownWidget = createWidget(widget.TEXT, {
      x: 0, y: cdY, w: W, h: sp(52), text: fmtCountdown(secondsUntil(nextPrayerTime)),
      text_size: sp(44), color: COLORS.EMERALD_LIGHT, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    countdownWidget.addEventListener(event.CLICK_UP, () => { try { stopAdhanAlert() } catch (e) {} })
    const remainingLabel = createWidget(widget.TEXT, {
      x: 0, y: cdY + sp(52), w: W, h: sp(20), text: t('remaining', lang),
      text_size: sp(14), color: COLORS.TEXT_SECONDARY, align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // Day dots (5 prayers)
    const dayDots = prayerOrder.map((k, i) => createWidget(widget.CIRCLE, {
      center_x: CX - sp(44) + i * sp(22), center_y: cdY + sp(84), radius: sp(4), color: COLORS.INACTIVE
    }))
    function paintDayDots() {
      const n = new Date()
      const nowMin = n.getHours() * 60 + n.getMinutes()
      prayerOrder.forEach((k, i) => {
        const passed = timeToMinutes(prayerTimes[k]) <= nowMin
        const color = k === nextPrayer ? COLORS.GOLD : (passed ? COLORS.EMERALD : COLORS.INACTIVE)
        try { dayDots[i].setProperty(prop.COLOR, color) } catch (e) {}
      })
    }
    paintDayDots()

    // Date/sync line over the skyline, and the down-hint at the very bottom
    const gregStr = `${now.getDate()} ${MONTHS[now.getMonth()]}`
    const dateWidget = createWidget(widget.TEXT, {
      x: 0, y: H - sp(56), w: W, h: sp(18),
      text: `${gregStr} · ${todayResult.source === 'api' ? '✓' : '~'}`,
      text_size: sp(13), color: COLORS.TEXT_SECONDARY, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    createWidget(widget.TEXT, {
      x: 0, y: H - sp(36), w: W, h: sp(16), text: '↓ ' + t('hintDown', lang),
      text_size: sp(12), color: COLORS.INACTIVE, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    // Up hint at top edge; left/right hints at sides
    createWidget(widget.TEXT, {
      x: 0, y: sp(4), w: W, h: sp(14), text: '↑ ' + t('hintUp', lang),
      text_size: sp(12), color: COLORS.INACTIVE, align_h: align.CENTER_H, text_style: text_style.NONE
    })
    createWidget(widget.TEXT, {
      x: sp(8), y: Math.round(H / 2) - sp(7), w: sp(64), h: sp(14), text: '‹',
      text_size: sp(14), color: COLORS.INACTIVE, align_h: align.LEFT, text_style: text_style.NONE
    })
    createWidget(widget.TEXT, {
      x: W - sp(72), y: Math.round(H / 2) - sp(7), w: sp(64), h: sp(14), text: '›',
      text_size: sp(14), color: COLORS.INACTIVE, align_h: align.RIGHT, text_style: text_style.NONE
    })

    // ─── Live countdown / auto-Adhan / Iqama ──────────────────────
    function iqamaMinutesFor(prayerKey) {
      if (gd.iqamaOffset > 0) return gd.iqamaOffset
      return (gd.iqamaMinutes && gd.iqamaMinutes[prayerKey]) || 15
    }
    let iqamaDuration = iqamaMinutesFor(nextPrayer)
    let iqamaMode = false
    let iqamaSecondsLeft = 0

    function advanceToNextPrayer() {
      const n = new Date()
      const next = computeNextPrayer(n.getHours() * 60 + n.getMinutes())
      nextPrayer = next.key
      nextPrayerTime = next.time
      iqamaDuration = iqamaMinutesFor(nextPrayer)
      try {
        prayerNameWidget.setProperty(prop.TEXT, t(nextPrayer, lang))
        prayerTimeWidget.setProperty(prop.TEXT, nextPrayerTime)
      } catch (e) {}
      paintDayDots()
    }

    updateProgressArc(true)

    countdownTimer = setInterval(() => {
      try {
        const remaining = secondsUntil(nextPrayerTime)
        const justPassed = remaining <= 0 || remaining > 86400 - 120
        if (!iqamaMode && justPassed) {
          iqamaMode = true
          iqamaSecondsLeft = iqamaDuration * 60
          if (gd.alarmSettings.adhanSound) { try { triggerAdhanAlert(gd.selectedAdhan) } catch (e) {} }
          countdownWidget.setProperty(prop.COLOR, COLORS.IQAMA_AMBER)
          countdownWidget.setProperty(prop.TEXT, fmtCountdown(iqamaSecondsLeft))
          remainingLabel.setProperty(prop.TEXT, t('iqamaCountdown', lang))
          remainingLabel.setProperty(prop.COLOR, COLORS.IQAMA_AMBER)
          return
        }
        if (iqamaMode) {
          iqamaSecondsLeft -= 1
          if (iqamaSecondsLeft <= 0) {
            iqamaMode = false
            countdownWidget.setProperty(prop.COLOR, COLORS.EMERALD_LIGHT)
            remainingLabel.setProperty(prop.TEXT, t('remaining', lang))
            remainingLabel.setProperty(prop.COLOR, COLORS.TEXT_SECONDARY)
            advanceToNextPrayer()
            updateProgressArc(true)
          } else {
            countdownWidget.setProperty(prop.TEXT, fmtCountdown(iqamaSecondsLeft))
            return
          }
        }
        countdownWidget.setProperty(prop.TEXT, fmtCountdown(remaining))
        updateProgressArc(false)
      } catch (e) {}
    }, 1000)

    // ─── Monthly timetable sync (phone) ────────────────────────────
    try {
      const msgBuilder = gd.messageBuilder
      if (msgBuilder && monthlyCacheNeedsRefresh(usedLat, usedLng, method)) {
        msgBuilder.request({
          command: 'FETCH_MONTHLY_TIMES', latitude: usedLat, longitude: usedLng, method
        }).then((raw) => {
          try {
            let payload = raw
            if (typeof payload === 'string') payload = JSON.parse(payload)
            if (payload && payload.data) payload = payload.data
            if (payload && payload.days && Object.keys(payload.days).length > 0) {
              saveMonthlyCache(payload.days, usedLat, usedLng, method)
              if (gd.alarmSettings.adhanSound) {
                const tmrw = new Date(Date.now() + 86400000)
                const todayT = getTimesForDate(new Date(), usedLat, usedLng, timezone, method, asrJur).times
                const tmrwT = getTimesForDate(tmrw, usedLat, usedLng, timezone, method, asrJur).times
                schedulePrayerAlarms(todayT, tmrwT)
              }
              try { dateWidget.setProperty(prop.TEXT, `${gregStr} · ✓`) } catch (e) {}
            }
          } catch (e) {}
        }).catch(() => {})
      }
    } catch (e) {}
  },

  onDestroy() {
    if (geoSensor) {
      try { geoSensor.offChange && geoSensor.offChange() } catch (e) {}
      try { geoSensor.stop() } catch (e) {}
      geoSensor = null
    }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
    if (gestureBound) { try { offGesture() } catch (e) {} gestureBound = false }
  }
})
