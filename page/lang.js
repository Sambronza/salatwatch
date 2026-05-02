/**
 * SalatWatch — Language Selection Page
 *
 * Shown on first launch only. Uses a single-column vertical scroll list
 * with large buttons — optimized for smartwatch interaction (crown scroll + tap).
 */

import { createWidget, widget, align, text_style, event } from '@zos/ui'
import { replace } from '@zos/router'
import { localStorage } from '@zos/storage'
import { SUPPORTED_LANGUAGES } from '../utils/i18n'
import { sp, SCREEN, COLORS, FONT, IMG_ASSETS } from '../utils/constants'

const LANG_STORAGE_KEY = 'salatwatch_lang'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

Page({
  onInit() {
    console.log('SalatWatch: lang page onInit')
  },

  build() {
    // ── Auto-skip if language already chosen ────────────────────────
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY)
      if (saved) {
        const gd = getGlobalData()
        if (gd) gd.language = saved
        replace({ url: 'page/purchase' })
        return
      }
    } catch (e) {
      console.log('lang: localStorage check error', e)
    }

    // ─── Calculate total page height for scrolling ─────────────────
    const btnH = sp(64)
    const btnGap = sp(12)
    const headerHeight = sp(160)
    const totalHeight = headerHeight + (SUPPORTED_LANGUAGES.length * (btnH + btnGap)) + sp(40)

    // ─── Background (tall enough for scroll) ───────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: totalHeight,
      color: COLORS.BG_PRIMARY
    })

    // ─── Crescent icon ─────────────────────────────────────────────
    const iconSize = sp(32)
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - iconSize) / 2,
      y: sp(24),
      w: iconSize,
      h: iconSize,
      src: IMG_ASSETS.CRESCENT
    })

    // ─── Title ─────────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(62), w: SCREEN.WIDTH, h: sp(30),
      text: 'SalatWatch',
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Subtitle (bilingual) ──────────────────────────────────────
    createWidget(widget.TEXT, {
      x: sp(20), y: sp(96), w: SCREEN.WIDTH - sp(40), h: sp(24),
      text: 'Choose Your Language',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    createWidget(widget.TEXT, {
      x: sp(20), y: sp(120), w: SCREEN.WIDTH - sp(40), h: sp(24),
      text: '\u0627\u062e\u062a\u0631 \u0644\u063a\u062a\u0643',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Language List (single column, full width, scroll-friendly) ─
    const listStartY = headerHeight
    const btnMargin = sp(24)
    const btnWidth = SCREEN.WIDTH - btnMargin * 2

    SUPPORTED_LANGUAGES.forEach((langItem, idx) => {
      const by = listStartY + idx * (btnH + btnGap)

      // Button background
      const btn = createWidget(widget.FILL_RECT, {
        x: btnMargin, y: by, w: btnWidth, h: btnH,
        radius: sp(16),
        color: COLORS.BG_ELEVATED
      })

      // Language name (native)
      createWidget(widget.TEXT, {
        x: btnMargin, y: by + sp(18), w: btnWidth, h: sp(28),
        text: langItem.nativeName,
        text_size: FONT.HEADER_SIZE,
        color: COLORS.GOLD_LIGHT,
        align_h: align.CENTER_H,
        text_style: text_style.NONE
      })

      // Click handler
      const code = langItem.code
      btn.addEventListener(event.CLICK_UP, () => {
        try {
          localStorage.setItem(LANG_STORAGE_KEY, code)
          const gd = getGlobalData()
          if (gd) gd.language = code
        } catch (e) {
          console.log('lang: save error', e)
        }
        replace({ url: 'page/purchase' })
      })
    })

    // ─── Bottom spacer for scroll padding ──────────────────────────
    const bottomY = listStartY + SUPPORTED_LANGUAGES.length * (btnH + btnGap)
    createWidget(widget.FILL_RECT, {
      x: sp(80), y: bottomY + sp(10), w: SCREEN.WIDTH - sp(160), h: sp(2),
      color: COLORS.GOLD_DIM
    })
  },

  onDestroy() {}
})
