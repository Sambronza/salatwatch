/**
 * Adhan Player & Notification Manager
 *
 * Handles:
 *  - Background alarm scheduling for prayer times
 *  - Playing the selected Adhan audio file
 */

// Lazy-loaded to prevent crashes if module is unavailable
let mediaModule = null
let alarmModule = null
try { mediaModule = require('@zos/media') } catch(e) { console.log('Media module unavailable') }
try { alarmModule = require('@zos/alarm') } catch(e) { console.log('Alarm module unavailable') }

let player = null

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
        console.log('Adhan player prepared')
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
 * Schedule alarms for all prayer times today.
 * @param {object} prayerTimes - { fajr, dhuhr, asr, maghrib, isha }
 */
export function schedulePrayerAlarms(prayerTimes) {
  if (!prayerTimes) return

  const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  const now = new Date()

  keys.forEach(key => {
    const timeStr = prayerTimes[key]
    if (!timeStr) return

    const [h, m] = timeStr.split(':').map(Number)
    const alarmDate = new Date()
    alarmDate.setHours(h, m, 0)

    // Only schedule if the time is in the future
    if (alarmDate > now) {
      console.log(`Scheduling alarm for ${key} at ${timeStr}`)
      try {
        if (!alarmModule || !alarmModule.Alarm) {
          console.log('Alarm module not available')
          return
        }
        const alarm = new alarmModule.Alarm({
          app_id: 1000001,
          date: alarmDate.getTime() / 1000, // seconds
          store: true
        })
        alarm.set()
      } catch (e) {
        console.log(`Failed to schedule ${key}:`, e)
      }
    }
  })
}

/**
 * Stop any active Adhan playback.
 */
export function stopAdhan() {
  if (player) {
    try { player.stop() } catch (e) {}
  }
}
