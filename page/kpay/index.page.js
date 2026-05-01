// KPay dialog page — safe version
Page({
  onInit() {
    try {
      const app = getApp()
      const gd = app.globalData || app._options.globalData
      if (gd && gd.kpay) {
        gd.kpay.pageInit()
      }
    } catch (e) {
      console.log('KPay pageInit error:', e)
    }
  },
  build() {
    try {
      const app = getApp()
      const gd = app.globalData || app._options.globalData
      if (gd && gd.kpay) {
        gd.kpay.pageBuild()
      }
    } catch (e) {
      console.log('KPay pageBuild error:', e)
    }
  },
  onDestroy() {
    try {
      const app = getApp()
      const gd = app.globalData || app._options.globalData
      if (gd && gd.kpay) {
        gd.kpay.pageDestroy()
      }
    } catch (e) {
      console.log('KPay pageDestroy error:', e)
    }
  }
})
