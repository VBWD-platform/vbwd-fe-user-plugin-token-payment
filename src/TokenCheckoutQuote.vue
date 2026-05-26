<template>
  <section
    v-if="quote && quote.available"
    class="token-checkout-quote"
    data-testid="token-checkout-quote"
  >
    <header class="token-checkout-quote__header">
      <span
        class="token-checkout-quote__icon"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      </span>
      <h3 class="token-checkout-quote__title">
        Pay with tokens
      </h3>
    </header>

    <dl class="token-checkout-quote__rows">
      <div class="token-checkout-quote__row">
        <dt>Token balance now</dt>
        <dd data-testid="tcq-balance">
          {{ formatTokens(quote.balance) }}
        </dd>
      </div>
      <div class="token-checkout-quote__row">
        <dt>Tokens to pay</dt>
        <dd data-testid="tcq-cost">
          {{ formatTokens(quote.tokens_needed) }}
        </dd>
      </div>
      <div
        class="token-checkout-quote__row token-checkout-quote__row--total"
        :class="{ 'token-checkout-quote__row--negative': (quote.balance_after ?? 0) < 0 }"
      >
        <dt>Balance after payment</dt>
        <dd data-testid="tcq-after">
          {{ formatTokens(quote.balance_after) }}
        </dd>
      </div>
    </dl>

    <p
      v-if="!quote.sufficient"
      class="token-checkout-quote__warn"
      data-testid="tcq-warn"
    >
      Not enough tokens to pay this order.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { setPayButtonLabelOverride } from 'vbwd-view-component';
import { api } from '@/api';

interface Quote {
  available: boolean;
  tokens_needed?: number;
  balance?: number;
  balance_after?: number;
  sufficient?: boolean;
}

const props = defineProps<{
  methodCode?: string;
  amount?: number | string | null;
  currency?: string;
}>();

const quote = ref<Quote | null>(null);

function formatTokens(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0 tokens';
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
  return `${formatted} tokens`;
}

async function loadQuote(): Promise<void> {
  if (!props.amount || Number(props.amount) <= 0 || !props.currency) {
    quote.value = { available: false };
    setPayButtonLabelOverride(null);
    return;
  }
  try {
    quote.value = (await api.get(
      `/plugins/token-payment/quote?amount=${encodeURIComponent(String(props.amount))}&currency=${encodeURIComponent(props.currency)}`,
    )) as Quote;
  } catch {
    quote.value = { available: false };
  }
  // Override the host's "Pay $XX.YY" button label with the token amount —
  // injected from this plugin, the only place that knows about tokens.
  if (quote.value?.available && quote.value.tokens_needed !== undefined) {
    const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
      quote.value.tokens_needed,
    );
    setPayButtonLabelOverride(`Pay ${formatted} tokens`);
  } else {
    setPayButtonLabelOverride(null);
  }
}

watch(
  () => [props.amount, props.currency],
  () => loadQuote(),
  { immediate: true },
);

// When the user switches away from the token-balance method, the detail
// component unmounts — clear the override so the host falls back to its
// default money-formatted Pay button.
onBeforeUnmount(() => {
  setPayButtonLabelOverride(null);
});
</script>

<style scoped>
.token-checkout-quote {
  background: var(--vbwd-surface, #ffffff);
  border: 1px solid var(--vbwd-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.5rem;
  margin: 0.75rem 0 0;
}

.token-checkout-quote__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-bottom: 0.875rem;
  margin-bottom: 0.875rem;
  border-bottom: 1px solid var(--vbwd-border, #e5e7eb);
}

.token-checkout-quote__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: var(--vbwd-color-success-light, #d1fae5);
  color: var(--vbwd-color-success-dark, #065f46);
  flex-shrink: 0;
}

.token-checkout-quote__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--vbwd-text, #1e293b);
  letter-spacing: -0.01em;
}

.token-checkout-quote__rows {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.token-checkout-quote__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem 0;
  margin: 0;
}

.token-checkout-quote__row + .token-checkout-quote__row {
  border-top: 1px dashed var(--vbwd-border-subtle, #f1f5f9);
}

.token-checkout-quote__row dt {
  color: var(--vbwd-text-muted, #64748b);
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.token-checkout-quote__row dd {
  color: var(--vbwd-text, #1e293b);
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.token-checkout-quote__row--total dt,
.token-checkout-quote__row--total dd {
  font-size: 0.9375rem;
  font-weight: 700;
}

.token-checkout-quote__row--negative dd {
  color: var(--vbwd-color-danger-dark, #991b1b);
}

.token-checkout-quote__warn {
  font-size: 0.85rem;
  margin: 0.5rem 0 0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--vbwd-color-warning-dark, #92400e);
  background: var(--vbwd-color-warning-light, #fef3c7);
}

@media (max-width: 640px) {
  .token-checkout-quote {
    padding: 1rem;
  }
}
</style>
