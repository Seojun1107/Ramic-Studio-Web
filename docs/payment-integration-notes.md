# Toss Payments Integration Notes

Source: https://docs.tosspayments.com/en/api-guide

- Test API secret keys start with `test_sk` or `test_gsk`; live keys start with `live_sk` or `live_gsk`.
- Payments APIs use Basic authentication by base64-encoding `secretKey:`.
- POST APIs should use a unique `Idempotency-Key` to prevent duplicate requests; keys are valid for 15 days.
- Payment authorization requires `paymentKey`, `orderId`, and `amount`.
- `orderId` must be 6–64 characters and use letters, numbers, `-`, `_`.
- Domestic payment flows require absolute `successUrl` and `failUrl`.

Source: https://docs.tosspayments.com/en/webhooks

- `PAYMENT_STATUS_CHANGED` can report one-time payment status changes.
- Webhooks are delivered by HTTP POST and HTTPS is recommended.
- The endpoint must return HTTP 200; Toss may retry up to 7 times when delivery fails.
- The payment webhook payload includes `eventType` and `data.orderId`, `data.paymentKey`, and `data.status`.

Implementation decisions:

- Customer name, email, phone, and Steam keys are encrypted with AES-256-GCM at rest.
- A keyed SHA-256 lookup hash is stored for email deduplication without exposing plaintext.
- Order confirmation is server-side only; client-supplied amount is checked against the stored order amount.
- Steam key allocation is atomic by changing one AVAILABLE inventory record to SOLD.
- If inventory is empty, the payment remains PAID and fulfillment remains pending for admin handling.
