/**
 * Tasbih Counter Page – SalatWatch
 *
 * A digital Dhikr counter:
 *  - Tap the screen to increment
 *  - Haptic feedback at multiples of 33
 *  - Cycle through SubhanAllah / Alhamdulillah / Allahu Akbar
 *  - Long press to reset
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
// getApp is a global function, no import needed
import { back } from '@zos/router'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, IMG_ASSETS } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

// Try importing vibrate module
let vibrate = null
try {
  const vibrateModule = require('@zos/interaction')
  vibrate = vibrateModule.createMotor ? vibrateModule.createMotor() : null
} catch (e) {
  console.log('Vibrate not available')
}

const DHIKR_CYCLE = ['subhanAllah', 'alhamdulillah', 'allahuAkbar']
const DHIKR_ARABIC = ['سبحان الله', 'الحمد لله', 'الله أكبر']

let count = 0
let dhikrIndex = 0 // cycles 0,1,2
let totalSets = 0

Page({
  onInit() {
    console.log('Tasbih page initialized')
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
      x: 0, y: sp(28), w: SCREEN.WIDTH, h: sp(36),
      text: t('tasbih', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })

    // Stars
    createWidget(widget.IMG, {
      x: SCREEN.CENTER_X - sp(75), y: sp(34),
      src: IMG_ASSETS.STAR
    })
    createWidget(widget.IMG, {
      x: SCREEN.CENTER_X + sp(60), y: sp(34),
      src: IMG_ASSETS.STAR
    })

    // ─── Decorative Outer Ring ───────────────────────────────────────
    createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(140),
      y: SCREEN.CENTER_Y + sp(10) - sp(140),
      w: sp(280),
      h: sp(280),
      start_angle: 0,
      end_angle: 360,
      color: COLORS.EMERALD_DARK,
      line_width: sp(3)
    })

    // ─── Progress Ring (fills as count → 33) ─────────────────────────
    const progressRing = createWidget(widget.ARC, {
      x: SCREEN.CENTER_X - sp(130),
      y: SCREEN.CENTER_Y + sp(10) - sp(130),
      w: sp(260),
      h: sp(260),
      start_angle: -90,
      end_angle: -90,
      color: COLORS.TASBIH_CIRCLE,
      line_width: sp(10)
    })

    // ─── Dhikr Label (Arabic text) ───────────────────────────────────
    const dhikrLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y - sp(55), w: SCREEN.WIDTH, h: sp(40),
      text: DHIKR_ARABIC[dhikrIndex],
      text_size: FONT.HEADER_SIZE + sp(2),
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })

    // ─── Count Display ───────────────────────────────────────────────
    const countLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y - sp(10), w: SCREEN.WIDTH, h: sp(70),
      text: String(count),
      text_size: FONT.COUNTER_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H
    })

    // ─── Sets Label ──────────────────────────────────────────────────
    const setsLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y + sp(60), w: SCREEN.WIDTH, h: sp(26),
      text: `${totalSets}/3`,
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Transliteration ─────────────────────────────────────────────
    const translitLabel = createWidget(widget.TEXT, {
      x: 0, y: SCREEN.CENTER_Y + sp(86), w: SCREEN.WIDTH, h: sp(24),
      text: t(DHIKR_CYCLE[dhikrIndex], lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Tap Hint ────────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: SCREEN.HEIGHT - sp(70), w: SCREEN.WIDTH, h: sp(22),
      text: t('tapToCount', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.INACTIVE,
      align_h: align.CENTER_H
    })

    // ─── Reset button ────────────────────────────────────────────────
    const resetBtn = createWidget(widget.FILL_RECT, {
      x: SCREEN.CENTER_X - sp(50), y: SCREEN.HEIGHT - sp(48), w: sp(100), h: sp(36), radius: sp(18),
      color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: SCREEN.CENTER_X - sp(50), y: SCREEN.HEIGHT - sp(42), w: sp(100), h: sp(26),
      text: t('reset', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })
    resetBtn.addEventListener(event.CLICK_UP, () => {
      count = 0
      dhikrIndex = 0
      totalSets = 0
      countLabel.setProperty(prop.TEXT, '0')
      setsLabel.setProperty(prop.TEXT, '0/3')
      progressRing.setProperty(prop.MORE, { end_angle: -90 })
      dhikrLabel.setProperty(prop.TEXT, DHIKR_ARABIC[0])
      translitLabel.setProperty(prop.TEXT, t(DHIKR_CYCLE[0], lang))
    })

    // ─── Main Tap Area (entire center circle) ────────────────────────
    const tapArea = createWidget(widget.FILL_RECT, {
      x: SCREEN.CENTER_X - sp(130), y: SCREEN.CENTER_Y - sp(120),
      w: sp(260), h: sp(240),
      color: 0x00000000 // transparent
    })
    tapArea.addEventListener(event.CLICK_UP, () => {
      count++

      // Update counter
      countLabel.setProperty(prop.TEXT, String(count))
      
      const progress = Math.min(100, Math.round((count / 33) * 100))
      progressRing.setProperty(prop.MORE, { end_angle: -90 + Math.round(3.6 * progress) })

      // Haptic feedback at every 33
      if (count % 33 === 0) {
        if (vibrate) {
          try { vibrate.start() } catch (e) {}
        }

        // Cycle to next dhikr after 33
        dhikrIndex = (dhikrIndex + 1) % 3
        totalSets++
        count = 0

        countLabel.setProperty(prop.TEXT, '0')
        progressRing.setProperty(prop.MORE, { end_angle: -90 })
        dhikrLabel.setProperty(prop.TEXT, DHIKR_ARABIC[dhikrIndex])
        translitLabel.setProperty(prop.TEXT, t(DHIKR_CYCLE[dhikrIndex], lang))
        setsLabel.setProperty(prop.TEXT, `${totalSets}/3`)
      }

      // Subtle feedback at every 10
      if (count % 10 === 0 && count !== 0) {
        if (vibrate) {
          try { vibrate.start() } catch (e) {}
        }
      }
    })
  },

  onDestroy() {
    console.log('Tasbih page destroyed')
  }
})
