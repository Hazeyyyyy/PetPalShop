# Payment Integration Documentation

## 1. Overview

PetPalShop uses the Maya Checkout Sandbox to process online payments. The integration allows customers to pay for their orders through a hosted checkout page.

## 2. Technology Used

- **Payment Gateway:** Maya Checkout Sandbox
- **Backend:** Node.js and Express
- **Database:** MySQL
- **Payment Processor:** `MayaPaymentProcessor`

## 3. Hosted Checkout

**Files:**
- `routes/paymentRoutes.js`
- `services/MayaPaymentProcessor.js`
- `services/PaymentService.js`

The checkout process works as follows:

1. The customer requests checkout for an order.
2. The backend checks the order and payment information.
3. `PaymentService` calls `MayaPaymentProcessor`.
4. Maya creates a hosted checkout session.
5. The backend saves the payment reference.
6. The customer receives the checkout URL and can proceed to Maya's payment page.

**API endpoint:**

`POST /api/payments/checkout/{order_id}`

## 4. Webhook Integration

**File:** `webhooks/mayaWebhook.js`

Maya sends webhook notifications to:

`POST /api/webhooks/maya`

The webhook informs the backend about payment events, including:

- `PAYMENT_SUCCESS`
- `PAYMENT_FAILED`
- `PAYMENT_EXPIRED`
- `PAYMENT_CANCELLED`

The backend verifies the webhook signature using Maya's public key and checks the timestamp before processing the event.

When a successful payment notification is received, the payment status is updated to `paid` and the order status is changed to `processing`.

## 5. Idempotency and Duplicate Event Protection

The project stores received webhook events in the `webhook_events` table.

Each event has a unique event key.

The database uses a UNIQUE constraint on the `event_key` column. If the same event is received again, the database rejects the duplicate entry, and the webhook returns a response indicating that the event was already received.

This helps prevent repeated payment updates and duplicate stock restoration.

## 6. Payment Validation

Before updating payment records, the webhook handler checks:

- Whether the merchant reference matches an existing payment.
- Whether the payment amount matches the expected order amount.
- Whether the currency is PHP.
- Whether the webhook signature and timestamp are valid.

These checks help protect the application from invalid payment notifications.

## 7. Stock Restoration

When a payment fails, expires, or is cancelled, the webhook handler is designed to restore the reserved product stock.

This helps prevent products from remaining unavailable after an unsuccessful payment.

The stock restoration process is implemented but still requires additional testing with failed, expired, and cancelled payment events.

## 8. Missed Webhook Reconciliation

**File:** `routes/paymentRoutes.js`

The project includes a reconciliation endpoint:

`POST /api/payments/reconcile/{order_id}`

This endpoint requests payment information from Maya and allows the backend to check payment status when a webhook notification may have been missed.

The endpoint also checks whether a payment has already been processed to prevent unnecessary repeated updates.

The reconciliation endpoint was tested using an already-paid order. The API correctly returned:

`Payment is already processed.`

Actual missed-webhook recovery still requires additional testing.

## 9. Environment Variables

The Maya API keys are stored in environment variables:

- `MAYA_PUBLIC_KEY`
- `MAYA_SECRET_KEY`

These keys are not hardcoded into the application or shared in the source code.

## 10. Testing

The payment integration was tested using the Maya Checkout Sandbox.

Tests successfully performed included:

- Creating a hosted checkout session.
- Completing a successful sandbox payment.
- Receiving a successful payment webhook.
- Updating the payment status to `paid`.
- Updating the order status to `processing`.
- Saving webhook event information in the database.
- Verifying the UNIQUE constraint on webhook event keys.
- Testing the reconciliation endpoint with an already-processed payment.

The following tests still require additional testing:

- Replaying an already-processed signed webhook.
- Testing invalid webhook signatures.
- Testing failed, cancelled, and expired payments.
- Separately testing invalid payment amounts and currencies.
- Testing actual missed-webhook recovery.

## Summary

The Maya Checkout Sandbox integration allows PetPalShop to process online payments. The system includes hosted checkout, webhook signature verification, event idempotency, payment validation, stock restoration, and payment reconciliation.

Successful sandbox payment processing and reconciliation checks have been verified. Some additional webhook and payment failure scenarios still require testing before final submission.