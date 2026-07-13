/**
 * Monthly Prayer Timetable Cache
 *
 * The phone companion fetches ~2 months of precise times from the AlAdhan API
 * (FETCH_MONTHLY_TIMES). We cache them on the watch so times stay accurate for
 * a month+ without the phone. If the cache is missing, stale, or the user has
 * moved, we fall back to the local astronomical calculation — so the app never
 * shows nothing.
 */

import { localStorage } from '@zos/storage'
import { calculatePrayerTimes } from './prayerTimes'

const CACHE_KEY = 'salatwatch_monthly'
const LOCATION_TOLERANCE = 0.05 // ~5 km; beyond this the cached city is wrong

export function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function getMonthlyCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    if (!cache || !cache.days) return null
    return cache
  } catch (_) {
    return null
  }
}

export function saveMonthlyCache(days, lat, lng, method) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      days, lat, lng, method, ts: Date.now()
    }))
  } catch (_) {}
}

function cacheMatches(cache, lat, lng, method) {
  return cache &&
    cache.method === method &&
    Math.abs(lat - cache.lat) < LOCATION_TOLERANCE &&
    Math.abs(lng - cache.lng) < LOCATION_TOLERANCE
}

/**
 * Prayer times for a given date: cached API times when the location/method
 * still match, local calculation otherwise.
 * @returns {{ times: object, source: 'api'|'calc' }}
 */
export function getTimesForDate(date, lat, lng, timezone, method, asrJuristic) {
  const cache = getMonthlyCache()
  if (cacheMatches(cache, lat, lng, method)) {
    const day = cache.days[dateKey(date)]
    if (day && day.fajr) {
      return { times: day, source: 'api' }
    }
  }
  return {
    times: calculatePrayerTimes(lat, lng, timezone, date, method, asrJuristic),
    source: 'calc'
  }
}

/**
 * Should we ask the phone for a fresh month of times?
 * Yes when there's no usable cache for this location/method, or fewer than
 * 7 future days remain in it.
 */
export function monthlyCacheNeedsRefresh(lat, lng, method) {
  const cache = getMonthlyCache()
  if (!cacheMatches(cache, lat, lng, method)) return true

  let futureDays = 0
  const probe = new Date()
  for (let i = 0; i < 40; i++) {
    if (cache.days[dateKey(probe)]) futureDays++
    probe.setDate(probe.getDate() + 1)
  }
  return futureDays < 7
}
