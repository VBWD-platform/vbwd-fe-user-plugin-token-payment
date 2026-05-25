# Token-Balance Payment — fe-user plugin

The user-facing half of token payment: a **"Pay with tokens"** panel on a
PENDING invoice. It self-gates — it asks the backend for a quote and only
renders when token payment is available (plugin enabled + a rate for the
invoice currency).

Pairs with the backend plugin **`vbwd-plugin-token-payment`**, whose
[`docs/human/`](https://github.com/VBWD-platform/vbwd-plugin-token-payment/tree/main/docs/human)
and [`docs/llm/`](https://github.com/VBWD-platform/vbwd-plugin-token-payment/tree/main/docs/llm)
are the canonical "how it works / how to develop" docs for the whole feature.

## How it plugs in (agnostic)

`index.ts` registers `TokenPaymentPanel.vue` into fe-user core's
`invoicePaymentMethods` registry (`@/extensions/invoicePaymentMethods`).
`InvoiceDetail.vue` renders every registered method on PENDING invoices —
core never names "token". Any future method registers the same way, no core
change.

## The panel

- `GET /api/v1/plugins/token-payment/invoices/:id/quote` → balance, token cost,
  balance-after. Hidden if unavailable (disabled plugin / no rate / error).
- `POST /api/v1/plugins/token-payment/invoices/:id/pay` on click → on success
  emits `paid` so the invoice view refreshes (now PAID). Button disabled when
  the balance is insufficient.

## Enable

Off by default. Enable in the fe-user plugin manifest
(`${VAR_DIR}/plugins/fe-user-plugins.json`) **and** enable the backend
`token_payment` plugin with a currency rate.

## Tests

```bash
npx vitest run plugins/token-payment/tests/unit/
```

License: BSL 1.1.
