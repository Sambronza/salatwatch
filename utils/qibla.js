/**
 * Qibla Direction Calculator
 *
 * Calculates the bearing from the user's position to the Kaaba in Mecca.
 */

const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

/**
 * Calculate bearing from user's coordinates to the Kaaba.
 * @param {number} lat - User latitude in degrees
 * @param {number} lng - User longitude in degrees
 * @returns {number} Bearing in degrees (0-360, clockwise from North)
 */
export function calculateQiblaDirection(lat, lng) {
  return calculateBearing(lat, lng, KAABA_LAT, KAABA_LNG)
}

/**
 * Generic great-circle bearing from point 1 to point 2.
 * @returns {number} Bearing in degrees (0-360, clockwise from North)
 */
export function calculateBearing(lat1d, lng1d, lat2d, lng2d) {
  const lat1 = lat1d * DEG_TO_RAD
  const lat2 = lat2d * DEG_TO_RAD
  const dLng = (lng2d - lng1d) * DEG_TO_RAD

  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  let bearing = Math.atan2(x, y) * RAD_TO_DEG
  bearing = (bearing + 360) % 360

  return bearing
}

/**
 * Generic haversine distance between two points, in km.
 */
export function distanceBetween(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * DEG_TO_RAD
  const dLng = (lng2 - lng1) * DEG_TO_RAD

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate distance from user to the Kaaba in km (Haversine formula).
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {number} Distance in kilometers
 */
export function distanceToKaaba(lat, lng) {
  const R = 6371 // Earth's radius in km
  const dLat = (KAABA_LAT - lat) * DEG_TO_RAD
  const dLng = (KAABA_LNG - lng) * DEG_TO_RAD

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * DEG_TO_RAD) * Math.cos(KAABA_LAT * DEG_TO_RAD) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}
