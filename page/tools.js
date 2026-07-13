// SalatWatch — Tools (reached by swiping RIGHT from home)
// Compass and Mosque are gesture shortcuts from home, but also listed here
// for discoverability, alongside Tasbih and Settings.

import { createWidget, widget, align, text_style, event } from '@zos/ui'
import { push, back } from '@zos/router'
import { onGesture, offGesture, GESTURE_LEFT } from '@zos/interaction'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS } from '../utils/constants'

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

    // Swipe LEFT returns home (mirror of home's RIGHT→tools)
    if (!gestureBound) {
      gestureBound = true
      onGesture({ callback: (e) => { if (e === GESTURE_LEFT) { back(); return true } return false } })
    }

    createWidget(widget.FILL_RECT, { x: 0, y: 0, w: W, h: H, color: COLORS.BG_PRIMARY })

    createWidget(widget.TEXT, {
      x: 0, y: sp(28), w: W, h: sp(34),
      text: t('tools', lang), text_size: sp(28), color: COLORS.GOLD,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })

    const navButtons = [
      { label: t('qiblaCompass', lang), url: 'page/compass', color: COLORS.EMERALD_DARK },
      { label: t('nearbyMosque', lang), url: 'page/mosque',  color: COLORS.EMERALD_DARK },
      { label: t('tasbih', lang),       url: 'page/tasbih',   color: COLORS.EMERALD_DARK },
      { label: t('settings', lang),     url: 'page/settings', color: COLORS.BG_ELEVATED }
    ]

    let btnY = sp(76)
    for (const nav of navButtons) {
      const btn = createWidget(widget.FILL_RECT, {
        x: sp(40), y: btnY, w: W - sp(80), h: sp(64), radius: sp(16), color: nav.color
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: btnY + sp(18), w: W - sp(80), h: sp(30),
        text: nav.label, text_size: sp(23),
        color: nav.color === COLORS.BG_ELEVATED ? COLORS.TEXT_SECONDARY : COLORS.GOLD_LIGHT,
        align_h: align.CENTER_H, text_style: text_style.NONE
      })
      const url = nav.url
      btn.addEventListener(event.CLICK_UP, () => { push({ url }) })
      btnY += sp(76)
    }

    createWidget(widget.TEXT, {
      x: 0, y: H - sp(38), w: W, h: sp(20),
      text: '← ' + t('back', lang), text_size: sp(13), color: COLORS.INACTIVE,
      align_h: align.CENTER_H, text_style: text_style.NONE
    })
  },

  onDestroy() {
    if (gestureBound) { try { offGesture() } catch (_) {} gestureBound = false }
  }
})
