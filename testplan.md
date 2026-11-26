# Test Plan and Test Results

## 1. Overview

This document describes the testing performed on the PetPalShop API. The tests cover authentication, authorization, product management, coupons, inventory, payment processing, webhooks, AI recommendations, and object-oriented programming.

## 2. Authentication and Authorization

| Test Case | Expected Result | Result |
|---|---|---|
| Register a new user | Account is created successfully | Passed |
| Login with valid credentials | JWT token is returned | Passed |
| Access protected route without token | Request is rejected with 401 | Passed |
| Customer accesses admin-only route | Request is rejected with 403 | Passed |
| Admin accesses admin-only route | Request is accepted | Passed |

## 3. Product and Category Management

| Test Case | Expected Result | Result |
|---|---|---|
| Retrieve products | Product list is returned | Passed |
| Retrieve categories | Category list is returned | Passed |
| Create product with valid information | Product is created | Passed |
| Update product with valid information | Product information is updated | Passed |
| Submit invalid product price or stock | Validation error is returned | Passed |

## 4. Coupon Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Apply valid WELCOME10 coupon | 10% discount is calculated | Passed |
| Apply invalid coupon code | Request is rejected | Passed |
| Apply coupon below minimum order amount | Request is rejected | Not Tested |

## 5. Inventory and Order Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Create an order using cart items | Order is created and stock is deducted | Passed |
| Create order with insufficient stock | Order creation is rejected | Not Tested |
| Verify stock deduction during order creation | Stock is reduced correctly | Passed |
| Test concurrent purchases of the same limited stock | Overselling is prevented | Not Tested |

## 6. Payment Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Create Maya hosted checkout | Checkout URL is returned | Passed |
| Complete Maya sandbox payment | Payment is successful | Passed |
| Receive successful payment webhook | Payment is marked as paid | Passed |
| Verify payment amount and currency | Invalid values are rejected | Not Separately Tested |
| Test failed payment webhook | Payment is marked as failed and stock is restored | Not Tested |
| Test cancelled or expired payment webhook | Stock is restored | Not Tested |
| Test reconciliation after successful webhook | Already processed payment is recognized | Passed |
| Test missed-webhook reconciliation | Payment status is recovered from Maya | Not Tested |

## 7. Webhook Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Receive valid payment webhook | Event is processed | Passed |
| Verify duplicate event key constraint | Duplicate event keys are rejected by the database | Passed |
| Replay an already processed webhook | Duplicate event is not processed again | Not Tested |
| Test invalid webhook signature | Request is rejected | Not Tested |
| Check webhook event storage | Event is saved in the database | Passed |

## 8. AI Recommendation Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Ask for product recommendations | Gemini returns recommendations | Passed |
| Request an unavailable product type | AI recognizes that no matching product is available | Passed |

## 9. OOP Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Instantiate BasePaymentProcessor directly | Error is thrown | Passed |
| Instantiate MayaPaymentProcessor | Object is created successfully | Passed |
| Create PaymentService with MayaPaymentProcessor | Both objects are connected successfully | Passed |
| Check JavaScript syntax of OOP files | No syntax errors appear | Passed |

## 10. General Application Testing

| Test Case | Expected Result | Result |
|---|---|---|
| Start the application | Express server starts successfully | Passed |
| Connect to MySQL | Database connection succeeds | Passed |
| Open Swagger UI | API documentation is displayed | Passed |

## 11. Summary

PetPalShop has successfully passed several functional tests involving authentication, authorization, product management, coupon calculations, order creation, Maya hosted checkout, successful payment processing, webhook event storage, payment reconciliation, AI recommendations, and OOP implementation.

The successful Maya payment test confirmed that the webhook automatically updates the payment status to paid and the order status to processing. The reconciliation endpoint also correctly recognizes an already processed payment.

Some tests, including duplicate webhook replay, invalid webhook signatures, failed payments, cancelled or expired payments, missed-webhook recovery, and inventory concurrency, have not yet been performed. These should be considered for further testing before final submission.