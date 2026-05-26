import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import TokenCheckoutQuote from '../../src/TokenCheckoutQuote.vue';
import { api } from '@/api';

vi.mock('@/api', () => ({ api: { get: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

const QUOTE = '[data-testid="token-checkout-quote"]';

describe('TokenCheckoutQuote', () => {
  it('renders balance / cost / after when the amount-quote is available', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 600, balance: 8924, balance_after: 8324, sufficient: true,
    });
    const wrapper = mount(TokenCheckoutQuote, {
      props: { amount: '29.99', currency: 'USD' },
    });
    await flushPromises();
    expect(wrapper.find(QUOTE).exists()).toBe(true);
    expect(wrapper.find('[data-testid="tcq-balance"]').text()).toContain('8924');
    expect(wrapper.find('[data-testid="tcq-cost"]').text()).toContain('600');
    expect(wrapper.find('[data-testid="tcq-after"]').text()).toContain('8324');
    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/plugins/token-payment/quote?amount=29.99&currency=USD'));
  });

  it('hides when unavailable (no rate / plugin off)', async () => {
    vi.mocked(api.get).mockResolvedValue({ available: false });
    const wrapper = mount(TokenCheckoutQuote, {
      props: { amount: '10', currency: 'JPY' },
    });
    await flushPromises();
    expect(wrapper.find(QUOTE).exists()).toBe(false);
  });

  it('warns visibly when the balance is insufficient', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 99999, balance: 100, balance_after: -99899, sufficient: false,
    });
    const wrapper = mount(TokenCheckoutQuote, {
      props: { amount: '4999.95', currency: 'USD' },
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="tcq-warn"]').exists()).toBe(true);
  });

  it('re-quotes when the cart total changes', async () => {
    vi.mocked(api.get).mockResolvedValue({
      available: true, tokens_needed: 200, balance: 500, balance_after: 300, sufficient: true,
    });
    const wrapper = mount(TokenCheckoutQuote, {
      props: { amount: '10', currency: 'USD' },
    });
    await flushPromises();
    expect(api.get).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ amount: '20', currency: 'USD' });
    await flushPromises();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('does not quote with a zero/missing amount', async () => {
    const wrapper = mount(TokenCheckoutQuote, {
      props: { amount: 0, currency: 'USD' },
    });
    await flushPromises();
    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find(QUOTE).exists()).toBe(false);
  });
});
