/**
 * Prayer Time Calculation Engine
 *
 * Based on standard astronomical prayer time calculations.
 * Supports multiple calculation methods used worldwide.
 *
 * Calculation Methods:
 *   0 - Jafari (Ithna Ashari)
 *   1 - University of Islamic Sciences, Karachi
 *   2 - Islamic Society of North America (ISNA)
 *   3 - Muslim World League (MWL)
 *   4 - Umm Al-Qura University, Mecca
 *   5 - Egyptian General Authority of Survey
 *   7 - Institute of Geophysics, University of Tehran
 */

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

// Calculation method parameters: [fajrAngle, ishaAngle]
const METHODS = {
  0: { name: 'Jafari', fajr: 16, isha: 14 },
  1: { name: 'Karachi', fajr: 18, isha: 18 },
  2: { name: 'ISNA', fajr: 15, isha: 15 },
  3: { name: 'MWL', fajr: 18, isha: 17 },
  4: { name: 'Umm Al-Qura', fajr: 18.5, isha: 0, ishaMinutes: 90 },
  5: { name: 'Egypt', fajr: 19.5, isha: 17.5 },
  7: { name: 'Tehran', fajr: 17.7, isha: 14 }
}

// Juristic method for Asr: 0 = Shafii, 1 = Hanafi
const ASR_JURISTIC = {
  SHAFII: 0,
  HANAFI: 1
}

function sin(d) { return Math.sin(d * DEG_TO_RAD) }
function cos(d) { return Math.cos(d * DEG_TO_RAD) }
function tan(d) { return Math.tan(d * DEG_TO_RAD) }
function arcsin(x) { return RAD_TO_DEG * Math.asin(x) }
function arccos(x) { return RAD_TO_DEG * Math.acos(x) }
function arctan2(y, x) { return RAD_TO_DEG * Math.atan2(y, x) }
function fixAngle(a) { return fix(a, 360) }
function fixHour(a) { return fix(a, 24) }
function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a }

function julianDate(year, month, day) {
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.floor(year / 100)
  const B = 2 - A + Math.floor(A / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5
}

function sunPosition(jd) {
  const D = jd - 2451545.0
  const g = fixAngle(357.529 + 0.98560028 * D)
  const q = fixAngle(280.459 + 0.98564736 * D)
  const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g))
  const e = 23.439 - 0.00000036 * D
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15
  const eqt = q / 15 - fixHour(RA)
  const decl = arcsin(sin(e) * sin(L))
  return { declination: decl, equation: eqt }
}

function sunAngleTime(angle, latitude, declination, direction) {
  const cosHA = (-sin(angle) - sin(declination) * sin(latitude)) / (cos(declination) * cos(latitude))
  const ha = (1 / 15) * arccos(cosHA)
  return direction === 'CCW' ? -ha : ha
}

function midDay(time, equation) {
  return fixHour(12 - equation)
}

function asrTime(factor, latitude, declination) {
  const d = arccos((sin(arctan2(1, factor + tan(Math.abs(latitude - declination)))) - sin(declination) * sin(latitude)) / (cos(declination) * cos(latitude)))
  return d / 15
}

/**
 * Calculate all prayer times for a given date, location, and method.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} timezone - Timezone offset from UTC in hours
 * @param {Date} date - The date to calculate for
 * @param {number} methodId - Calculation method ID (0-7)
 * @param {number} asrJuristic - 0 for Shafii, 1 for Hanafi
 * @returns {object} Prayer times as { fajr, sunrise, dhuhr, asr, maghrib, isha } in "HH:MM" format
 */
export function calculatePrayerTimes(lat, lng, timezone, date, methodId = 3, asrJuristic = 0) {
  const method = METHODS[methodId] || METHODS[3]
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const jd = julianDate(year, month, day) - lng / (15 * 24)
  const sunPos = sunPosition(jd)
  const decl = sunPos.declination
  const eqt = sunPos.equation

  // Compute mid-day
  const dhuhrTime = midDay(0, eqt) + timezone - lng / 15

  // Compute Fajr
  const fajrAngle = method.fajr
  const fajrDiff = sunAngleTime(fajrAngle, lat, decl, 'CCW')
  const fajrTime = dhuhrTime + fajrDiff

  // Compute Sunrise
  const sunriseDiff = sunAngleTime(0.833, lat, decl, 'CCW')
  const sunriseTime = dhuhrTime + sunriseDiff

  // Compute Asr
  const asrFactor = asrJuristic === 1 ? 2 : 1
  const asrDiff = asrTime(asrFactor, lat, decl)
  const asrTimeVal = dhuhrTime + asrDiff

  // Compute Maghrib (sunset)
  const sunsetDiff = sunAngleTime(0.833, lat, decl, 'CW')
  const maghribTime = dhuhrTime + sunsetDiff

  // Compute Isha
  let ishaTime
  if (method.ishaMinutes) {
    ishaTime = maghribTime + method.ishaMinutes / 60
  } else {
    const ishaDiff = sunAngleTime(method.isha, lat, decl, 'CW')
    ishaTime = dhuhrTime + ishaDiff
  }

  return {
    fajr: formatTime(fixHour(fajrTime)),
    sunrise: formatTime(fixHour(sunriseTime)),
    dhuhr: formatTime(fixHour(dhuhrTime)),
    asr: formatTime(fixHour(asrTimeVal)),
    maghrib: formatTime(fixHour(maghribTime)),
    isha: formatTime(fixHour(ishaTime))
  }
}

/**
 * Convert a decimal hour to "HH:MM" format.
 */
function formatTime(hours) {
  hours = fixHour(hours + 0.5 / 60) // add 0.5 minutes for rounding
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get minutes from a "HH:MM" string.
 */
export function timeToMinutes(timeStr) {
  const parts = timeStr.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

/**
 * Calculate Tahajjud / Last third of the night.
 * @param {string} maghrib - Maghrib time in "HH:MM"
 * @param {string} fajr - Fajr time in "HH:MM"
 * @returns {string} Start of last third of night in "HH:MM"
 */
export function calculateLastThirdOfNight(maghrib, fajr) {
  let maghribMin = timeToMinutes(maghrib)
  let fajrMin = timeToMinutes(fajr)
  if (fajrMin < maghribMin) fajrMin += 24 * 60 // crosses midnight
  const nightDuration = fajrMin - maghribMin
  const lastThirdStart = maghribMin + Math.floor(nightDuration * 2 / 3)
  const h = Math.floor((lastThirdStart % (24 * 60)) / 60)
  const m = lastThirdStart % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Get all available calculation methods.
 */
export function getCalculationMethods() {
  return METHODS
}

export { ASR_JURISTIC }
