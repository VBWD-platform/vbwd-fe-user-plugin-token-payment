import type { IPlugin, IPlatformSDK } from 'vbwd-view-component';
import { registerPaymentDataContributor } from 'vbwd-view-component';
import { registerInvoicePaymentMethod } from '@/extensions/invoicePaymentMethods';
import { registerCheckoutPaymentMethod } from '@/registries/checkoutPaymentMethods';
import { api } from '@/api';
import TokenPaymentPanel from './src/TokenPaymentPanel.vue';
import TokenCheckoutQuote from './src/TokenCheckoutQuote.vue';

/**
 * fe-user token-payment plugin.
 *
 * Three registrations, all agnostic — core knows nothing about tokens:
 *   - **Invoice detail (s10):** a "Pay with tokens" panel on PENDING invoices.
 *   - **Checkout (s12):** a live quote block + an ``instantPay`` hook so
 *     submit pays from the wallet in-band (no gateway redirect, no PENDING).
 *   - **Payment data block:** contributes the ``tokens_paid`` namespace
 *     (rendered by the shared fe-core ``PaymentDataBlock`` on both fe-user
 *     and fe-admin invoice-detail screens), reading
 *     ``invoice.metadata.tokens_paid.amount`` written by the backend
 *     ``/pay`` route — zero extra API call.
 */
export const tokenPaymentPlugin: IPlugin = {
  name: 'token-payment',
  version: '1.0.0',
  description: 'Pay an invoice with your token balance',
  _active: false,

  install(_sdk: IPlatformSDK) {
    // PENDING invoice: "Pay with tokens" panel (s10).
    registerInvoicePaymentMethod(TokenPaymentPanel);
    // Checkout: live quote block + instant pay (s12).
    registerCheckoutPaymentMethod('token_balance', {
      detailComponent: TokenCheckoutQuote,
      instantPay: (invoiceId: string) =>
        api.post(`/plugins/token-payment/invoices/${invoiceId}/pay`, {}),
    });
    // PAID invoice metadata: render the ``tokens_paid`` namespace inside the
    // shared "Payment data" block. Reads straight from ``invoice.metadata``
    // — no follow-up API call, no plugin-specific UI in the host view.
    registerPaymentDataContributor('tokens_paid', {
      label: 'Paid with tokens',
      format: (data) => {
        const amount = (data as { amount?: number } | null)?.amount ?? 0;
        return `${amount} tokens`;
      },
      order: 10,
    });
  },
};

export default tokenPaymentPlugin;
