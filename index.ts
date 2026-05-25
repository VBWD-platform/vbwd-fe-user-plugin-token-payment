import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { registerInvoicePaymentMethod } from '@/extensions/invoicePaymentMethods';
import TokenPaymentPanel from './src/TokenPaymentPanel.vue';

/**
 * fe-user token-payment plugin.
 *
 * Registers a "Pay with tokens" panel into the agnostic invoice payment-method
 * registry. The panel self-gates: it asks the backend plugin for a quote and
 * only renders when token payment is available (plugin enabled + a rate for the
 * invoice currency). Backed by `vbwd-plugin-token-payment` (backend).
 */
export const tokenPaymentPlugin: IPlugin = {
  name: 'token-payment',
  version: '1.0.0',
  description: 'Pay an invoice with your token balance',
  _active: false,

  install(_sdk: IPlatformSDK) {
    registerInvoicePaymentMethod(TokenPaymentPanel);
  },
};

export default tokenPaymentPlugin;
