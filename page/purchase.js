/**
 * SalatWatch - Purchase Gate Page
 *
 * Shown on first launch if the app has not been unlocked.
 * Uses Kiezepay (kpay-amazfit) for a one-time unlock via phone companion.
 *
 * Trial: 3 days (72 hours) of free use before requiring purchase.
 * The trial timer is stored locally on the watch. Kiezepay handles
 * the actual payment flow through the phone's Zepp app.
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { replace } from '@zos/router'
import { localStorage } from '@zos/storage'
// vibrate is lazy-loaded to avoid crash on unsupported devices
import { sp, SCREEN, COLORS, FONT, DECORATIONS, IMG_ASSETS } from '../utils/constants'

const LANG_STORAGE_KEY = 'salatwatch_lang'
const PURCHASE_KEY = 'salatwatch_purchased'

const TRIAL_DURATION_MS = 72 * 60 * 60 * 1000 // 72 hours (3 days)
const FIRST_LAUNCH_KEY = 'salatwatch_first_launch'

// Kiezepay stores license status in localStorage with this key
const KPAY_STATUS_KEY = 'KPAY_STATUS'

function checkAlreadyPurchased() {
  try {
    // Check our own flag first
    if (localStorage.getItem(PURCHASE_KEY) === '1') {
      return true
    }

    // Check if Kiezepay has marked this as licensed
    const kpayStatus = localStorage.getItem(KPAY_STATUS_KEY)
    if (kpayStatus === 'licensed') {
      // Sync our flag so future checks are instant
      localStorage.setItem(PURCHASE_KEY, '1')
      return true
    }

    // Check if Kiezepay reports an active trial
    if (kpayStatus === 'trial') {
      return true
    }

    // Fall back to our own local trial timer
    let firstLaunch = localStorage.getItem(FIRST_LAUNCH_KEY)
    const now = Date.now()

    if (!firstLaunch) {
      // First time opening the app! Start the 3-day trial.
      localStorage.setItem(FIRST_LAUNCH_KEY, now.toString())
      return true // Bypass the buy screen
    }

    firstLaunch = parseInt(firstLaunch, 10)
    if (now - firstLaunch < TRIAL_DURATION_MS) {
      return true // Still within the 3-day trial
    }

    // Trial expired, force purchase
    return false

  } catch (e) {
    return false
  }
}

function launchApp() {
  try {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
    if (savedLang) {
      const app = getApp()
      const gd = app.globalData || app._options.globalData
      if (gd) gd.language = savedLang
    }
  } catch (e) {}
  replace({ url: 'page/index' })
}

/**
 * Trigger the Kiezepay purchase flow via the kpay-amazfit library.
 * This sends a message to the phone companion, which opens the
 * Kiezepay checkout page in the user's browser.
 */
function attemptPurchase(statusText) {
  try {
    const { kpay } = getApp()._options.globalData
    if (kpay) {
      statusText.setProperty(prop.TEXT, 'Opening payment on your phone...')
      kpay.startPurchase()
    } else {
      statusText.setProperty(prop.TEXT, 'Store unavailable. Try on device.')
    }
  } catch (e) {
    console.log('Purchase error:', e)
    statusText.setProperty(prop.TEXT, 'Store unavailable. Try on device.')
  }
}

