<template>
  <div
    v-if="quote && quote.available"
    class="token-payment"
    data-testid="token-payment-panel"
  >
    <h4 class="token-payment__title">
      Pay with tokens
    </h4>
    <div class="token-payment__row">
      <span>Your balance</span>
      <span data-testid="tp-balance">{{ quote.balance }} tokens</span>
    </div>
    <div class="token-payment__row">
      <span>This invoice</span>
      <span data-testid="tp-cost">{{ quote.tokens_needed }} tokens</span>
    </div>
    <div class="token-payment__row">
      <span>Balance after</span>
      <span data-testid="tp-after">{{ quote.balance_after }} tokens</span>
    </div>
    <button
      class="btn primary token-payment__btn"
      data-testid="tp-pay"
      :disabled="!quote.sufficient || paying || paid"
      @click="pay"
    >
      {{ buttonLabel }}
    </button>
    <p
      v-if="!quote.sufficient && !paid"
      class="token-payment__warn"
      data-testid="tp-warn"
    >
      Not enough tokens.
    </p>
    <p
      v-if="message"
      class="token-payment__msg"
      data-testid="tp-msg"
    >
      {{ message }}
    </p>
  </div>
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
  return `Pay with ${quote.value?.tokens_needed ?? 0} tokens`;
});

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
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: 8px;
}
.token-payment__title { margin: 0 0 0.5rem; font-size: 1rem; }
.token-payment__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.15rem 0;
}
.token-payment__btn { margin-top: 0.6rem; }
.token-payment__warn { color: #b45309; font-size: 0.85rem; margin: 0.4rem 0 0; }
.token-payment__msg { font-size: 0.85rem; margin: 0.4rem 0 0; }
</style>
