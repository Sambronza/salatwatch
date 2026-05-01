try {
  require('./es6-promise')
  if (typeof ES6Promise !== 'undefined') {
    ES6Promise.polyfill()
  }
  if (typeof Promise !== 'undefined' && Promise._setScheduler) {
    Promise._setScheduler(function (flush) {
      flush && flush()
    })
  }
} catch (e) {
  console.log('Polyfill load skipped (native Promise available):', e)
}
