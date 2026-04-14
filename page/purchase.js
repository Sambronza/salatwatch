/**
 * SalatWatch - Purchase Gate Page
 *
 * Shown on first launch if the app has not been unlocked.
 * Uses Kiezepay (Zepp in-app purchase) for a one-time unlock.
 */

import { createWidget, widget, align, text_style, event, prop } from '@zos/ui'
import { replace } from '@zos/router'
import { setItem, getItem } from '@zos/storage'
import { vibrate } from '@zos/interaction'
import { sp, SCREEN, COLORS, FONT, DECORATIONS } from '../utils/constants'

const PURCHASE_KEY = 'salatwatch_purchased'
const PRODUCT_ID = 'salatwatch_full_unlock' // Must match the product ID in Kiezepay portal

function checkAlreadyPurchased() {
  try {
    return getItem(PURCHASE_KEY) === '1'
  } catch (e) {
    return false
  }
}

function markAsPurchased() {
  try {
    setItem(PURCHASE_KEY, '1')
  } catch (e) {}
}

function launchApp() {
  replace({ url: 'page/index' })
}

function attemptPurchase(statusText) {
  try {
    statusText.setProperty(prop.TEXT, 'Connecting to store...')
    const { Pay } = require('@zos/pay')
    const pay = new Pay()

    pay.purchase({
      productId: PRODUCT_ID,
      callback: (result) => {
        if (result && result.code === 0) {
          // Purchase successful
          markAsPurchased()
          try { vibrate({ type: 23 }) } catch (e) {}
          statusText.setProperty(prop.TEXT, 'Unlocked! Loading...')
          setTimeout(() => launchApp(), 800)
        } else if (result && result.code === 1) {
          // Already purchased (restore)
          markAsPurchased()
          launchApp()
        } else {
          // Cancelled or failed
          statusText.setProperty(prop.TEXT, 'Purchase cancelled. Tap to try again.')
        }
      }
    })
  } catch (e) {
    // Kiezepay not available (simulator / older firmware)
    console.log('Pay module not available:', e)
    statusText.setProperty(prop.TEXT, 'Store unavailable. Try on device.')
  }
}

Page({
  onInit() {
    console.log('SalatWatch: Purchase gate onInit')
  },

  build() {
    // If already purchased, skip straight to the main page
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
      src: DECORATIONS.CRESCENT
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
      try { vibrate({ type: 2 }) } catch (e) {}
      attemptPurchase(statusText)
    })

    restoreBtn.addEventListener(event.CLICK_UP, () => {
      statusText.setProperty(prop.TEXT, 'Checking previous purchase...')
      // Attempt a silent purchase — Kiezepay returns code 1 if already purchased
      attemptPurchase(statusText)
    })
  },

  onDestroy() {}
})
