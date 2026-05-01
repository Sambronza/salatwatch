import { TEXT_STYLE } from './index.style';
import { createWidget, widget } from '@zos/ui';
import { log } from '@zos/utils';

const logger = log.getLogger('example-page')
const { kpay } = getApp()._options.globalData;

Page({
  onInit() {
    logger.debug('page onInit invoked');
    // kpay.startPurchase(); // not needed when having a trial. When you have no trial active, this needs to be called to start purchase. Can start from anywhere
  },
  build() {
    logger.debug('page build invoked');
    createWidget(widget.TEXT, {
      ...TEXT_STYLE,
      text: "Hello KPAY!",
    });
  },
  onDestroy() {
    logger.debug('page onDestroy invoked');
  },
});
