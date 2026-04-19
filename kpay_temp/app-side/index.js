import { MessageBuilder } from '../shared/message-side'
import { kpayConfig } from '../shared/kpay-config';
import kpayAppSide from 'kpay-amazfit/app-side';

const messageBuilder = new MessageBuilder();
const kpay = new kpayAppSide({ ...kpayConfig, messageBuilder });

AppSideService({
  onInit() {
    kpay.init();
    messageBuilder.listen(() => {});
    messageBuilder.on('request', (ctx) => {
      const jsonRpc = messageBuilder.buf2Json(ctx.request.payload);
      if (!kpay.onRequest(jsonRpc)) {
        // handle your own messages here
      }      
    });
  },
  onRun() {},
  onDestroy() {
    kpay.destroy();
  },
});
