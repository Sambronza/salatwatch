/**
 * Qibla Compass Page – SalatWatch
 *
 * Displays a live compass dial showing the direction to Mecca (Kaaba).
 * Uses the device magnetometer + GPS to calculate the Qibla bearing.
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { back } from '@zos/router'
import { t } from '../utils/i18n'
import { calculateQiblaDirection, distanceToKaaba } from '../utils/qibla'
import { sp, SCREEN, COLORS, FONT, DECORATIONS, IMG_ASSETS } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

let compassSensor = null
let geoSensor = null
let compassInterval = null

Page({
  onInit() {
    console.log('Compass page initialized')
  },

  build() {
    const gd = getGlobalData()
    const lang = gd.language || 'en'

    // ─── Background ──────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT,
      color: COLORS.BG_PRIMARY
    })

    // ─── Title ───────────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(30), w: SCREEN.WIDTH, h: sp(36),
      text: t('qiblaCompass', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })

    // ─── Compass Outer Ring ──────────────────────────────────────────
    createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(160),
      y: SCREEN.CENTER_Y + sp(10) - sp(160),
      w: sp(320),
      h: sp(320),
      start_angle: 0,
      end_angle: 360,
      color: COLORS.BG_ELEVATED,
      line_width: sp(4)
    })

    // Compass inner ring
    createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(145),
      y: SCREEN.CENTER_Y + sp(10) - sp(145),
      w: sp(290),
      h: sp(290),
      start_angle: 0,
      end_angle: 360,
      color: COLORS.EMERALD_DARK,
      line_width: sp(2)
    })

    // ─── Cardinal direction markers ──────────────────────────────────
    const cardinals = [
      { label: 'N', angle: 0 },
      { label: 'E', angle: 90 },
      { label: 'S', angle: 180 },
      { label: 'W', angle: 270 }
    ]
    const markerRadius = sp(130)
    for (const c of cardinals) {
      const rad = (c.angle - 90) * (Math.PI / 180)
      const cx = SCREEN.CENTER_X + Math.cos(rad) * markerRadius
      const cy = (SCREEN.CENTER_Y + sp(10)) + Math.sin(rad) * markerRadius
      createWidget(widget.TEXT, {
        x: cx - sp(15), y: cy - sp(12), w: sp(30), h: sp(24),
        text: c.label,
        text_size: FONT.SMALL_SIZE,
        color: c.label === 'N' ? COLORS.ALERT : COLORS.TEXT_SECONDARY,
        align_h: align.CENTER_H
      })
    }

    // ─── Qibla Pointer (image showing the direction) ──────────
    const qiblaAngleText = createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - sp(64)) / 2,
      y: SCREEN.CENTER_Y - sp(30),
      src: IMG_ASSETS.CRESCENT
    })

    // ─── Degree display ──────────────────────────────────────────────
    const degreeLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y + sp(40), w: SCREEN.WIDTH, h: sp(30),
      text: '---°',
      text_size: FONT.BODY_SIZE,
      color: COLORS.EMERALD_LIGHT,
      align_h: align.CENTER_H
    })

    // ─── Distance to Mecca ───────────────────────────────────────────
    let distText = ''
    if (gd.latitude && gd.longitude) {
      const dist = distanceToKaaba(gd.latitude, gd.longitude)
      distText = `${dist} ${t('km', lang)}`
    }

    const distLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y + sp(70), w: SCREEN.WIDTH, h: sp(26),
      text: distText ? `${t('distanceToMecca', lang)}: ${distText}` : '',
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Qibla Indicator Arc (shows the target range) ────────────────
    // We'll update this dynamically
    const qiblaArc = createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(155),
      y: SCREEN.CENTER_Y + sp(10) - sp(155),
      w: sp(310),
      h: sp(310),
      start_angle: -10,
      end_angle: 10,
      color: COLORS.COMPASS_NEEDLE,
      line_width: sp(6)
    })

    // ─── Start Compass Sensor ────────────────────────────────────────
    try {
      const { Compass } = require('@zos/sensor')
      compassSensor = new Compass()
      compassSensor.start()
    } catch (e) {
      console.log('Compass sensor not available:', e)
    }

    // Get GPS if not cached
    if (!gd.latitude || !gd.longitude) {
      try {
        const { Geolocation } = require('@zos/sensor')
        geoSensor = new Geolocation()
        geoSensor.start()
      } catch (e) {
        console.log('GPS not available:', e)
      }
    }

    // ─── Update loop ────────────────────────────────────────
    compassInterval = setInterval(() => {
      try {
        // Refresh GPS if needed
        if (geoSensor && (!gd.latitude || !gd.longitude)) {
          const lat = geoSensor.getLatitude()
          const lng = geoSensor.getLongitude()
          if (lat && lng && lat !== 0) {
            gd.latitude = lat
            gd.longitude = lng
            const dist = distanceToKaaba(lat, lng)
            distLabel.setProperty(prop.TEXT, `${t('distanceToMecca', lang)}: ${dist} ${t('km', lang)}`)
          }
        }

        if (compassSensor && gd.latitude && gd.longitude) {
          const deviceAngle = compassSensor.getDirectionAngle() || 0
          const qiblaTarget = calculateQiblaDirection(gd.latitude, gd.longitude)
          gd.qiblaAngle = qiblaTarget

          // Relative angle: direction user needs to face
          let relativeAngle = (qiblaTarget - deviceAngle + 360) % 360

          // Update degree display
          degreeLabel.setProperty(prop.TEXT, `${Math.round(relativeAngle)}°`)

          // Update arc position to show Qibla direction on the ring
          const arcStart = relativeAngle - 15 - 90 // offset for Zepp arc rendering
          const arcEnd = relativeAngle + 15 - 90
          qiblaArc.setProperty(prop.MORE, {
            start_angle: arcStart,
            end_angle: arcEnd
          })

          // If pointing close to Qibla (within 10°), change degree color
          if (relativeAngle < 10 || relativeAngle > 350) {
            degreeLabel.setProperty(prop.COLOR, COLORS.ACTIVE)
          } else {
            degreeLabel.setProperty(prop.COLOR, COLORS.EMERALD_LIGHT)
          }
        }
      } catch (e) {
        console.log('Compass update error:', e)
      }
    }, 500)

    // ─── Back button area (tap bottom) ───────────────────────────────
    const backBtn = createWidget(widget.FILL_RECT, {
      x: 0, y: SCREEN.HEIGHT - sp(60), w: SCREEN.WIDTH, h: sp(60),
      color: 0x00000000 // transparent hit area
    })
    createWidget(widget.TEXT, {
      x: 0, y: SCREEN.HEIGHT - sp(50), w: SCREEN.WIDTH, h: sp(30),
      text: '← ' + t('today', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })
    backBtn.addEventListener(event.CLICK_UP, () => {
      back()
    })
  },

  onDestroy() {
    if (compassInterval) clearInterval(compassInterval)
    if (compassSensor) {
      try { compassSensor.stop() } catch (e) {}
    }
    if (geoSensor) {
      try { geoSensor.stop() } catch (e) {}
    }
  }
})
