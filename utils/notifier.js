/**
 * Adhan Player & Notification Manager
 *
 * Handles:
 *  - Background alarm scheduling for prayer times (@zos/alarm set/cancel API)
 *  - Playing the selected Adhan audio file
 *  - Vibration alert when a prayer time is reached
 */

// Lazy-loaded to prevent crashes if module is unavailable
let mediaModule = null
let alarmModule = null
let sensorModule = null
try { mediaModule = require('@zos/media') } catch (e) { console.log('Media module unavailable') }
try { alarmModule = require('@zos/alarm') } catch (e) { console.log('Alarm module unavailable') }
try { sensorModule = require('@zos/sensor') } catch (e) { console.log('Sensor module unavailable') }

let player = null
let vibrator = null

/**
 * Play the selected Adhan sound.
 * @param {string} adhanId - 'makkah', 'madinah', or 'alafasy'
 */
export function playAdhan(adhanId = 'makkah') {

  // Stop current player if any
  if (player) {
    try { player.stop(); player.release() } catch (e) {}
  }

  // We currently only have the Makkah file synced to assets.
  // Fall back to makkah for any selection to prevent crashes.
  const resolvedAdhan = 'makkah' // Future: use adhanId when other MP3s are available
  const filename = `audio/adhan_${resolvedAdhan}.mp3`
  console.log('Playing Adhan:', filename)

  try {
    if (!mediaModule || !mediaModule.create) {
      console.log('Media module not available for adhan playback')
      return
    }
    player = mediaModule.create(mediaModule.id.PLAYER)
    player.setSource(player.source.FILE, {
      file: filename
    })

    player.addEventListener(player.event.PREPARE, (result) => {
      if (result) {
        player.start()
      } else {
        console.log('Adhan player prepare failed')
      }
    })

    player.prepare()
  } catch (e) {
    console.log('Error playing Adhan:', e)
  }
}

/**
 * Vibrate the watch to announce the Adhan (works even if audio is unavailable).
 */
export function vibrateForAdhan() {
  try {
    if (!sensorModule || !sensorModule.Vibrator) return
    if (!vibrator) vibrator = new sensorModule.Vibrator()
    const scene = sensorModule.VIBRATOR_SCENE_NOTIFICATION !== undefined
      ? sensorModule.VIBRATOR_SCENE_NOTIFICATION
      : sensorModule.VIBRATOR_SCENE_SHORT
    try { vibrator.setMode(scene) } catch (_) {}
    vibrator.start()
    setTimeout(() => { try { vibrator.stop() } catch (_) {} }, 5000)
  } catch (e) {
    console.log('Vibration error:', e)
  }
}

/**
 * Full prayer-time alert: vibration + Adhan audio.
 */
export function triggerAdhanAlert(adhanId) {
  vibrateForAdhan()
  playAdhan(adhanId)
}

/**
 * Schedule alarms for all prayer times today (and tomorrow, if provided).
 * Uses the @zos/alarm set() function (there is no Alarm class in Zepp OS 2.0).
 * Each alarm relaunches the app on page/index with an `adhan=<prayer>` param
 * so the page can vibrate and play the Adhan. Scheduling tomorrow as well
 * keeps alarms firing even if the app isn't opened again that day.
 * @param {object} prayerTimes - today's { fajr, dhuhr, asr, maghrib, isha }
 * @param {object} [tomorrowTimes] - same shape, for tomorrow's date
 */
export function schedulePrayerAlarms(prayerTimes, tomorrowTimes) {
  if (!prayerTimes) return
  if (!alarmModule || typeof alarmModule.set !== 'function') {
    console.log('Alarm module not available')
    return
  }

  // Skip the whole (slow) cancel+reschedule cycle if nothing changed since
  // the last run — this used to execute on every single app launch.
  const today = new Date()
  const sig = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}|` +
    `${prayerTimes.fajr},${prayerTimes.dhuhr},${prayerTimes.asr},${prayerTimes.maghrib},${prayerTimes.isha}|` +
    (tomorrowTimes ? `${tomorrowTimes.fajr},${tomorrowTimes.isha}` : '')
  try {
    const { localStorage } = require('@zos/storage')
    if (localStorage.getItem('salatwatch_alarm_sig') === sig) return
    localStorage.setItem('salatwatch_alarm_sig', sig)
  } catch (_) {}

  // Cancel previously scheduled alarms so re-opening the app doesn't stack duplicates
  try {
    if (typeof alarmModule.getAllAlarms === 'function') {
      const existing = alarmModule.getAllAlarms() || []
      existing.forEach(id => { try { alarmModule.cancel(id) } catch (_) {} })
    }
  } catch (e) {
    console.log('Failed to clear old alarms:', e)
  }

  const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  const now = new Date()

  function scheduleDay(times, dayOffset) {
    if (!times) return
    keys.forEach(key => {
      const timeStr = times[key]
      if (!timeStr) return

      const [h, m] = timeStr.split(':').map(Number)
      const alarmDate = new Date(now.getTime() + dayOffset * 86400000)
      alarmDate.setHours(h, m, 0, 0)

      // Only schedule if the time is in the future
      if (alarmDate > now) {
        try {
          const id = alarmModule.set({
            url: 'page/index',
            time: Math.floor(alarmDate.getTime() / 1000), // epoch seconds
            store: true,
            param: 'adhan=' + key
          })
          console.log(`Scheduled alarm ${id} for ${key} at ${timeStr} (+${dayOffset}d)`)
        } catch (e) {
          console.log(`Failed to schedule ${key}:`, e)
        }
      }
    })
  }

  scheduleDay(prayerTimes, 0)
  scheduleDay(tomorrowTimes, 1)
}

/**
 * Stop everything the alert started: audio and vibration.
 */
export function stopAdhanAlert() {
  stopAdhan()
  try { if (vibrator) vibrator.stop() } catch (_) {}
}

/**
 * Stop any active Adhan playback.
 */
export function stopAdhan() {
  if (player) {
    try { player.stop() } catch (e) {}
  }
}
