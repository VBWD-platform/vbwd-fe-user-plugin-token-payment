<template>
  <div
    v-if="quote && quote.available"
    class="token-checkout-quote"
    data-testid="token-checkout-quote"
  >
    <h4 class="token-checkout-quote__title">
      Pay with tokens
    </h4>
    <div class="token-checkout-quote__row">
      <span>Token balance now</span>
      <span data-testid="tcq-balance">{{ quote.balance }} tokens</span>
    </div>
    <div class="token-checkout-quote__row">
      <span>Tokens to pay</span>
      <span data-testid="tcq-cost">{{ quote.tokens_needed }} tokens</span>
    </div>
    <div class="token-checkout-quote__row">
      <span>Balance after payment</span>
      <span data-testid="tcq-after">{{ quote.balance_after }} tokens</span>
    </div>
    <p
      v-if="!quote.sufficient"
      class="token-checkout-quote__warn"
      data-testid="tcq-warn"
    >
      Not enough tokens to pay this order.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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

async function loadQuote(): Promise<void> {
  if (!props.amount || Number(props.amount) <= 0 || !props.currency) {
    quote.value = { available: false };
    return;
  }
  try {
    quote.value = (await api.get(
      `/plugins/token-payment/quote?amount=${encodeURIComponent(String(props.amount))}&currency=${encodeURIComponent(props.currency)}`,
    )) as Quote;
  } catch {
    quote.value = { available: false };
  }
}

watch(
  () => [props.amount, props.currency],
  () => loadQuote(),
  { immediate: true },
);
</script>

<style scoped>
.token-checkout-quote {
  margin-top: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: 8px;
  min-width: 240px;
}
.token-checkout-quote__title { margin: 0 0 0.5rem; font-size: 1rem; }
.token-checkout-quote__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9rem;
  padding: 0.15rem 0;
}
.token-checkout-quote__warn { color: #b45309; font-size: 0.85rem; margin: 0.4rem 0 0; }
</style>
