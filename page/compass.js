// SalatWatch v2.2 — Qibla Compass (remake)
// Classic magnetic-compass design: FIXED dial with tick marks, two rotating
// PNG needles (red = North, gold = Qibla/mosque). Per heading change we set
// exactly 2 image angles + 2 texts — no more moving 8 label widgets around,
// which is what made the old compass laggy.
// No buttons: tap anywhere on the dial to refresh GPS; swipe right to go back.

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { localStorage } from '@zos/storage'
import { Compass } from '@zos/sensor'
import { calculateQiblaDirection, distanceToKaaba, calculateBearing, distanceBetween } from '../utils/qibla'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS } from '../utils/constants'

let compass = null

Page({
  onInit(param) {
    // Optional target from the mosque page: {"lat":..,"lng":..,"name":".."}
    this._target = null
    try {
      if (typeof param === 'string' && param.indexOf('{') !== -1) {
        const parsed = JSON.parse(param)
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          this._target = parsed
        }
      }
    } catch (_) {}
  },

  build() {
    const gd = (() => { try { const a = getApp(); return a.globalData || (a._options && a._options.globalData) || {} } catch (_) { return {} } })()
    const lang = gd.language || 'en'
    const W = SCREEN.WIDTH
    const H = SCREEN.HEIGHT
    const CX = Math.round(W / 2)
    const CY = Math.round(H / 2)
    const target = this._target

    let lat = gd.latitude || 0
    let lng = gd.longitude || 0
    if (!lat) {
      try {
        lat = parseFloat(localStorage.getItem('salatwatch_latitude')) || 32.9024
        lng = parseFloat(localStorage.getItem('salatwatch_longitude')) || 13.1800
      } catch (_) { lat = 32.9024; lng = 13.1800 }
    }

    function computeTargetAngle() {
      return target ? calculateBearing(lat, lng, target.lat, target.lng)
                    : calculateQiblaDirection(lat, lng)
    }
    function distanceLabel() {
      if (target) {
        const km = distanceBetween(lat, lng, target.lat, target.lng)
        return (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`) + ' · ' + t('toMosque', lang)
      }
      return `${distanceToKaaba(lat, lng)} ${t('kmToKaaba', lang)}`
    }

    let qiblaAngle = computeTargetAngle()
    let currentHeading = 0

    // ═══ STATIC DIAL (drawn once, never redrawn) ═══
    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: COLORS.BG_PRIMARY })

    const DIAL_R = Math.floor(W / 2) - sp(6)
    const dialFace = createWidget(widget.CIRCLE, { center_x: CX, center_y: CY, radius: DIAL_R, color: 0x0d1f17 })

    // Ring track
    createWidget(widget.ARC, {
      x: CX - DIAL_R, y: CY - DIAL_R, w: DIAL_R * 2, h: DIAL_R * 2,
      start_angle: -90, end_angle: 270, color: 0x1c3a28, line_width: sp(5)
    })

    // Tick dots every 30°, brighter every 90°
    for (let a = 0; a < 360; a += 30) {
      const rad = (a - 90) * Math.PI / 180
      const r = DIAL_R - sp(16)
      createWidget(widget.CIRCLE, {
        center_x: Math.round(CX + r * Math.cos(rad)),
        center_y: Math.round(CY + r * Math.sin(rad)),
        radius: a % 90 === 0 ? sp(3) : sp(2),
        color: a % 90 === 0 ? COLORS.TEXT_SECONDARY : COLORS.COMPASS_TICK
      })
    }

    // Gold arc segment on the ring — backup qibla indicator (also looks good)
    const qiblaArcSeg = createWidget(widget.ARC, {
      x: CX - DIAL_R, y: CY - DIAL_R, w: DIAL_R * 2, h: DIAL_R * 2,
      start_angle: -104, end_angle: -76, color: COLORS.GOLD, line_width: sp(5)
    })

    // ═══ ROTATING NEEDLES (40x360 PNGs, pivot at image center) ═══
    const NEEDLE_W = sp(40)
    const NEEDLE_H = sp(360)
    const northNeedle = createWidget(widget.IMG, {
      x: CX - NEEDLE_W / 2, y: CY - NEEDLE_H / 2, w: NEEDLE_W, h: NEEDLE_H,
      center_x: CX, center_y: CY, angle: 0, auto_scale: true,
      src: 'needle_north.png'
    })
    const qiblaNeedle = createWidget(widget.IMG, {
      x: CX - NEEDLE_W / 2, y: CY - NEEDLE_H / 2, w: NEEDLE_W, h: NEEDLE_H,
      center_x: CX, center_y: CY, angle: 0, auto_scale: true,
      src: 'needle_qibla.png'
    })

    // Hub
    createWidget(widget.CIRCLE, { center_x: CX, center_y: CY, radius: sp(13), color: 0x0a1a11 })
    createWidget(widget.CIRCLE, { center_x: CX, center_y: CY, radius: sp(6), color: COLORS.GOLD })

    // ═══ READOUTS ═══
    const degWidget = createWidget(widget.TEXT, {
      x: CX - sp(80), y: CY + sp(26), w: sp(160), h: sp(40),
      text: '--°', text_size: sp(32), color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })
    const cardinalWidget = createWidget(widget.TEXT, {
      x: CX - sp(40), y: CY + sp(64), w: sp(80), h: sp(24),
      text: '--', text_size: sp(18), color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // Target name / qibla angle badge
    const qiblaLabelW = createWidget(widget.TEXT, {
      x: CX - sp(110), y: CY + sp(92), w: sp(220), h: sp(22),
      text: target ? String(target.name || t('nearbyMosque', lang)) : `القبلة ${Math.round(qiblaAngle)}°`,
      text_size: sp(15), color: COLORS.GOLD,
      align_h: align.CENTER_H, text_style: text_style.ELLIPSIS
    })
    const distWidget = createWidget(widget.TEXT, {
      x: CX - sp(110), y: CY + sp(116), w: sp(220), h: sp(20),
      text: distanceLabel(), text_size: sp(13), color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // Aligned badge (appears when facing the target)
    const alignedBadge = createWidget(widget.TEXT, {
      x: CX - sp(100), y: CY - sp(60), w: sp(200), h: sp(24),
      text: '', text_size: sp(17), color: COLORS.EMERALD_LIGHT,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // Calibration / status line at the top
    const calibWidget = createWidget(widget.TEXT, {
      x: sp(30), y: sp(14), w: W - sp(60), h: sp(24),
      text: '', text_size: sp(13), color: COLORS.ALERT,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    // ═══ UPDATE (2 angles + arc + 2 texts per redraw) ═══
    let wasAligned = false
    function updateDisplay(heading) {
      currentHeading = heading
      const northAngle = Math.round((360 - heading) % 360)
      const qiblaRel = Math.round((qiblaAngle - heading + 360) % 360)

      try { northNeedle.setProperty(prop.ANGLE, northAngle) } catch (_) {}
      try { qiblaNeedle.setProperty(prop.ANGLE, qiblaRel) } catch (_) {}
      try {
        qiblaArcSeg.setProperty(prop.MORE, {
          x: CX - DIAL_R, y: CY - DIAL_R, w: DIAL_R * 2, h: DIAL_R * 2,
          start_angle: qiblaRel - 90 - 14, end_angle: qiblaRel - 90 + 14, line_width: sp(5)
        })
      } catch (_) {}
      try { degWidget.setProperty(prop.TEXT, `${Math.round(heading)}°`) } catch (_) {}

      let diff = Math.abs(heading - qiblaAngle)
      if (diff > 180) diff = 360 - diff
      const aligned = diff < 10
      if (aligned !== wasAligned) {
        wasAligned = aligned
        try {
          if (aligned) {
            alignedBadge.setProperty(prop.TEXT, target ? '✓' : '✓ مستقبل القبلة')
            qiblaArcSeg.setProperty(prop.COLOR, COLORS.EMERALD_LIGHT)
            degWidget.setProperty(prop.COLOR, COLORS.EMERALD_LIGHT)
          } else {
            alignedBadge.setProperty(prop.TEXT, '')
            qiblaArcSeg.setProperty(prop.COLOR, COLORS.GOLD)
            degWidget.setProperty(prop.COLOR, COLORS.TEXT_PRIMARY)
          }
        } catch (_) {}
      }
    }

    // Tap the dial to refresh GPS + recompute the target bearing
    dialFace.addEventListener(event.CLICK_UP, () => {
      try { calibWidget.setProperty(prop.TEXT, '⟳ GPS…') } catch (_) {}
      try {
        const { Geolocation } = require('@zos/sensor')
        const geo = new Geolocation()
        geo.start()
        setTimeout(() => {
          try {
            const la = geo.getLatitude()
            const lo = geo.getLongitude()
            if (la && lo && la !== 0) {
              lat = la; lng = lo
              try {
                localStorage.setItem('salatwatch_latitude', String(la))
                localStorage.setItem('salatwatch_longitude', String(lo))
              } catch (_) {}
            }
          } catch (_) {}
          try { geo.stop() } catch (_) {}
          qiblaAngle = computeTargetAngle()
          try {
            if (!target) qiblaLabelW.setProperty(prop.TEXT, `القبلة ${Math.round(qiblaAngle)}°`)
            distWidget.setProperty(prop.TEXT, distanceLabel())
            calibWidget.setProperty(prop.TEXT, '')
          } catch (_) {}
          updateDisplay(currentHeading)
        }, 2500)
      } catch (_) {
        try { calibWidget.setProperty(prop.TEXT, '') } catch (_) {}
      }
    })

    // ═══ SENSOR ═══
    updateDisplay(0)
    try {
      compass = new Compass()
      compass.start()

      let lastDrawn = -999
      compass.onChange(() => {
        try {
          if (!compass.getStatus()) {
            try { calibWidget.setProperty(prop.TEXT, '⟳ حرّك يدك على شكل ∞') } catch (_) {}
            return
          }
          const angle = compass.getDirectionAngle()
          if (angle === 'INVALID' || angle === undefined || angle === null) return
          const heading = Number(angle)
          if (isNaN(heading)) return

          // Redraw only on ≥2° real movement (kills jitter-lag)
          let delta = Math.abs(heading - lastDrawn)
          if (delta > 180) delta = 360 - delta
          if (delta < 2) return
          lastDrawn = heading

          try { calibWidget.setProperty(prop.TEXT, '') } catch (_) {}
          try { cardinalWidget.setProperty(prop.TEXT, String(compass.getDirection())) } catch (_) {}
          updateDisplay(heading)
        } catch (_) {}
      })
    } catch (e) {
      try { calibWidget.setProperty(prop.TEXT, '⚠ Compass not available') } catch (_) {}
    }
  },

  onDestroy() {
    if (compass) {
      try { compass.offChange() } catch (_) {}
      try { compass.stop() } catch (_) {}
      compass = null
    }
  }
})
