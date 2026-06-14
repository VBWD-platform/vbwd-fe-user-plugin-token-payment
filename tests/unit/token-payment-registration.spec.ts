import { describe, it, expect, beforeEach } from 'vitest';
import { tokenPaymentPlugin } from '../../index';
import {
  getCheckoutPaymentMethod,
  _resetCheckoutPaymentMethods,
} from '@/registries/checkoutPaymentMethods';
import {
  getInvoicePaymentMethods,
  _resetInvoicePaymentMethods,
} from '@/extensions/invoicePaymentMethods';
import TokenCheckoutQuote from '../../src/TokenCheckoutQuote.vue';
import TokenPaymentPanel from '../../src/TokenPaymentPanel.vue';

/**
 * Regression guard for S93 B1 + B3: the "Pay with tokens" before/after block
 * (checkout) and the dashboard invoice panel both depend on the plugin's
 * install() wiring its registrations. If install stops registering either, the
 * surfaces silently disappear — exactly the reported rollback.
 */
beforeEach(() => {
  _resetCheckoutPaymentMethods();
  _resetInvoicePaymentMethods();
});

const noopSdk = {} as never;

describe('token-payment plugin registration', () => {
  it('B1: registers the checkout token_balance detail block + instant pay', () => {
    tokenPaymentPlugin.install?.(noopSdk);
    const entry = getCheckoutPaymentMethod('token_balance');
    expect(entry).toBeDefined();
    expect(entry?.detailComponent).toBe(TokenCheckoutQuote);
    expect(typeof entry?.instantPay).toBe('function');
  });

  it('B3: registers the dashboard invoice "Pay with tokens" panel', () => {
    tokenPaymentPlugin.install?.(noopSdk);
    expect(getInvoicePaymentMethods()).toContain(TokenPaymentPanel);
  });
});
