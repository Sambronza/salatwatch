/**
 * Settings Page - SalatWatch
 *
 * Allows the user to configure:
 *  - Language (11 languages, single-column scroll list)
 *  - Calculation method for prayer times
 *  - Asr juristic rule (Shafii / Hanafi)
 *  - Notification toggles (Adhan, Dua, Fasting)
 *  - Adhan style selection
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { back } from '@zos/router'
import { localStorage } from '@zos/storage'

import { t, SUPPORTED_LANGUAGES } from '../utils/i18n'
import { getCalculationMethods } from '../utils/prayerTimes'
import { sp, SCREEN, COLORS, FONT, PRAYER_COLORS, DECORATIONS, PRAYER_KEYS, IMG_ASSETS } from '../utils/constants'

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

    // Background (tall for scrolling)
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT * 6,
      color: COLORS.BG_PRIMARY
    })

    // Title
    createWidget(widget.TEXT, {
      x: 0, y: sp(24), w: SCREEN.WIDTH, h: sp(36),
      text: t('settings', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H
    })

    let yPos = sp(76)

    // =========================================================
    // LANGUAGE (single-column list, smartwatch-friendly)
    // =========================================================
    createWidget(widget.TEXT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(28),
      text: t('language', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT
    })
    yPos += sp(34)

    const langBtnH = sp(48)
    const langBtnGap = sp(8)
    const langBtnMargin = sp(30)
    const langBtnW = SCREEN.WIDTH - langBtnMargin * 2

    SUPPORTED_LANGUAGES.forEach((langItem, idx) => {
      const by = yPos + idx * (langBtnH + langBtnGap)
      const isActive = lang === langItem.code

      const btn = createWidget(widget.FILL_RECT, {
        x: langBtnMargin, y: by, w: langBtnW, h: langBtnH, radius: sp(14),
        color: isActive ? COLORS.EMERALD : COLORS.BG_ELEVATED
      })
      createWidget(widget.TEXT, {
        x: langBtnMargin, y: by + sp(12), w: langBtnW, h: sp(24),
        text: langItem.nativeName,
        text_size: FONT.BODY_SIZE,
        color: isActive ? COLORS.TEXT_PRIMARY : COLORS.TEXT_SECONDARY,
        align_h: align.CENTER_H
      })

      const code = langItem.code
      btn.addEventListener(event.CLICK_UP, () => {
        gd.language = code
        try { localStorage.setItem('salatwatch_lang', code) } catch(e) {}
        back()
      })
    })

    yPos += SUPPORTED_LANGUAGES.length * (langBtnH + langBtnGap) + sp(8)

    // Separator
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // =========================================================
    // CALCULATION METHOD
    // =========================================================
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
        x: sp(30), y: yPos, w: SCREEN.WIDTH - sp(60), h: sp(44), radius: sp(12),
        color: isActive ? COLORS.EMERALD_DARK : COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: yPos + sp(10), w: SCREEN.WIDTH - sp(80), h: sp(24),
        text: method.name,
        text_size: FONT.BODY_SIZE,
        color: isActive ? COLORS.GOLD_LIGHT : COLORS.TEXT_SECONDARY,
        align_h: align.LEFT
      })

      const methodId = parseInt(id)
      methodBtn.addEventListener(event.CLICK_UP, () => {
        gd.calculationMethod = methodId
        back()
      })

      yPos += sp(52)
    }

    yPos += sp(8)

    // Separator
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // =========================================================
    // NOTIFICATION TOGGLES
    // =========================================================
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
        x: sp(40), y: yPos + sp(8), w: SCREEN.WIDTH - sp(160), h: sp(28),
        text: item.label,
        text_size: FONT.BODY_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.LEFT
      })

      const toggleBtn = createWidget(widget.FILL_RECT, {
        x: SCREEN.WIDTH - sp(110), y: yPos + sp(4), w: sp(72), h: sp(36), radius: sp(18),
        color: isOn ? COLORS.EMERALD : COLORS.INACTIVE
      })
      const toggleLabel = createWidget(widget.TEXT, {
        x: SCREEN.WIDTH - sp(110), y: yPos + sp(10), w: sp(72), h: sp(24),
        text: isOn ? '\u2713' : '\u2717',
        text_size: FONT.CAPTION_SIZE,
        color: COLORS.TEXT_PRIMARY,
        align_h: align.CENTER_H
      })

      const settingKey = item.setting
      toggleBtn.addEventListener(event.CLICK_UP, () => {
        gd.alarmSettings[settingKey] = !gd.alarmSettings[settingKey]
        const newState = gd.alarmSettings[settingKey]
        toggleBtn.setProperty(prop.COLOR, newState ? COLORS.EMERALD : COLORS.INACTIVE)
        toggleLabel.setProperty(prop.TEXT, newState ? '\u2713' : '\u2717')
      })

      yPos += sp(48)
    }

    yPos += sp(16)
    // Separator
    createWidget(widget.FILL_RECT, {
      x: sp(40), y: yPos, w: SCREEN.WIDTH - sp(80), h: sp(1), color: COLORS.GOLD_DIM
    })
    yPos += sp(16)

    // =========================================================
    // ADHAN STYLE SELECTION
    // =========================================================
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
        x: sp(30), y: yPos, w: SCREEN.WIDTH - sp(60), h: sp(44), radius: sp(12),
        color: isActive ? COLORS.EMERALD_DARK : COLORS.BG_CARD
      })
      createWidget(widget.TEXT, {
        x: sp(40), y: yPos + sp(10), w: SCREEN.WIDTH - sp(80), h: sp(24),
        text: style.label,
        text_size: FONT.BODY_SIZE,
        color: isActive ? COLORS.GOLD_LIGHT : COLORS.TEXT_SECONDARY,
        align_h: align.LEFT
      })

      const sid = style.id
      styleBtn.addEventListener(event.CLICK_UP, () => {
        gd.selectedAdhan = sid
        back()
      })

      yPos += sp(52)
    }

    // Footer
    yPos += sp(20)
    createWidget(widget.TEXT, {
      x: 0, y: yPos, w: SCREEN.WIDTH, h: sp(26),
      text: 'SalatWatch v1.0',
      text_size: FONT.SMALL_SIZE,
      color: COLORS.GOLD_DIM,
      align_h: align.CENTER_H
    })
  },

  onDestroy() {
    console.log('Settings page destroyed')
  }
})
