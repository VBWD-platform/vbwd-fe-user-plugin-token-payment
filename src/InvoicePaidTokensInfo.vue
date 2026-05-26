<template>
  <div
    v-if="tokensPaid !== null"
    class="invoice-paid-tokens"
    data-testid="invoice-paid-tokens"
  >
    <span class="invoice-paid-tokens__label">Paid with tokens</span>
    <span
      class="invoice-paid-tokens__value"
      data-testid="ipt-amount"
    >{{ tokensPaid }} tokens</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

interface InvoiceLike {
  id: string;
  status?: string;
  payment_method?: string | null;
}

const props = defineProps<{ invoice: InvoiceLike }>();

const tokensPaid = ref<number | null>(null);

function isTokenPaid(): boolean {
  const status = (props.invoice.status || '').toLowerCase();
  const method = (props.invoice.payment_method || '').toLowerCase();
  // Accept both the provider string (set by PaymentCapturedHandler — s11.1)
  // and the method code in case a custom flow ever stores that instead.
  return status === 'paid' && (method === 'token_payment' || method === 'token_balance');
}

async function loadTokensPaid(): Promise<void> {
  if (!isTokenPaid()) {
    tokensPaid.value = null;
    return;
  }
  try {
    const response = (await api.get(
      `/plugins/token-payment/invoices/${props.invoice.id}/tokens-paid`,
    )) as { tokens_paid: number | null };
    tokensPaid.value = response.tokens_paid;
  } catch {
    tokensPaid.value = null;
  }
}

onMounted(loadTokensPaid);
</script>

<style scoped>
.invoice-paid-tokens {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--vbwd-border, #e2e8f0);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background: var(--vbwd-surface-alt, #f8fafc);
  font-size: 0.95rem;
}
.invoice-paid-tokens__label {
  color: var(--vbwd-text-muted, #475569);
}
.invoice-paid-tokens__value {
  font-weight: 600;
}
</style>
