AppSettingsPage({
  state: {
    language: 'en',
    calculationMethod: 3,
    asrJuristic: 0,
    adhanSound: true,
    duaReminders: true,
    fastingAlerts: false,
    selectedAdhan: 'makkah',
    nearestMosque: null
  },

  build(props) {
    this.getStorage(props)

    return [
      Section({
        title: 'General',
        children: [
          Select({
            label: 'Language',
            settingsKey: 'language',
            options: [
              { name: 'English', value: 'en' },
              { name: 'العربية', value: 'ar' },
              { name: '简体中文', value: 'zh' },
              { name: '繁體中文', value: 'zh-tw' },
              { name: 'Français', value: 'fr' },
              { name: 'Español', value: 'es' },
              { name: 'Bahasa', value: 'id' },
              { name: 'Melayu', value: 'ms' },
              { name: 'Türkçe', value: 'tr' },
              { name: 'اردو', value: 'ur' },
              { name: 'Русский', value: 'ru' }
            ]
          })
        ]
      }),
      Section({
        title: 'Prayer Time Calculations',
        children: [
          Select({
            label: 'Calculation Method',
            settingsKey: 'calculationMethod',
            options: [
              { name: 'Jafari (Ithna Ashari)', value: '0' },
              { name: 'University of Islamic Sciences, Karachi', value: '1' },
              { name: 'Islamic Society of North America (ISNA)', value: '2' },
              { name: 'Muslim World League (MWL)', value: '3' },
              { name: 'Umm Al-Qura University, Mecca', value: '4' },
              { name: 'Egyptian General Authority of Survey', value: '5' },
              { name: 'Institute of Geophysics, University of Tehran', value: '7' }
            ]
          }),
          Select({
            label: 'Asr Juristic Method',
            settingsKey: 'asrJuristic',
            options: [
              { name: 'Shafii / Standard', value: '0' },
              { name: 'Hanafi', value: '1' }
            ]
          })
        ]
      }),
      Section({
        title: 'Notifications & Alerts',
        children: [
          Toggle({
            label: 'Adhan Sound',
            settingsKey: 'adhanSound'
          }),
          Select({
            label: 'Adhan Style',
            settingsKey: 'selectedAdhan',
            options: [
              { name: 'Ahmed Al-Nafis (Makkah)', value: 'makkah' },
              { name: 'Madinah Style', value: 'madinah' },
              { name: 'Mishary Rashid Alafasy', value: 'alafasy' }
            ]
          }),
          Toggle({
            label: 'Dua Reminders',
            settingsKey: 'duaReminders'
          }),
          Toggle({
            label: 'Fasting Alerts',
            settingsKey: 'fastingAlerts'
          })
        ]
      }),
      Section({
        title: 'Nearby Mosque',
        children: [
          Text({
            text: this.state.nearestMosque 
              ? `Nearest: ${this.state.nearestMosque.name} (${this.state.nearestMosque.distance}m)` 
              : 'Open the watch app to find nearby mosques'
          }),
          ...(this.state.nearestMosque ? [
            Link({
              source: `https://www.google.com/maps/dir/?api=1&destination=${this.state.nearestMosque.lat},${this.state.nearestMosque.lng}`,
              label: 'Open Directions in Google Maps'
            })
          ] : [])
        ]
      }),
      Section({
        title: 'About SalatWatch',
        children: [
          Text({
            text: 'Version 1.0.2'
          }),
          Text({
            text: 'Comprehensive Islamic application for Zepp OS, featuring prayer times, Qibla compass, Tasbih, and Adhan notifications.'
          })
        ]
      })
    ]
  },

  getStorage(props) {
    const s = props.settingsStorage

    if (s.getItem('language')) {
      this.state.language = s.getItem('language')
    }
    if (s.getItem('calculationMethod')) {
      this.state.calculationMethod = parseInt(s.getItem('calculationMethod'))
    }
    if (s.getItem('asrJuristic')) {
      this.state.asrJuristic = parseInt(s.getItem('asrJuristic'))
    }
    if (s.getItem('adhanSound') !== null) {
      this.state.adhanSound = s.getItem('adhanSound') === 'true'
    }
    if (s.getItem('selectedAdhan')) {
      this.state.selectedAdhan = s.getItem('selectedAdhan')
    }
    if (s.getItem('duaReminders') !== null) {
      this.state.duaReminders = s.getItem('duaReminders') === 'true'
    }
    if (s.getItem('fastingAlerts') !== null) {
      this.state.fastingAlerts = s.getItem('fastingAlerts') === 'true'
    }
    if (s.getItem('nearestMosque')) {
      try {
        this.state.nearestMosque = JSON.parse(s.getItem('nearestMosque'))
      } catch (e) {}
    }
  }
})
