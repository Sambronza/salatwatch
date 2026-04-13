/**
 * Internationalization (i18n) Strings
 *
 * Supports: English (en), Arabic (ar)
 */

const strings = {
  en: {
    appName: 'SalatWatch',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    nextPrayer: 'Next Prayer',
    timeRemaining: 'Time Remaining',
    qiblaDirection: 'Qibla Direction',
    qiblaCompass: 'Qibla Compass',
    distanceToMecca: 'Distance to Mecca',
    tasbih: 'Tasbih',
    tapToCount: 'Tap to count',
    reset: 'Reset',
    settings: 'Settings',
    language: 'Language',
    calculationMethod: 'Calculation Method',
    asrMethod: 'Asr Method',
    shafii: 'Shafii',
    hanafi: 'Hanafi',
    notifications: 'Notifications',
    adhanSound: 'Adhan Sound',
    adhanStyle: 'Adhan Style',
    adhanMakkah: 'Ahmed Al-Nafis',
    adhanMadinah: 'Madinah Style',
    adhanAlafasy: 'Mishary Rashid Alafasy',
    duaReminders: 'Dua Reminders',
    fastingAlerts: 'Fasting Alerts',
    enabled: 'Enabled',
    disabled: 'Disabled',
    hijriDate: 'Hijri Date',
    today: 'Today',
    noGPS: 'GPS signal needed',
    tahajjud: 'Tahajjud',
    lastThirdNight: 'Last Third of Night',
    fridayDua: 'Friday Dua Hour',
    prayerTime: 'Prayer Time',
    km: 'km',
    bismillah: 'Bismillah',
    subhanAllah: 'SubhanAllah',
    alhamdulillah: 'Alhamdulillah',
    allahuAkbar: 'Allahu Akbar',
    zakatCalculator: 'Zakat Calculator',
    fastingTracker: 'Fasting Tracker',
    enterAssets: 'Current Assets',
    totalZakat: 'Total Zakat (2.5%)',
    totalSavings: 'Total Savings',
    missedFasts: 'Missed Fasts',
    upcomingFasts: 'Upcoming Fasts',
    addFast: 'Mark Fasted',
    plus100: '+100',
    plus1000: '+1000'
  },
  ar: {
    appName: 'ساعة الصلاة',
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
    nextPrayer: 'الصلاة القادمة',
    timeRemaining: 'الوقت المتبقي',
    qiblaDirection: 'اتجاه القبلة',
    qiblaCompass: 'بوصلة القبلة',
    distanceToMecca: 'المسافة إلى مكة',
    tasbih: 'تسبيح',
    tapToCount: 'انقر للعدّ',
    reset: 'إعادة',
    settings: 'الإعدادات',
    language: 'اللغة',
    calculationMethod: 'طريقة الحساب',
    asrMethod: 'طريقة العصر',
    shafii: 'شافعي',
    hanafi: 'حنفي',
    notifications: 'الإشعارات',
    adhanSound: 'صوت الأذان',
    adhanStyle: 'نمط الأذان',
    adhanMakkah: 'أحمد النفيس',
    adhanMadinah: 'المدنية المنورة',
    adhanAlafasy: 'مشاري راشد العفاسي',
    duaReminders: 'تذكير الدعاء',
    fastingAlerts: 'تنبيه الصيام',
    enabled: 'مفعّل',
    disabled: 'معطّل',
    hijriDate: 'التاريخ الهجري',
    today: 'اليوم',
    noGPS: 'يُرجى تفعيل GPS',
    tahajjud: 'التهجد',
    lastThirdNight: 'الثلث الأخير من الليل',
    fridayDua: 'ساعة الإجابة يوم الجمعة',
    prayerTime: 'وقت الصلاة',
    km: 'كم',
    bismillah: 'بسم الله',
    subhanAllah: 'سبحان الله',
    alhamdulillah: 'الحمد لله',
    allahuAkbar: 'الله أكبر',
    zakatCalculator: 'حاسبة الزكاة',
    fastingTracker: 'متتبع الصيام',
    enterAssets: 'إجمالي الأصول',
    totalZakat: 'إجمالي الزكاة (2.5%)',
    totalSavings: 'إجمالي المدخرات',
    missedFasts: 'الصيام الفائت',
    upcomingFasts: 'الصيام القادم',
    addFast: 'تم الصيام',
    plus100: '+١٠٠',
    plus1000: '+١٠٠٠'
  }
}

/**
 * Get translated string by key.
 * @param {string} key - Translation key
 * @param {string} lang - Language code ('en' or 'ar')
 * @returns {string}
 */
export function t(key, lang = 'en') {
  const langStrings = strings[lang] || strings['en']
  return langStrings[key] || strings['en'][key] || key
}

/**
 * Check if a language is RTL.
 */
export function isRTL(lang) {
  return lang === 'ar'
}

export default strings
