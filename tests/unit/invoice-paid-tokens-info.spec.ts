import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import InvoicePaidTokensInfo from '../../src/InvoicePaidTokensInfo.vue';
import { api } from '@/api';

vi.mock('@/api', () => ({ api: { get: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

const ROW = '[data-testid="invoice-paid-tokens"]';

describe('InvoicePaidTokensInfo', () => {
  it('renders the tokens-paid row for a PAID invoice paid with token-balance', async () => {
    vi.mocked(api.get).mockResolvedValue({ tokens_paid: 600 });
    const wrapper = mount(InvoicePaidTokensInfo, {
      props: { invoice: { id: 'inv-1', status: 'paid', payment_method: 'token_payment' } },
    });
    await flushPromises();
    expect(wrapper.find(ROW).exists()).toBe(true);
    expect(wrapper.find('[data-testid="ipt-amount"]').text()).toContain('600');
    expect(api.get).toHaveBeenCalledWith('/plugins/token-payment/invoices/inv-1/tokens-paid');
  });

  it('also recognises payment_method = "token_balance" (method-code variant)', async () => {
    vi.mocked(api.get).mockResolvedValue({ tokens_paid: 200 });
    const wrapper = mount(InvoicePaidTokensInfo, {
      props: { invoice: { id: 'inv-2', status: 'paid', payment_method: 'token_balance' } },
    });
    await flushPromises();
    expect(wrapper.find(ROW).exists()).toBe(true);
  });

  it('renders nothing for a PENDING invoice (the pay panel handles those)', async () => {
    const wrapper = mount(InvoicePaidTokensInfo, {
      props: { invoice: { id: 'x', status: 'pending', payment_method: 'token_payment' } },
    });
    await flushPromises();
    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find(ROW).exists()).toBe(false);
  });

  it('renders nothing when the invoice was paid via a different method', async () => {
    const wrapper = mount(InvoicePaidTokensInfo, {
      props: { invoice: { id: 'x', status: 'paid', payment_method: 'stripe' } },
    });
    await flushPromises();
    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find(ROW).exists()).toBe(false);
  });

  it('hides on API error / null tokens_paid', async () => {
    vi.mocked(api.get).mockResolvedValue({ tokens_paid: null });
    const wrapper = mount(InvoicePaidTokensInfo, {
      props: { invoice: { id: 'x', status: 'paid', payment_method: 'token_payment' } },
    });
    await flushPromises();
    expect(wrapper.find(ROW).exists()).toBe(false);
  });
});
