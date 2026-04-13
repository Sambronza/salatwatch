/**
 * Islamic Design Constants & Theme - Multi-Device Support
 *
 * Color palette inspired by traditional Islamic art and architecture.
 */

import { getDeviceInfo } from '@zos/device'

// Get dynamic device info
const { width, height } = getDeviceInfo()
const isRound = true // Most Zepp devices are round, but we can detect it if needed

// Scale factor relative to original 480x480 design
const SCALE = width / 480

/**
 * Scaling utility for pixel values (sp = scaled pixels)
 */
export function sp(val) {
  return Math.round(val * SCALE)
}

// ─── Colors ───────────────────────────────────────────────────────────
export const COLORS = {
  // Primary palette
  EMERALD:        0x0d9f6e,
  EMERALD_DARK:   0x07734f,
  EMERALD_LIGHT:  0x2cc98a,
  GOLD:           0xd4a84b,
  GOLD_LIGHT:     0xf0d078,
  GOLD_DIM:       0x8a6f30,

  // Backgrounds
  BG_PRIMARY:     0x0a0f14,
  BG_CARD:        0x141e28,
  BG_ELEVATED:    0x1c2b38,

  // Text
  TEXT_PRIMARY:   0xf0f0f0,
  TEXT_SECONDARY: 0x8a9bae,
  TEXT_ACCENT:    0xd4a84b,

  // Prayer-specific colors
  FAJR_COLOR:     0x5b7fa6,
  DHUHR_COLOR:    0xf0d078,
  ASR_COLOR:      0xe8a045,
  MAGHRIB_COLOR:  0xd46040,
  ISHA_COLOR:     0x6858a8,

  // Status
  ACTIVE:         0x2cc98a,
  INACTIVE:       0x3a4a58,
  ALERT:          0xe85050,

  // Compass
  COMPASS_RING:   0x0d9f6e,
  COMPASS_NEEDLE: 0xd4a84b,

  // Tasbih
  TASBIH_CIRCLE:  0x0d9f6e,
  TASBIH_COUNT:   0xf0d078
}

// ─── Typography (Scaled) ───────────────────────────────────────────────
export const FONT = {
  TITLE_SIZE:     sp(32),
  HEADER_SIZE:    sp(26),
  BODY_SIZE:      sp(22),
  CAPTION_SIZE:   sp(18),
  SMALL_SIZE:     sp(14),
  COUNTER_SIZE:   sp(64),
  TIME_SIZE:      sp(48)
}

// ─── Layout (Dynamic) ─────────────────────────────────────────────────
export const SCREEN = {
  WIDTH:  width,
  HEIGHT: height,
  CENTER_X: Math.floor(width / 2),
  CENTER_Y: Math.floor(height / 2),
  RADIUS: Math.floor(width / 2)
}

// ─── Prayer Name Keys ─────────────────────────────────────────────────
export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_COLORS = {
  fajr:    COLORS.FAJR_COLOR,
  sunrise: COLORS.DHUHR_COLOR,
  dhuhr:   COLORS.DHUHR_COLOR,
  asr:     COLORS.ASR_COLOR,
  maghrib: COLORS.MAGHRIB_COLOR,
  isha:    COLORS.ISHA_COLOR
}

// ─── Islamic Art Decorative Assets (PNG) ─────────────────────────────
export const DECORATIONS = {
  BISMILLAH: 'star.png', // Replacement for complex unicode
  STAR:      'star.png',
  CRESCENT:  'crescent.png',
  ORNAMENT_L: '', // Remove text ornaments
  ORNAMENT_R: '',
  SEPARATOR: 'star.png'
}
