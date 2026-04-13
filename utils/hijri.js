/**
 * Hijri (Islamic) Calendar Converter
 *
 * Converts Gregorian dates to Hijri dates using the Umm al-Qura calendar approximation.
 * Also provides Islamic holiday detection.
 */

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
]

const HIJRI_MONTHS_AR = [
  'محرّم', 'صفر', 'ربيع الأوّل', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجّة'
]

/**
 * Convert a Gregorian date to an approximate Hijri date.
 * Uses the Kuwaiti algorithm.
 * @param {Date} date - Gregorian date object
 * @returns {{ year: number, month: number, day: number, monthName: string, monthNameAr: string }}
 */
export function gregorianToHijri(date) {
  const day = date.getDate()
  const month = date.getMonth() // 0-indexed
  const year = date.getFullYear()

  let jd = intPart((1461 * (year + 4800 + intPart((month + 1 - 14) / 12))) / 4) +
    intPart((367 * (month + 1 - 2 - 12 * intPart((month + 1 - 14) / 12))) / 12) -
    intPart((3 * intPart((year + 4900 + intPart((month + 1 - 14) / 12)) / 100)) / 4) +
    day - 32075

  jd = jd - 1948440 + 10632
  const n = intPart((jd - 1) / 10631)
  jd = jd - 10631 * n + 354
  const j = intPart((10985 - jd) / 5316) * intPart((50 * jd) / 17719) +
    intPart(jd / 5670) * intPart((43 * jd) / 15238)
  jd = jd - intPart((30 - j) / 15) * intPart((17719 * j) / 50) -
    intPart(j / 16) * intPart((15238 * j) / 43) + 29

  const hijriMonth = intPart((24 * jd) / 709)
  const hijriDay = jd - intPart((709 * hijriMonth) / 24)
  const hijriYear = 30 * n + j - 30

  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay,
    monthName: HIJRI_MONTHS_EN[hijriMonth - 1] || '',
    monthNameAr: HIJRI_MONTHS_AR[hijriMonth - 1] || ''
  }
}

function intPart(x) {
  return x < 0 ? Math.ceil(x - 0.5) : Math.floor(x + 0.5)
}

/**
 * Detect if today is a notable Islamic holiday.
 * @param {number} hijriMonth - 1-indexed Hijri month
 * @param {number} hijriDay - Day of month
 * @returns {object|null} Holiday info or null
 */
export function detectIslamicHoliday(hijriMonth, hijriDay) {
  const holidays = [
    // Ramadan
    { month: 9, day: 1, id: 'ramadan_start', en: '🌙 Ramadan Mubarak!', ar: '🌙 رمضان مبارك!' },
    // Eid al-Fitr (1st Shawwal)
    { month: 10, day: 1, id: 'eid_fitr', en: '🎉 Eid al-Fitr Mubarak!', ar: '🎉 عيد الفطر مبارك!' },
    { month: 10, day: 2, id: 'eid_fitr_2', en: '🎉 Eid al-Fitr (Day 2)', ar: '🎉 عيد الفطر (اليوم الثاني)' },
    { month: 10, day: 3, id: 'eid_fitr_3', en: '🎉 Eid al-Fitr (Day 3)', ar: '🎉 عيد الفطر (اليوم الثالث)' },
    // Eid al-Adha (10th Dhul Hijjah)
    { month: 12, day: 10, id: 'eid_adha', en: '🐑 Eid al-Adha Mubarak!', ar: '🐑 عيد الأضحى مبارك!' },
    { month: 12, day: 11, id: 'eid_adha_2', en: '🐑 Eid al-Adha (Day 2)', ar: '🐑 عيد الأضحى (اليوم الثاني)' },
    { month: 12, day: 12, id: 'eid_adha_3', en: '🐑 Eid al-Adha (Day 3)', ar: '🐑 عيد الأضحى (اليوم الثالث)' },
    { month: 12, day: 13, id: 'eid_adha_4', en: '🐑 Eid al-Adha (Day 4)', ar: '🐑 عيد الأضحى (اليوم الرابع)' },
    // Day of Arafah
    { month: 12, day: 9, id: 'arafah', en: '🤲 Day of Arafah', ar: '🤲 يوم عرفة' },
    // Ashura (10th Muharram)
    { month: 1, day: 10, id: 'ashura', en: 'Day of Ashura', ar: 'يوم عاشوراء' },
    // Mawlid an-Nabi (12th Rabi al-Awwal)
    { month: 3, day: 12, id: 'mawlid', en: '🕌 Mawlid an-Nabi', ar: '🕌 المولد النبوي الشريف' },
    // Isra and Mi'raj (27th Rajab)
    { month: 7, day: 27, id: 'isra_miraj', en: '✨ Isra\' and Mi\'raj', ar: '✨ ليلة الإسراء والمعراج' },
    // Laylat al-Qadr (27th Ramadan approx)
    { month: 9, day: 27, id: 'laylat_qadr', en: '🌟 Laylat al-Qadr', ar: '🌟 ليلة القدر' },
    // Mid-Shaban
    { month: 8, day: 15, id: 'mid_shaban', en: 'Mid-Sha\'ban Night', ar: 'ليلة النصف من شعبان' }
  ]

  const found = holidays.find(h => h.month === hijriMonth && h.day === hijriDay)
  return found || null
}

/**
 * Check if the current Hijri month is Ramadan.
 */
export function isRamadan(hijriMonth) {
  return hijriMonth === 9
}

/**
 * Format Hijri date as a string.
 * @param {object} hijri - Result from gregorianToHijri
 * @param {string} lang - 'en' or 'ar'
 * @returns {string}
 */
export function formatHijriDate(hijri, lang) {
  const monthName = lang === 'ar' ? hijri.monthNameAr : hijri.monthName
  return `${hijri.day} ${monthName} ${hijri.year}`
}
