// SalatWatch v2.0.3 — Tasbih Counter
// Premium: HUGE counter, golden accents, smooth progress

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { back } from '@zos/router'
import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS } from '../utils/constants'

let vibrate = null

function getGlobalData() {
  const app = getApp()
  if (!app) return {}
  return app.globalData || (app._options && app._options.globalData) || {}
}

Page({
  onInit() {},

  build() {
    const gd = getGlobalData()
    const lang = gd.language || 'en'

    let count = 0
    let phase = 0
    const PHASE_LIMIT = 33
    const phases = [
      { key: 'subhanAllah', color: COLORS.EMERALD },
      { key: 'alhamdulillah', color: COLORS.GOLD },
      { key: 'allahuAkbar', color: COLORS.IQAMA_AMBER }
    ]

    try {
      const { Vibrator, VIBRATOR_SCENE_SHORT } = require('@zos/sensor')
      vibrate = new Vibrator()
      vibrate.setMode(VIBRATOR_SCENE_SHORT)
    } catch (e) {}

    const W = SCREEN.WIDTH
    const H = SCREEN.HEIGHT
    const CX = W / 2

    // ── Ring background ───────────────────────────────────────────
    const ringSize = W - sp(50)
    const ringX = sp(25)
    const ringY = sp(30)

    createWidget(widget.FILL_RECT, {
      x: ringX, y: ringY,
      w: ringSize, h: ringSize,
      radius: ringSize / 2,
      color: COLORS.BG_CARD
    })

    // Track ring
    createWidget(widget.ARC, {
      x: ringX, y: ringY, w: ringSize, h: ringSize,
      start_angle: 0, end_angle: 360,
      color: COLORS.BG_ELEVATED, line_width: sp(8)
    })

    // Progress ring
    const progressArc = createWidget(widget.ARC, {
      x: ringX, y: ringY, w: ringSize, h: ringSize,
      start_angle: -90, end_angle: -90,
      color: phases[0].color, line_width: sp(8)
    })

    // ── Phase label ───────────────────────────────────────────────
    const phaseLabel = createWidget(widget.TEXT, {
      x: sp(30), y: ringY + ringSize / 2 - sp(80),
      w: W - sp(60), h: sp(34),
      text: t(phases[0].key, lang),
      text_size: sp(26),
      color: phases[0].color,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ── Count number — HUGE ───────────────────────────────────────
    const countWidget = createWidget(widget.TEXT, {
      x: sp(30), y: ringY + ringSize / 2 - sp(44),
      w: W - sp(60), h: sp(90),
      text: '0',
      text_size: sp(76),
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ── Total ─────────────────────────────────────────────────────
    const totalWidget = createWidget(widget.TEXT, {
      x: sp(30), y: ringY + ringSize / 2 + sp(46),
      w: W - sp(60), h: sp(26),
      text: '0 / 99',
      text_size: sp(22),
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ── Phase dots (3 dots showing which phase) ───────────────────
    const dotY = ringY + ringSize / 2 + sp(76)
    for (let i = 0; i < 3; i++) {
      createWidget(widget.FILL_RECT, {
        x: CX - sp(24) + i * sp(20), y: dotY,
        w: sp(10), h: sp(10),
        radius: sp(5),
        color: i === 0 ? phases[0].color : COLORS.INACTIVE
      })
    }

    // ── Tap area (full circle) ────────────────────────────────────
    const tapArea = createWidget(widget.FILL_RECT, {
      x: ringX, y: ringY,
      w: ringSize, h: ringSize,
      radius: ringSize / 2,
      color: 0x000000, alpha: 0
    })

    tapArea.addEventListener(event.CLICK_UP, () => {
      count++
      const totalCount = phase * PHASE_LIMIT + count

      if (vibrate) { try { vibrate.start() } catch (e) {} }

      // Progress
      const progress = (count / PHASE_LIMIT) * 360
      try {
        progressArc.setProperty(prop.MORE, {
          start_angle: -90,
          end_angle: -90 + Math.round(progress),
          color: phases[phase].color
        })
      } catch (e) {}

      // Phase transition
      if (count >= PHASE_LIMIT && phase < 2) {
        phase++
        count = 0
        try {
          phaseLabel.setProperty(prop.TEXT, t(phases[phase].key, lang))
          phaseLabel.setProperty(prop.COLOR, phases[phase].color)
          progressArc.setProperty(prop.MORE, {
            start_angle: -90, end_angle: -90, color: phases[phase].color
          })
        } catch (e) {}
      } else if (count >= PHASE_LIMIT && phase >= 2) {
        if (vibrate) { try { vibrate.start(); vibrate.start() } catch (e) {} }
      }

      try {
        countWidget.setProperty(prop.TEXT, String(Math.min(count, PHASE_LIMIT)))
        totalWidget.setProperty(prop.TEXT, `${Math.min(totalCount, 99)} / 99`)
      } catch (e) {}
    })

    // ── Bottom Buttons ────────────────────────────────────────────
    const btnY = H - sp(50)
    const btnW = sp(110)
    const gap = sp(16)
    const startX = (W - btnW * 2 - gap) / 2

    // Reset
    const resetBtn = createWidget(widget.FILL_RECT, {
      x: startX, y: btnY,
      w: btnW, h: sp(40),
      radius: sp(20), color: COLORS.ALERT
    })
    createWidget(widget.TEXT, {
      x: startX, y: btnY + sp(8),
      w: btnW, h: sp(24),
      text: t('reset', lang),
      text_size: sp(18),
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    resetBtn.addEventListener(event.CLICK_UP, () => {
      count = 0; phase = 0
      try {
        countWidget.setProperty(prop.TEXT, '0')
        totalWidget.setProperty(prop.TEXT, '0 / 99')
        phaseLabel.setProperty(prop.TEXT, t(phases[0].key, lang))
        phaseLabel.setProperty(prop.COLOR, phases[0].color)
        progressArc.setProperty(prop.MORE, {
          start_angle: -90, end_angle: -90, color: phases[0].color
        })
      } catch (e) {}
    })

    // Back
    const backBtn = createWidget(widget.FILL_RECT, {
      x: startX + btnW + gap, y: btnY,
      w: btnW, h: sp(40),
      radius: sp(20), color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: startX + btnW + gap, y: btnY + sp(8),
      w: btnW, h: sp(24),
      text: `\u2190 ${t('back', lang)}`,
      text_size: sp(18),
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    backBtn.addEventListener(event.CLICK_UP, () => { back() })
  },

  onDestroy() {
    if (vibrate) { try { vibrate.stop() } catch (e) {} }
  }
})
