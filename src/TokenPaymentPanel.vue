<template>
  <section
    v-if="quote && quote.available"
    class="token-payment"
    data-testid="token-payment-panel"
  >
    <header class="token-payment__header">
      <span
        class="token-payment__icon"
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
      <h3 class="token-payment__title">
        Pay with tokens
      </h3>
    </header>

    <dl class="token-payment__rows">
      <div class="token-payment__row">
        <dt>Your balance</dt>
        <dd data-testid="tp-balance">
          {{ formatTokens(quote.balance) }}
        </dd>
      </div>
      <div class="token-payment__row">
        <dt>This invoice</dt>
        <dd data-testid="tp-cost">
          {{ formatTokens(quote.tokens_needed) }}
        </dd>
      </div>
      <div
        class="token-payment__row token-payment__row--total"
        :class="{ 'token-payment__row--negative': (quote.balance_after ?? 0) < 0 }"
      >
        <dt>Balance after</dt>
        <dd data-testid="tp-after">
          {{ formatTokens(quote.balance_after) }}
        </dd>
      </div>
    </dl>

    <p
      v-if="!quote.sufficient && !paid"
      class="token-payment__warn"
      data-testid="tp-warn"
    >
      Not enough tokens to pay this invoice.
    </p>

    <button
      class="token-payment__btn"
      data-testid="tp-pay"
      :disabled="!quote.sufficient || paying || paid"
      @click="pay"
    >
      <span
        v-if="paying"
        class="token-payment__spinner"
        aria-hidden="true"
      />
      {{ buttonLabel }}
    </button>

    <p
      v-if="message"
      class="token-payment__msg"
      :class="{ 'token-payment__msg--ok': paid, 'token-payment__msg--err': !paid }"
      data-testid="tp-msg"
    >
      {{ message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api';

interface Quote {
  available: boolean;
  tokens_needed?: number;
  balance?: number;
  balance_after?: number;
  sufficient?: boolean;
}

interface InvoiceLike {
  id: string;
  status?: string;
}

const props = defineProps<{ invoice: InvoiceLike }>();
const emit = defineEmits<{ (event: 'paid'): void }>();

const quote = ref<Quote | null>(null);
const paying = ref(false);
const paid = ref(false);
const message = ref('');

const buttonLabel = computed(() => {
  if (paid.value) return 'Paid';
  if (paying.value) return 'Paying…';
  return `Pay with ${formatTokens(quote.value?.tokens_needed ?? 0)}`;
});

function formatTokens(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0 tokens';
  const formatted = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
  return `${formatted} tokens`;
}

function isPending(): boolean {
  return (props.invoice.status || '').toLowerCase() === 'pending';
}

async function loadQuote(): Promise<void> {
  if (!isPending()) {
    quote.value = { available: false };
    return;
  }
  try {
    quote.value = (await api.get(
      `/plugins/token-payment/invoices/${props.invoice.id}/quote`,
    )) as Quote;
  } catch {
    // plugin disabled / no rate / not payable → silently hide the panel
    quote.value = { available: false };
  }
}

async function pay(): Promise<void> {
  if (paying.value || paid.value) return;
  paying.value = true;
  message.value = '';
  try {
    await api.post(`/plugins/token-payment/invoices/${props.invoice.id}/pay`, {});
    paid.value = true;
    message.value = 'Payment successful.';
    emit('paid');
  } catch (err) {
    message.value = (err as Error).message || 'Payment failed.';
    await loadQuote();
  } finally {
    paying.value = false;
  }
}

onMounted(loadQuote);
</script>

<style scoped>
.token-payment {
  background: var(--vbwd-surface, #ffffff);
  border: 1px solid var(--vbwd-border, #e5e7eb);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
}

.token-payment__header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-bottom: 0.875rem;
  margin-bottom: 0.875rem;
  border-bottom: 1px solid var(--vbwd-border, #e5e7eb);
}

.token-payment__icon {
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

.token-payment__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--vbwd-text, #1e293b);
  letter-spacing: -0.01em;
}

.token-payment__rows {
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.token-payment__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.5rem 0;
  margin: 0;
}

.token-payment__row + .token-payment__row {
  border-top: 1px dashed var(--vbwd-border-subtle, #f1f5f9);
}

.token-payment__row dt {
  color: var(--vbwd-text-muted, #64748b);
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.token-payment__row dd {
  color: var(--vbwd-text, #1e293b);
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.token-payment__row--total dt,
.token-payment__row--total dd {
  font-size: 0.9375rem;
  font-weight: 700;
}

.token-payment__row--negative dd {
  color: var(--vbwd-color-danger-dark, #991b1b);
}

.token-payment__warn {
  font-size: 0.85rem;
  margin: 0.25rem 0 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--vbwd-color-warning-dark, #92400e);
  background: var(--vbwd-color-warning-light, #fef3c7);
}

.token-payment__btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 0;
  border-radius: 8px;
  background: var(--vbwd-color-primary, #2563eb);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.token-payment__btn:hover:not(:disabled) {
  background: var(--vbwd-color-primary-dark, #1d4ed8);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.token-payment__btn:active:not(:disabled) {
  transform: translateY(1px);
}

.token-payment__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.token-payment__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: token-payment-spin 0.8s linear infinite;
}

@keyframes token-payment-spin {
  to { transform: rotate(360deg); }
}

.token-payment__msg {
  font-size: 0.85rem;
  margin: 0.625rem 0 0;
}
.token-payment__msg--ok { color: var(--vbwd-color-success-dark, #065f46); }
.token-payment__msg--err { color: var(--vbwd-color-danger-dark, #991b1b); }

@media (max-width: 640px) {
  .token-payment {
    padding: 1rem;
    margin: 1rem 0;
  }
}
</style>
