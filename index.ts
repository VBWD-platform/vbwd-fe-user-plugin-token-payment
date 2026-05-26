import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { registerInvoicePaymentMethod } from '@/extensions/invoicePaymentMethods';
import { registerCheckoutPaymentMethod } from '@/registries/checkoutPaymentMethods';
import { api } from '@/api';
import TokenPaymentPanel from './src/TokenPaymentPanel.vue';
import TokenCheckoutQuote from './src/TokenCheckoutQuote.vue';
import InvoicePaidTokensInfo from './src/InvoicePaidTokensInfo.vue';

/**
 * fe-user token-payment plugin.
 *
 * Two registrations, both agnostic:
 *   - **Invoice detail (s10):** a "Pay with tokens" panel on PENDING invoices.
 *   - **Checkout (s12):** a live quote block under the "Token balance" option +
 *     an ``instantPay`` hook so submit pays from the wallet in-band (no
 *     gateway redirect, no PENDING). Reuses the backend `/pay` endpoint.
 */
export const tokenPaymentPlugin: IPlugin = {
  name: 'token-payment',
  version: '1.0.0',
  description: 'Pay an invoice with your token balance',
  _active: false,

  install(_sdk: IPlatformSDK) {
    // PENDING invoice: "Pay with tokens" panel (s10).
    registerInvoicePaymentMethod(TokenPaymentPanel);
    // PAID invoice: "Paid with tokens — N tokens" info row alongside the fiat
    // total. Self-gates on status='paid' + token-payment method; both share
    // the same agnostic registry — core never names the plugin.
    registerInvoicePaymentMethod(InvoicePaidTokensInfo);
    // Checkout: live quote block + instant pay (s12).
    registerCheckoutPaymentMethod('token_balance', {
      detailComponent: TokenCheckoutQuote,
      instantPay: (invoiceId: string) =>
        api.post(`/plugins/token-payment/invoices/${invoiceId}/pay`, {}),
    });
  },
};

export default tokenPaymentPlugin;
