# Object-Oriented Programming (OOP) Documentation

## 1. Abstract Class

**File:** `services/BasePaymentProcessor.js`

The project uses an abstract class named `BasePaymentProcessor`.

It provides a common structure for payment processors. It also prevents the base class from being instantiated directly.

The class defines two methods:
- `createCheckout()`
- `getPaymentStatus()`

These methods throw errors when they are not implemented by a subclass.

## 2. Inheritance

**File:** `services/MayaPaymentProcessor.js`

The `MayaPaymentProcessor` class extends `BasePaymentProcessor`.

It inherits the structure and required methods from the base class.

It implements:
- `createCheckout()` to create a Maya hosted checkout session.
- `getPaymentStatus()` to retrieve payment information from Maya.

This allows the project to use Maya as its payment processor while following a common structure.

## 3. Composition

**File:** `services/PaymentService.js`

The `PaymentService` class uses composition by receiving a payment processor object through its constructor.

It stores the object in `this.paymentProcessor`.

It delegates payment operations to that object through:
- `createCheckout()`
- `getPaymentStatus()`

This allows the payment service to work with a processor without directly handling the payment gateway requests.

## 4. How the Classes Work Together

The classes work together as follows:

1. `BasePaymentProcessor` defines the required payment methods.
2. `MayaPaymentProcessor` inherits from the base class and implements those methods.
3. `PaymentService` receives a `MayaPaymentProcessor` object and uses it to perform payment operations.
4. `routes/paymentRoutes.js` uses `PaymentService` for checkout creation and payment status retrieval.

## 5. Benefits

- **Abstraction:** Provides a common structure for payment processors.
- **Inheritance:** Allows the Maya processor to reuse the base class structure.
- **Composition:** Separates payment operations from the payment service.
- **Maintainability:** Makes it easier to add another payment processor in the future.

## Summary

PetPalShop demonstrates abstraction, inheritance, and composition through its payment processing system. These OOP concepts help make the payment code more organized, reusable, and easier to maintain.