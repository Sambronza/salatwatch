/**
 * Settings Page – SalatWatch
 *
 * Allows the user to configure:
 *  - Language (9 languages, 3-column dynamic grid)
 *  - Calculation method for prayer times
 *  - Asr juristic rule (Shafii / Hanafi)
 *  - Notification toggles (Adhan, Dua, Fasting)
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
// getApp is a global function, no import needed
import { back } from '@zos/router'

import { t, SUPPORTED_LANGUAGES } from '../utils/i18n'
import { getCalculationMethods } from '../utils/prayerTimes'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  return app.globalData || app._options.globalData
}

const CALC_METHODS = getCalculationMethods()

Page({
  onInit() {
    console.log('Settings page initialized')
  },

  build() {
    const gd = getGlobalData()
    const lang = gd.language || 'en'

    // ─── Background ──────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT * 3,
      color: COLORS.BG_PRIMARY
    })

    // ─── Title ───────────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(24), w: SCREEN.WIDTH, h: sp(36),
      text: `⚙ ${t('settings', lang)}`,
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })

    let yPos = sp(76)

    // ═══════════════════════════════════════════════════════════════════
    // LANGUAGE TOGGLE
    // ═══════════════════════════════════════════════════════════════════
    createWidget(widget.TEXT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(28),
      text: t('language', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT
    })
    yPos += sp(34)

    // ── 3-column grid: 3 languages per row ───────────────────────────
    const COLS = 3
    const gridMargin = sp(30)
    const gridGap = sp(8)
    const btnW = Math.floor((SCREEN.WIDTH - gridMargin * 2 - gridGap * (COLS - 1)) / COLS)
    const btnH = sp(38)

    SUPPORTED_LANGUAGES.forEach((langItem, idx) => {
      const col = idx % COLS
      const row = Math.floor(idx / COLS)
      const bx = gridMargin + col * (btnW + gridGap)
      const by = yPos + row * (btnH + gridGap)
      const isActive = lang === langItem.code

      const btn = createWidget(widget.FILL_RECT, {
        x: bx, y: by, w: btnW, h: btnH, radius: sp(10),
        color: isActive ? COLORS.EMERALD : COLORS.BG_ELEVATED
      })
      createWidget(widget.TEXT, {
        x: bx, y: by + sp(8), w: btnW, h: sp(22),
        text: langItem.nativeName,
        text_size: FONT.SMALL_SIZE,
        color: isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
        align_h: align.CENTER_H
      })

      const code = langItem.code
      btn.addEventListener(event.CLICK_UP, () => {
        gd.language = code
        back()
      })
    })

    const totalRows = Math.ceil(SUPPORTED_LANGUAGES.length / COLS)
    yPos += totalRows * (btnH + gridGap) + sp(8)

    // ─── Separator ───────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // ═══════════════════════════════════════════════════════════════════
    // CALCULATION METHOD
    // ═══════════════════════════════════════════════════════════════════
    createWidget(widget.TEXT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(28),
      text: t('calculationMethod', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT
    })
    yPos += sp(36)

    const methodIds = Object.keys(CALC_METHODS)
    for (const id of methodIds) {
      const method = CALC_METHODS[id]
      const isActive = gd.calculationMethod === parseInt(id)

      const methodBtn = createWidget(widget.FILL_RECT, {
        x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(38), radius: sp(10),
        color: isActive ? COLORS.EMERALD_DARK : COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(50), y: yPos + sp(6), w: SCREEN.WIDTH - sp(100), h: sp(26),
        text: `${isActive ? DECORATIONS.STAR + ' ' : '  '}${method.name}`,
        text_size: FONT.CAPTION_SIZE,
        color: isActive ? COLORS.GOLD_LIGHT : COLORS.TEXT_SECONDARY,
        align_h: align.LEFT
      })

      const methodId = parseInt(id)
      methodBtn.addEventListener(event.CLICK_UP, () => {
        gd.calculationMethod = methodId
        back() // Go back to refresh
      })

      yPos += sp(44)
    }

    yPos += sp(8)

    // ─── Separator ───────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATION TOGGLES
    // ═══════════════════════════════════════════════════════════════════
    createWidget(widget.TEXT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(28),
      text: t('notifications', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT
    })
    yPos += sp(36)

    const toggleItems = [
      { key: 'adhanSound', label: t('adhanSound', lang), setting: 'adhanSound' },
      { key: 'duaReminders', label: t('duaReminders', lang), setting: 'duaReminders' },
      { key: 'fastingAlerts', label: t('fastingAlerts', lang), setting: 'fastingAlerts' }
    ]

    for (const item of toggleItems) {
      const isOn = gd.alarmSettings[item.setting]

      createWidget(widget.TEXT, {
        x: sp(50), y: yPos + sp(4), w: SCREEN.WIDTH - sp(180), h: sp(26),
        text: item.label,
        text_size: FONT.CAPTION_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.LEFT
      })

      const toggleBtn = createWidget(widget.FILL_RECT, {
        x: SCREEN.WIDTH - sp(120), y: yPos, w: sp(80), h: sp(34), radius: sp(17),
        color: isOn ? COLORS.EMERALD : COLORS.INACTIVE
      })
      const toggleLabel = createWidget(widget.TEXT, {
        x: SCREEN.WIDTH - sp(120), y: yPos + sp(5), w: sp(80), h: sp(24),
        text: isOn ? '✓' : '✗',
        text_size: FONT.CAPTION_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H
      })

      const settingKey = item.setting
      toggleBtn.addEventListener(event.CLICK_UP, () => {
        gd.alarmSettings[settingKey] = !gd.alarmSettings[settingKey]
        const newState = gd.alarmSettings[settingKey]
        toggleBtn.setProperty(prop.COLOR, newState ? COLORS.EMERALD : COLORS.INACTIVE)
        toggleLabel.setProperty(prop.TEXT, newState ? '✓' : '✗')
      })

      yPos += sp(44)
    }

    yPos += sp(16)
    // ─── Separator ───────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // ═══════════════════════════════════════════════════════════════════
    // ADHAN STYLE SELECTION
    // ═══════════════════════════════════════════════════════════════════
    createWidget(widget.TEXT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(28),
      text: t('adhanStyle', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT
    })
    yPos += sp(36)

    const adhanStyles = [
      { id: 'makkah', label: t('adhanMakkah', lang) },
      { id: 'madinah', label: t('adhanMadinah', lang) },
      { id: 'alafasy', label: t('adhanAlafasy', lang) }
    ]

    for (const style of adhanStyles) {
      const isActive = gd.selectedAdhan === style.id

      const styleBtn = createWidget(widget.FILL_RECT, {
        x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(38), radius: sp(10),
        color: isActive ? COLORS.EMERALD_DARK : COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(50), y: yPos + sp(6), w: SCREEN.WIDTH - sp(100), h: sp(26),
        text: `${isActive ? DECORATIONS.CRESCENT + ' ' : '  '}${style.label}`,
        text_size: FONT.CAPTION_SIZE,
        color: isActive ? COLORS.GOLD_LIGHT : COLORS.TEXT_SECONDARY,
        align_h: align.LEFT
      })

      const sid = style.id
      styleBtn.addEventListener(event.CLICK_UP, () => {
        gd.selectedAdhan = sid
        back()
      })

      yPos += sp(44)
    }

    yPos += sp(8)

    // ─── Footer ──────────────────────────────────────────────────────
    yPos += sp(20)
    createWidget(widget.TEXT, {
      x: 0, y: yPos, w: SCREEN.WIDTH, h: sp(26),
      text: `${DECORATIONS.ORNAMENT_L} SalatWatch v1.0 ${DECORATIONS.ORNAMENT_R}`,
      text_size: FONT.SMALL_SIZE,
      color: COLORS.GOLD_DIM,
      align_h: align.CENTER_H
    })
  },

  onDestroy() {
    console.log('Settings page destroyed')
  }
})
