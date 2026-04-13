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
  const lat1 = lat * DEG_TO_RAD
  const lat2 = KAABA_LAT * DEG_TO_RAD
  const dLng = (KAABA_LNG - lng) * DEG_TO_RAD

  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  let bearing = Math.atan2(x, y) * RAD_TO_DEG
  bearing = (bearing + 360) % 360

  return bearing
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
