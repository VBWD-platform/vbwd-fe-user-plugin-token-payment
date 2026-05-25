import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TokenPaymentPanel from '../../src/TokenPaymentPanel.vue';
import { api } from '@/api';

vi.mock('@/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

const pendingInvoice = { id: 'inv-1', status: 'pending' };
const PANEL = '[data-testid="token-payment-panel"]';
const PAY = '[data-testid="tp-pay"]';

describe('TokenPaymentPanel', () => {
  it('shows balance + cost and an enabled pay button when affordable', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 200, balance: 500, balance_after: 300, sufficient: true,
    });
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: pendingInvoice } });
    await flushPromises();
    expect(wrapper.find(PANEL).exists()).toBe(true);
    expect(wrapper.find('[data-testid="tp-cost"]').text()).toContain('200');
    expect(wrapper.find('[data-testid="tp-after"]').text()).toContain('300');
    expect(wrapper.find(PAY).attributes('disabled')).toBeUndefined();
  });

  it('hides when token payment is unavailable (plugin off / no rate)', async () => {
    vi.mocked(api.get).mockResolvedValue({ available: false });
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: pendingInvoice } });
    await flushPromises();
    expect(wrapper.find(PANEL).exists()).toBe(false);
  });

  it('hides on quote error (e.g. 404 when disabled)', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('not found'));
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: pendingInvoice } });
    await flushPromises();
    expect(wrapper.find(PANEL).exists()).toBe(false);
  });

  it('disables the pay button when the balance is insufficient', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 200, balance: 50, balance_after: -150, sufficient: false,
    });
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: pendingInvoice } });
    await flushPromises();
    expect(wrapper.find(PAY).attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="tp-warn"]').exists()).toBe(true);
  });

  it('pays and emits "paid" on success', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 200, balance: 500, balance_after: 300, sufficient: true,
    });
    vi.mocked(api.post).mockResolvedValue({ new_balance: 300, status: 'PAID' });
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: pendingInvoice } });
    await flushPromises();
    await wrapper.find(PAY).trigger('click');
    await flushPromises();
    expect(api.post).toHaveBeenCalledWith('/plugins/token-payment/invoices/inv-1/pay', {});
    expect(wrapper.emitted('paid')).toBeTruthy();
    expect(wrapper.find(PAY).text()).toContain('Paid');
  });

  it('never quotes a non-PENDING invoice', async () => {
    const wrapper = mount(TokenPaymentPanel, { props: { invoice: { id: 'x', status: 'paid' } } });
    await flushPromises();
    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find(PANEL).exists()).toBe(false);
  });
});
