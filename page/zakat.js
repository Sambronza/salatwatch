/**
 * Zakat Calculator Page – Phase 2
 *
 * Calculates 2.5% Zakat based on user-entered assets.
 */

import { createWidget, widget, align, event, prop } from '@zos/ui'
import { back } from '@zos/router'
// getApp is a global function, no import needed

import { t } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS, IMG_ASSETS } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

let assets = 0

Page({
  onInit() {
    console.log('Zakat page initialized')
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
      text: t('zakatCalculator', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - sp(48)) / 2, y: sp(10),
      src: IMG_ASSETS.STAR
    })

    // ─── Assets Label ────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(80), w: SCREEN.WIDTH, h: sp(30),
      text: t('totalSavings', lang),
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H
    })

    // ─── Count Display ───────────────────────────────────────────────
    const assetsLabel = createWidget(widget.TEXT, {
      x: 0, y: sp(110), w: SCREEN.WIDTH, h: sp(60),
      text: String(assets),
      text_size: FONT.TITLE_SIZE + sp(10),
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H
    })

    // ─── Zakat Result ────────────────────────────────────────────────
    const zakatLabel = createWidget(widget.TEXT, {
      x: 0, y: sp(180), w: SCREEN.WIDTH, h: sp(40),
      text: `${t('totalZakat', lang)}: ${Math.floor(assets * 0.025)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.ACTIVE,
      align_h: align.CENTER_H
    })

    // ─── Input Buttons ───────────────────────────────────────────────
    const btnW = sp(120)
    const btnH = sp(56)
    const startX = SCREEN.CENTER_X - sp(130)
    const topY = sp(240)

    // +100 Button
    const p100 = createWidget(widget.BUTTON, {
      x: startX, y: topY, w: btnW, h: btnH, radius: sp(15),
      text: '+100',
      normal_color: COLORS.EMERALD_DARK,
      press_color: COLORS.EMERALD,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_PRIMARY,
      click_func: () => {
        assets += 100
        this.update(assetsLabel, zakatLabel, lang)
      }
    })

    // +1000 Button
    const p1000 = createWidget(widget.BUTTON, {
      x: startX + sp(140), y: topY, w: btnW, h: btnH, radius: sp(15),
      text: '+1000',
      normal_color: COLORS.EMERALD_DARK,
      press_color: COLORS.EMERALD,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_PRIMARY,
      click_func: () => {
        assets += 1000
        this.update(assetsLabel, zakatLabel, lang)
      }
    })

    // Reset Button (lower)
    createWidget(widget.BUTTON, {
      x: SCREEN.CENTER_X - sp(60), y: topY + sp(70), w: sp(120), h: sp(50), radius: sp(25),
      text: t('reset', lang),
      normal_color: COLORS.BG_ELEVATED,
      press_color: COLORS.BG_CARD,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.TEXT_SECONDARY,
      click_func: () => {
        assets = 0
        this.update(assetsLabel, zakatLabel, lang)
      }
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
  },

  update(assetsLabel, zakatLabel, lang) {
    assetsLabel.setProperty(prop.TEXT, String(assets))
    zakatLabel.setProperty(prop.TEXT, `${t('totalZakat', lang)}: ${Math.floor(assets * 0.025)}`)
  }
})
