// SalatWatch v2.0 — Language Selector
// Only shown on first launch. Large, scrollable list of 11 languages.
// Goes directly to page/index after selection.

import { createWidget, widget, align, text_style, event } from '@zos/ui'
import { replace } from '@zos/router'
import { localStorage } from '@zos/storage'
import { SUPPORTED_LANGUAGES } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT } from '../utils/constants'

Page({
  onInit() {
    console.log('SalatWatch v2.0: lang onInit')
  },

  build() {
    // Title
    createWidget(widget.TEXT, {
      x: 0, y: sp(30), w: SCREEN.WIDTH, h: sp(30),
      text: 'Select Language',
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // Subtitle
    createWidget(widget.TEXT, {
      x: 0, y: sp(62), w: SCREEN.WIDTH, h: sp(22),
      text: 'اختر اللغة',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // Separator
    createWidget(widget.FILL_RECT, {
      x: sp(80), y: sp(90),
      w: SCREEN.WIDTH - sp(160), h: sp(1),
      color: COLORS.GOLD_DIM
    })

    // Language buttons
    let y = sp(100)
    for (const lang of SUPPORTED_LANGUAGES) {
      const btn = createWidget(widget.FILL_RECT, {
        x: sp(30), y: y,
        w: SCREEN.WIDTH - sp(60), h: sp(64),
        radius: sp(12),
        color: COLORS.BG_ELEVATED
      })

      // Native name (primary)
      createWidget(widget.TEXT, {
        x: sp(50), y: y + sp(8),
        w: SCREEN.WIDTH - sp(100), h: sp(28),
        text: lang.nativeName,
        text_size: FONT.BODY_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.LEFT,
        text_style: text_style.NONE
      })

      // Code (secondary)
      createWidget(widget.TEXT, {
        x: sp(50), y: y + sp(36),
        w: SCREEN.WIDTH - sp(100), h: sp(20),
        text: lang.code.toUpperCase(),
        text_size: FONT.SMALL_SIZE,
        color: COLORS.TEXT_SECONDARY,
        align_h: align.LEFT,
        text_style: text_style.NONE
      })

      // Click handler
      const code = lang.code
      btn.addEventListener(event.CLICK_UP, () => {
        // Save language
        localStorage.setItem('salatwatch_lang', code)
        localStorage.setItem('salatwatch_language', code)

        // Navigate directly to main app
        replace({ url: 'page/index' })
      })

      y += sp(74)
    }

    // Bottom padding
    createWidget(widget.FILL_RECT, {
      x: 0, y: y, w: 1, h: sp(40), color: 0x000000
    })
  }
})
