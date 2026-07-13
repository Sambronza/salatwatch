/**
 * Islamic Design Constants & Theme - Multi-Device Support
 *
 * Color palette inspired by traditional Islamic art and architecture.
 * v2.0: Added Iqama amber theme, countdown sizes, larger fonts.
 */

import { getDeviceInfo } from '@zos/device'

// Get dynamic device info
const { width, height } = getDeviceInfo()

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
  COMPASS_N:      0xe85050,
  COMPASS_TICK:   0x5a6a7a,

  // Tasbih
  TASBIH_CIRCLE:  0x0d9f6e,
  TASBIH_COUNT:   0xf0d078,

  // v2.0: Iqama amber theme
  IQAMA_AMBER:    0xe89040,
  IQAMA_BG:       0x2a1a08,
  IQAMA_GLOW:     0xf0a050,
  IQAMA_TEXT:     0xffd090,

  // Swipe indicator
  SWIPE_DOT:      0x3a4a58,
  SWIPE_DOT_ACTIVE: 0xd4a84b
}

// ─── Typography (Scaled, larger for v2.0) ──────────────────────────────
export const FONT = {
  TITLE_SIZE:     sp(34),
  HEADER_SIZE:    sp(28),
  BODY_SIZE:      sp(24),
  CAPTION_SIZE:   sp(20),
  SMALL_SIZE:     sp(16),
  COUNTER_SIZE:   sp(64),
  TIME_SIZE:      sp(48),
  COUNTDOWN_SIZE: sp(42),   // v2.0: for the live countdown
  TIMETABLE_SIZE: sp(22)    // v2.0: for prayer timetable rows
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
// Image asset paths — use ONLY with widget.IMG, never in text: properties
export const IMG_ASSETS = {
  STAR:      'icon.png',
  CRESCENT:  'icon.png'
}

// Text-safe decoration strings (empty to avoid rendering filenames as text)
export const DECORATIONS = {
  BISMILLAH: '',
  STAR:      '',
  CRESCENT:  '',
  ORNAMENT_L: '',
  ORNAMENT_R: '',
  SEPARATOR: ''
}
