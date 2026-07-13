// SalatWatch v2.1.1 — Nearby Mosques
// FIXED: correct response unwrapping, retry button, clear error states

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { push } from '@zos/router'
import { localStorage } from '@zos/storage'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS } from '../utils/constants'

function getGlobalData() {
  try { const a = getApp(); return a.globalData || (a._options && a._options.globalData) || {} } catch(_){ return {} }
}

let spinnerTimer = null
let timeoutTimer = null
let geoSensor    = null
let gpsPollTimer = null

Page({
  onInit() {},

  build() {
    const gd   = getGlobalData()
    const lang = gd.language || 'en'
    const W    = SCREEN.WIDTH
    const H    = SCREEN.HEIGHT

    // ── Background (tap anywhere = retry when in error/empty state) ─────────
    const bgRect = createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: COLORS.BG_PRIMARY })
    let canRetry = false
    bgRect.addEventListener(event.CLICK_UP, () => {
      if (!canRetry) return
      canRetry = false
      try { localStorage.removeItem('salatwatch_mosques_cache') } catch(_){}
      if (spinnerTimer) { clearInterval(spinnerTimer); spinnerTimer = null }
      if (timeoutTimer) { clearTimeout(timeoutTimer);  timeoutTimer = null }
      if (gpsPollTimer) { clearInterval(gpsPollTimer); gpsPollTimer = null }
      load()
    })

    // ── Title ───────────────────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(20), w: W, h: sp(32),
      text: t('nearbyMosque', lang),
      text_size: sp(26), color: COLORS.GOLD,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })
    createWidget(widget.FILL_RECT, {
      x: sp(60), y: sp(56), w: W - sp(120), h: sp(2), color: COLORS.GOLD_DIM
    })

    // ── Status line ─────────────────────────────────────────────────────────
    const statusWidget = createWidget(widget.TEXT, {
      x: sp(20), y: sp(65), w: W - sp(40), h: sp(22),
      text: '', text_size: sp(14), color: COLORS.INACTIVE,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // ── Loading indicator ───────────────────────────────────────────────────
    const loadingWidget = createWidget(widget.TEXT, {
      x: sp(20), y: H / 2 - sp(30), w: W - sp(40), h: sp(36),
      text: '', text_size: sp(24),
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    const hintWidget = createWidget(widget.TEXT, {
      x: sp(20), y: H / 2 + sp(12), w: W - sp(40), h: sp(40),
      text: '', text_size: sp(14),
      color: COLORS.INACTIVE,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // ── Mosque list container (created dynamically) ─────────────────────────
    let mosqueWidgets = []

    function clearMosqueWidgets() {
      // We can't remove widgets in Zepp OS, so we blank the text
      for (const w of mosqueWidgets) {
        try { w.setProperty(prop.TEXT, '') } catch(_){}
      }
      mosqueWidgets = []
    }

    // No buttons: system right-swipe goes back; tap the screen to retry on error.

    // ── GPS ─────────────────────────────────────────────────────────────────
    function getStoredCoords() {
      let lat = gd.latitude || 0
      let lng = gd.longitude || 0
      if (!lat) {
        try {
          lat = parseFloat(localStorage.getItem('salatwatch_latitude'))  || 32.9024
          lng = parseFloat(localStorage.getItem('salatwatch_longitude')) || 13.1800
        } catch(_) { lat = 32.9024; lng = 13.1800 }
      }
      return { lat: lat || 32.9024, lng: lng || 13.1800 }
    }

    // Wait up to ~8s for a live GPS fix; fall back to last known coords.
    // Reading the sensor immediately after start() almost never has a fix yet,
    // which is why searches used to run against stale/fallback coordinates.
    function getFreshCoords(callback) {
      try {
        const { Geolocation } = require('@zos/sensor')
        if (!geoSensor) {
          geoSensor = new Geolocation()
          geoSensor.start()
        }
      } catch(_) {
        callback(getStoredCoords(), false)
        return
      }

      let tries = 0
      try { statusWidget.setProperty(prop.TEXT, 'GPS…') } catch(_){}
      gpsPollTimer = setInterval(() => {
        tries++
        let lat = 0, lng = 0, ok = false
        try {
          const status = geoSensor.getStatus ? geoSensor.getStatus() : 'A'
          lat = geoSensor.getLatitude()
          lng = geoSensor.getLongitude()
          ok = status === 'A' && lat && lng && lat !== 0 && lng !== 0
        } catch(_){}

        if (ok || tries >= 8) {
          clearInterval(gpsPollTimer); gpsPollTimer = null
          if (ok) {
            gd.latitude = lat; gd.longitude = lng
            try {
              localStorage.setItem('salatwatch_latitude', String(lat))
              localStorage.setItem('salatwatch_longitude', String(lng))
            } catch(_){}
            callback({ lat, lng }, true)
          } else {
            callback(getStoredCoords(), false)
          }
        }
      }, 1000)
    }

    // ── Render mosque list ──────────────────────────────────────────────────
    function renderMosques(list, source) {
      try { loadingWidget.setProperty(prop.TEXT, '') } catch(_){}
      try { hintWidget.setProperty(prop.TEXT, '') } catch(_){}
      try {
        statusWidget.setProperty(prop.TEXT,
          list.length > 0 ? `${source ? source + ' · ' : ''}${t('mosqueTapHint', lang)}` : (source || ''))
      } catch(_){}

      let y = sp(86)
      const limit = Math.min(list.length, 4)

      for (let i = 0; i < limit; i++) {
        const mosque = list[i]
        const name   = mosque.name     || `Mosque ${i + 1}`
        const dist   = mosque.distance ? `${Math.round(mosque.distance)} m away` : ''

        const bg = createWidget(widget.FILL_RECT, {
          x: sp(16), y, w: W - sp(32), h: sp(62), radius: sp(14), color: COLORS.BG_ELEVATED
        })

        // Tap a mosque → compass points the way there
        if (typeof mosque.lat === 'number' && typeof mosque.lng === 'number') {
          bg.addEventListener(event.CLICK_UP, () => {
            push({
              url: 'page/compass',
              param: JSON.stringify({ lat: mosque.lat, lng: mosque.lng, name })
            })
          })
        }

        const nameW = createWidget(widget.TEXT, {
          x: sp(28), y: y + sp(6), w: W - sp(56), h: sp(30),
          text: name, text_size: sp(20),
          color: COLORS.TEXT_PRIMARY,
          align_h: align.LEFT, text_style: text_style.ELLIPSIS
        })

        const distW = createWidget(widget.TEXT, {
          x: sp(28), y: y + sp(36), w: W - sp(56), h: sp(20),
          text: dist, text_size: sp(14),
          color: COLORS.EMERALD_LIGHT,
          align_h: align.LEFT, text_style: text_style.NONE
        })

        mosqueWidgets.push(nameW, distW)
        y += sp(72)
      }

      if (list.length === 0) {
        canRetry = true
        try { loadingWidget.setProperty(prop.TEXT, t('noMosqueFound', lang)) } catch(_){}
        try { loadingWidget.setProperty(prop.COLOR, COLORS.ALERT) } catch(_){}
        try { hintWidget.setProperty(prop.TEXT, t('tapToRetry', lang)) } catch(_){}
      }
    }

    // ── Fetch from phone companion ──────────────────────────────────────────
    function fetchFromPhone(lat, lng) {
      const msgBuilder = gd.messageBuilder
      if (!msgBuilder) {
        canRetry = true
        try { loadingWidget.setProperty(prop.TEXT, t('noPhone', lang)) } catch(_){}
        try { hintWidget.setProperty(prop.TEXT, t('tapToRetry', lang)) } catch(_){}
        return
      }

      // Spinner
      const searchBase = t('searching', lang).replace(/[.…]+$/, '')
      let dots = 0
      spinnerTimer = setInterval(() => {
        dots = (dots + 1) % 4
        try { loadingWidget.setProperty(prop.TEXT, searchBase + '.'.repeat(dots)) } catch(_){}
      }, 500)

      // Hard timeout: 30 seconds (Overpass itself may take up to ~25s)
      timeoutTimer = setTimeout(() => {
        if (spinnerTimer) { clearInterval(spinnerTimer); spinnerTimer = null }
        canRetry = true
        try { loadingWidget.setProperty(prop.TEXT, t('timedOut', lang)) } catch(_){}
        try { loadingWidget.setProperty(prop.COLOR, COLORS.ALERT) } catch(_){}
        try { hintWidget.setProperty(prop.TEXT, t('tapToRetry', lang)) } catch(_){}
      }, 30000)

      msgBuilder.request({
        command: 'FETCH_NEARBY_MOSQUES',
        lat: lat,
        lng: lng
      }).then((raw) => {
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null }
        if (spinnerTimer) { clearInterval(spinnerTimer); spinnerTimer = null }

        try {
          // Unwrap all possible nesting layers
          let payload = raw
          if (typeof payload === 'string')      payload = JSON.parse(payload)
          if (payload && payload.data)          payload = payload.data
          if (typeof payload === 'string')      payload = JSON.parse(payload)

          // Extract array
          let list = []
          if (Array.isArray(payload))                list = payload
          else if (payload && Array.isArray(payload.data))     list = payload.data
          else if (payload && Array.isArray(payload.mosques))  list = payload.mosques
          else if (payload && Array.isArray(payload.elements)) list = payload.elements

          // Save to cache
          try {
            localStorage.setItem('salatwatch_mosques_cache', JSON.stringify({ lat, lng, ts: Date.now(), data: list }))
          } catch(_){}

          renderMosques(list, list.length > 0 ? 'Live' : '')
        } catch (e) {
          canRetry = true
          try { loadingWidget.setProperty(prop.TEXT, '⚠ Parse error') } catch(_){}
          try { loadingWidget.setProperty(prop.COLOR, COLORS.ALERT) } catch(_){}
          try { hintWidget.setProperty(prop.TEXT, t('tapToRetry', lang)) } catch(_){}
        }
      }).catch(() => {
        if (timeoutTimer) { clearTimeout(timeoutTimer); timeoutTimer = null }
        if (spinnerTimer) { clearInterval(spinnerTimer); spinnerTimer = null }
        canRetry = true
        try { loadingWidget.setProperty(prop.TEXT, t('connFailed', lang)) } catch(_){}
        try { loadingWidget.setProperty(prop.COLOR, COLORS.ALERT) } catch(_){}
        try { hintWidget.setProperty(prop.TEXT, t('tapToRetry', lang)) } catch(_){}
      })
    }

    // ── Main load logic ─────────────────────────────────────────────────────
    function load() {
      clearMosqueWidgets()
      try { loadingWidget.setProperty(prop.COLOR, COLORS.TEXT_SECONDARY) } catch(_){}
      try { loadingWidget.setProperty(prop.TEXT, t('locating', lang)) } catch(_){}
      try { hintWidget.setProperty(prop.TEXT, t('gettingGps', lang)) } catch(_){}

      getFreshCoords(({ lat, lng }, isLive) => {
        // Check cache (valid for 30 minutes, within 0.05° ~5 km)
        let cachedList = null
        try {
          const raw = localStorage.getItem('salatwatch_mosques_cache')
          if (raw) {
            const cache = JSON.parse(raw)
            const age   = Date.now() - (cache.ts || 0)
            const near  = Math.abs(lat - cache.lat) < 0.05 && Math.abs(lng - cache.lng) < 0.05
            if (near && age < 1800000 && cache.data && cache.data.length > 0) {
              cachedList = cache.data
            }
          }
        } catch(_){}

        if (cachedList) {
          renderMosques(cachedList, 'Cached')
        } else {
          try { loadingWidget.setProperty(prop.TEXT, t('searching', lang)) } catch(_){}
          try {
            hintWidget.setProperty(prop.TEXT,
              `${isLive ? 'GPS' : 'Last known'}: ${lat.toFixed(3)}, ${lng.toFixed(3)}`)
          } catch(_){}
          fetchFromPhone(lat, lng)
        }
      })
    }

    // ── Initial load ────────────────────────────────────────────────────────
    load()
  },

  onDestroy() {
    if (spinnerTimer) { clearInterval(spinnerTimer); spinnerTimer = null }
    if (timeoutTimer) { clearTimeout(timeoutTimer);  timeoutTimer = null }
    if (gpsPollTimer) { clearInterval(gpsPollTimer); gpsPollTimer = null }
    if (geoSensor)    { try { geoSensor.stop() } catch(_){} geoSensor = null }
  }
})

// Helper (can't use SCREEN.WIDTH before Page runs on some firmwares)
function CX() { return SCREEN.WIDTH / 2 }