Page({
  onInit() {
    console.log('SalatWatch: Purchase gate onInit')
  },

  build() {
    // If already purchased or in trial, skip straight to the main page
    if (checkAlreadyPurchased()) {
      launchApp()
      return
    }

    // ─── Deep Dark Background ──────────────────────────────────────
    createWidget(widget.FILL_RECT, {
      x: 0, y: 0, w: SCREEN.WIDTH, h: SCREEN.HEIGHT,
      color: COLORS.BG_PRIMARY
    })

    // ─── Outer Gold Ring ───────────────────────────────────────────
    createWidget(widget.ARC, {
      x: sp(20), y: sp(20),
      w: SCREEN.WIDTH - sp(40), h: SCREEN.HEIGHT - sp(40),
      start_angle: 0, end_angle: 360,
      color: COLORS.GOLD_DIM,
      line_width: sp(2)
    })

    // ─── Crescent Icon ────────────────────────────────────────────
    createWidget(widget.IMG, {
      x: (SCREEN.WIDTH - sp(64)) / 2,
      y: sp(48),
      src: IMG_ASSETS.CRESCENT
    })

    // ─── App Name ─────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: 0, y: sp(118), w: SCREEN.WIDTH, h: sp(36),
      text: 'SalatWatch',
      text_size: sp(28),
      color: COLORS.GOLD,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Tagline ──────────────────────────────────────────────────
    createWidget(widget.TEXT, {
      x: sp(30), y: sp(154), w: SCREEN.WIDTH - sp(60), h: sp(52),
      text: 'Your Islamic companion on your wrist. Unlock once, use forever.',
      text_size: sp(14),
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.WRAP
    })

    // ─── Feature Bullet Points ────────────────────────────────────
    const features = [
      '🕌  GPS Prayer Times & Countdown',
      '🧭  Real-time Qibla Compass',
      '📿  Digital Tasbih Counter',
      '💰  Zakat & Fasting Tracker',
      '🔔  Adhan Alarm Notifications'
    ]
    let fy = sp(215)
    for (const f of features) {
      createWidget(widget.TEXT, {
        x: sp(40), y: fy, w: SCREEN.WIDTH - sp(80), h: sp(26),
        text: f,
        text_size: sp(13),
        color: COLORS.TEXT_PRIMARY,
        align_h: align.LEFT,
        text_style: text_style.NONE
      })
      fy += sp(28)
    }

    // ─── Price / Unlock Button ────────────────────────────────────
    const btnY = fy + sp(12)
    const unlockBtn = createWidget(widget.FILL_RECT, {
      x: sp(40), y: btnY,
      w: SCREEN.WIDTH - sp(80), h: sp(58),
      radius: sp(29),
      color: COLORS.EMERALD
    })

    createWidget(widget.TEXT, {
      x: sp(40), y: btnY + sp(14),
      w: SCREEN.WIDTH - sp(80), h: sp(32),
      text: '🔓  Unlock SalatWatch',
      text_size: sp(17),
      color: COLORS.BG_PRIMARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Status / Feedback Text ───────────────────────────────────
    const statusText = createWidget(widget.TEXT, {
      x: sp(20), y: btnY + sp(68), w: SCREEN.WIDTH - sp(40), h: sp(32),
      text: 'One-time purchase · No subscription',
      text_size: sp(13),
      color: COLORS.GOLD_DIM,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Restore Purchase Link ────────────────────────────────────
    const restoreBtn = createWidget(widget.FILL_RECT, {
      x: sp(80), y: btnY + sp(108),
      w: SCREEN.WIDTH - sp(160), h: sp(36),
      radius: sp(18),
      color: COLORS.BG_ELEVATED
    })
    createWidget(widget.TEXT, {
      x: sp(80), y: btnY + sp(118),
      w: SCREEN.WIDTH - sp(160), h: sp(24),
      text: 'Restore Purchase',
      text_size: sp(13),
      color: COLORS.TEXT_SECONDARY,
      align_h: align.CENTER_H,
      text_style: text_style.NONE
    })

    // ─── Event Listeners ──────────────────────────────────────────
    unlockBtn.addEventListener(event.CLICK_UP, () => {
      try { const motor = require('@zos/interaction').createMotor(); if (motor) motor.start(); } catch (e) {}
      attemptPurchase(statusText)
    })

    restoreBtn.addEventListener(event.CLICK_UP, () => {
      statusText.setProperty(prop.TEXT, 'Checking previous purchase...')
      attemptPurchase(statusText)
    })
  },

  onDestroy() {}
})
