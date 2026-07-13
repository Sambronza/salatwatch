// SalatWatch v2.0 — On-Watch Settings
// Large toggles, clean sections, touch-friendly

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { back, push } from '@zos/router'
import { localStorage } from '@zos/storage'
import { t } from '../utils/i18n'
import { getCalculationMethods } from '../utils/prayerTimes'
import { sp, SCREEN, COLORS, FONT } from '../utils/constants'

function getGlobalData() {
  const app = getApp()
  if (!app) return {}
  return app.globalData || (app._options && app._options.globalData) || {}
}

Page({
  onInit() {
    console.log('SalatWatch v2.0: settings onInit')
  },

  build() {
    const gd = getGlobalData()
    const lang = gd.language || 'en'

    // Title
    createWidget(widget.TEXT, {
      x: 0, y: sp(24), w: SCREEN.WIDTH, h: sp(30),
      text: t('settings', lang),
      text_size: FONT.HEADER_SIZE,
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    createWidget(widget.FILL_RECT, {
      x: sp(80), y: sp(58),
      w: SCREEN.WIDTH - sp(160), h: sp(1),
      color: COLORS.GOLD_DIM
    })

    let y = sp(70)

    // ─── Calculation Method ───────────────────────────────────────
    const methods = getCalculationMethods()
    const methodNames = {
      0: 'Jafari',
      1: 'Karachi',
      2: 'ISNA',
      3: 'MWL',
      4: 'Umm Al-Qura',
      5: 'Egypt',
      7: 'Tehran'
    }

    createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(60), h: sp(24),
      text: t('calculationMethod', lang),
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })
    y += sp(28)

    let currentMethod = gd.calculationMethod || 3
    const methodLabel = createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(130), h: sp(28),
      text: methodNames[currentMethod] || 'MWL',
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    // Cycle method on tap
    const methodIds = [0, 1, 2, 3, 4, 5, 7]
    const methodBtn = createWidget(widget.FILL_RECT, {
      x: SCREEN.WIDTH - sp(100), y: y - sp(4),
      w: sp(70), h: sp(36), radius: sp(18),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: SCREEN.WIDTH - sp(100), y: y + sp(2),
      w: sp(70), h: sp(24),
      text: '▶',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    methodBtn.addEventListener(event.CLICK_UP, () => {
      const idx = methodIds.indexOf(currentMethod)
      currentMethod = methodIds[(idx + 1) % methodIds.length]
      gd.calculationMethod = currentMethod
      localStorage.setItem('salatwatch_calculationMethod', String(currentMethod))
      try {
        methodLabel.setProperty(prop.TEXT, methodNames[currentMethod] || 'MWL')
      } catch (e) {}
    })
    y += sp(48)

    // ─── Asr Method ───────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(60), h: sp(24),
      text: t('asrMethod', lang),
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })
    y += sp(28)

    let asrJuristic = gd.asrJuristic || 0
    const asrLabel = createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(130), h: sp(28),
      text: asrJuristic === 0 ? t('shafii', lang) : t('hanafi', lang),
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    const asrBtn = createWidget(widget.FILL_RECT, {
      x: SCREEN.WIDTH - sp(100), y: y - sp(4),
      w: sp(70), h: sp(36), radius: sp(18),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: SCREEN.WIDTH - sp(100), y: y + sp(2),
      w: sp(70), h: sp(24),
      text: '⇄',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    asrBtn.addEventListener(event.CLICK_UP, () => {
      asrJuristic = asrJuristic === 0 ? 1 : 0
      gd.asrJuristic = asrJuristic
      localStorage.setItem('salatwatch_asrJuristic', String(asrJuristic))
      try {
        asrLabel.setProperty(prop.TEXT, asrJuristic === 0 ? t('shafii', lang) : t('hanafi', lang))
      } catch (e) {}
    })
    y += sp(48)

    // ─── Iqama Delay (minutes between Adhan and Iqama) ────────────
    createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(60), h: sp(24),
      text: t('iqamaOffset', lang),
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })
    y += sp(28)

    const iqamaChoices = [10, 15, 20, 25, 30]
    let iqamaOffset = gd.iqamaOffset || 15
    const iqamaLabel = createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(130), h: sp(28),
      text: `${iqamaOffset} ${t('minutes', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    const iqamaBtn = createWidget(widget.FILL_RECT, {
      x: SCREEN.WIDTH - sp(100), y: y - sp(4),
      w: sp(70), h: sp(36), radius: sp(18),
      color: COLORS.EMERALD_DARK
    })
    createWidget(widget.TEXT, {
      x: SCREEN.WIDTH - sp(100), y: y + sp(2),
      w: sp(70), h: sp(24),
      text: '▶',
      text_size: FONT.CAPTION_SIZE,
      color: COLORS.GOLD_LIGHT,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    iqamaBtn.addEventListener(event.CLICK_UP, () => {
      const idx = iqamaChoices.indexOf(iqamaOffset)
      iqamaOffset = iqamaChoices[(idx + 1) % iqamaChoices.length]
      gd.iqamaOffset = iqamaOffset
      localStorage.setItem('salatwatch_iqamaOffset', String(iqamaOffset))
      try {
        iqamaLabel.setProperty(prop.TEXT, `${iqamaOffset} ${t('minutes', lang)}`)
      } catch (e) {}
    })
    y += sp(48)

    // ─── Separator ────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(50), y: y, w: SCREEN.WIDTH - sp(100), h: sp(1),
      color: COLORS.GOLD_DIM
    })
    y += sp(16)

    // ─── Toggle: Adhan Sound ──────────────────────────────────────
    y = this._createToggle(y, t('adhanSound', lang), gd.alarmSettings?.adhanSound !== false, (val) => {
      if (gd.alarmSettings) gd.alarmSettings.adhanSound = val
      localStorage.setItem('salatwatch_adhanSound', String(val))
    })

    // ─── Toggle: Dua Reminders ────────────────────────────────────
    y = this._createToggle(y, t('duaReminders', lang), gd.alarmSettings?.duaReminders !== false, (val) => {
      if (gd.alarmSettings) gd.alarmSettings.duaReminders = val
      localStorage.setItem('salatwatch_duaReminders', String(val))
    })

    // ─── Separator ────────────────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: sp(50), y: y, w: SCREEN.WIDTH - sp(100), h: sp(1),
      color: COLORS.GOLD_DIM
    })
    y += sp(16)

    // ─── Change Language ──────────────────────────────────────────
    const langBtn = createWidget(widget.FILL_RECT, {
      x: sp(30), y: y,
      w: SCREEN.WIDTH - sp(60), h: sp(56),
      radius: sp(12),
      color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: sp(30), y: y + sp(14),
      w: SCREEN.WIDTH - sp(60), h: sp(28),
      text: `${t('language', lang)} ▸`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    langBtn.addEventListener(event.CLICK_UP, () => {
      push({ url: 'page/lang' })
    })
    y += sp(70)

    // ─── Back Button ──────────────────────────────────────────────
    const backBtn = createWidget(widget.FILL_RECT, {
      x: sp(100), y: y,
      w: SCREEN.WIDTH - sp(200), h: sp(48),
      radius: sp(24),
      color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: sp(100), y: y + sp(10),
      w: SCREEN.WIDTH - sp(200), h: sp(28),
      text: `← ${t('back', lang)}`,
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })
    backBtn.addEventListener(event.CLICK_UP, () => {
      back()
    })
  },

  /**
   * Create a toggle row and return the new y offset.
   */
  _createToggle(y, label, initialValue, onChange) {
    let isOn = initialValue

    createWidget(widget.TEXT, {
      x: sp(30), y: y, w: SCREEN.WIDTH - sp(130), h: sp(40),
      text: label,
      text_size: FONT.BODY_SIZE,
      color: COLORS.TEXT_PRIMARY,
      align_h: align.LEFT,
      text_style: text_style.NONE
    })

    const toggleBg = createWidget(widget.FILL_RECT, {
      x: SCREEN.WIDTH - sp(100), y: y + sp(4),
      w: sp(64), h: sp(32), radius: sp(16),
      color: isOn ? COLORS.EMERALD : COLORS.INACTIVE
    })

    const toggleKnob = createWidget(widget.FILL_RECT, {
      x: isOn ? SCREEN.WIDTH - sp(56) : SCREEN.WIDTH - sp(96),
      y: y + sp(8),
      w: sp(24), h: sp(24), radius: sp(12),
      color: COLORS.TEXT_PRIMARY
    })

    toggleBg.addEventListener(event.CLICK_UP, () => {
      isOn = !isOn
      onChange(isOn)
      try {
        toggleBg.setProperty(prop.COLOR, isOn ? COLORS.EMERALD : COLORS.INACTIVE)
        toggleKnob.setProperty(prop.X, isOn ? SCREEN.WIDTH - sp(56) : SCREEN.WIDTH - sp(96))
      } catch (e) {}
    })

    return y + sp(52)
  }
})
