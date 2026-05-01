/**
 * Fasting Tracker Page – Phase 2
 *
 * Tracks missed fasts and upcoming voluntary fasts.
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { back } from '@zos/router'
// getApp is a global function, no import needed

import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS, IMG_ASSETS } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

// Mock data (would be persisted in a real scenario)
let missedFasts = 0

Page({
  onInit() {
    console.log('Fasting page initialized')
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
      text: t('fastingTracker', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - sp(48)) / 2, y: sp(10),
      src: IMG_ASSETS.CRESCENT
    })

    // ─── Card: Missed Fasts ──────────────────────────────────────────
    const cardY = sp(80)
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: cardY, w: SCREEN.WIDTH - sp(80), h: sp(120), radius: sp(20),
      color: COLORS.BG_CARD
    })

    createWidget(widget.TEXT, {
      x: sp(40), y: cardY + sp(15), w: SCREEN.WIDTH - sp(80), h: sp(30),
      text: t('missedFasts', lang),
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    const countLabel = createWidget(widget.TEXT, {
      x: sp(40), y: cardY + sp(45), w: SCREEN.WIDTH - sp(80), h: sp(50),
      text: String(missedFasts),
      text_size: FONT.TITLE_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H
    })

    // Controls for Missed Fasts
    const ctrlY = cardY + sp(130)
    createWidget(widget.BUTTON, {
      x: SCREEN.CENTER_X - sp(100), y: ctrlY, w: sp(80), h: sp(44), radius: sp(22),
      text: '−',
      normal_color: COLORS.BG_ELEVATED,
      press_color: COLORS.BG_CARD,
      text_size: FONT.HEADER_SIZE,
      color: COLORS.TEXT_PRIMARY,
      click_func: () => {
        if (missedFasts > 0) missedFasts--
        countLabel.setProperty(prop.TEXT, String(missedFasts))
      }
    })

    createWidget(widget.BUTTON, {
      x: SCREEN.CENTER_X + sp(20), y: ctrlY, w: sp(80), h: sp(44), radius: sp(22),
      text: '+',
      normal_color: COLORS.BG_ELEVATED,
      press_color: COLORS.BG_CARD,
      text_size: FONT.HEADER_SIZE,
      color: COLORS.TEXT_PRIMARY,
      click_func: () => {
        missedFasts++
        countLabel.setProperty(prop.TEXT, String(missedFasts))
      }
    })

    // ─── Upcoming Fasts Hint ─────────────────────────────────────────
    const hintY = ctrlY + sp(70)
    createWidget(widget.TEXT, {
      x: sp(40), y: hintY, w: SCREEN.WIDTH - sp(80), h: sp(80),
      text: `${t('upcomingFasts', lang)}:\n${lang === 'ar' ? 'الاثنين والخميس' : 'Monday & Thursday'}`,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.EMERALD_LIGHT,
      align_h: align.CENTER_H,
      text_style: text_style.WRAP
    })

    // ─── Back ───
    createWidget(widget.BUTTON, {
      x: 0, y: SCREEN.HEIGHT - sp(60), w: SCREEN.WIDTH, h: sp(60),
      text: '← ' + t('today', lang),
      color: COLORS.TEXT_SECONDARY,
      press_color: 0x111111,
      normal_color: 0x00000000,
      click_func: () => back()
    })
  }
})
