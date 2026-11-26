# PetPalShop System Architecture

## 1. System Overview
PetPalShop uses a client-server architecture. The backend is built with Node.js and Express.js, while MySQL stores the application's data. The backend handles authentication, products, categories, pets, shopping carts, orders, payments, and AI recommendations.

## 2. Architecture Diagram
```mermaid
flowchart TD
    A[Customer / Admin] --> B[Frontend Client]
    B --> C[Node.js and Express API]

    C --> D[Authentication Middleware]
    D --> E[API Routes]

    E --> F[User Routes]
    E --> G[Product and Category Routes]
    E --> H[Pet and Cart Routes]
    E --> I[Order Routes]
    E --> J[Payment Routes]
    E --> K[AI Recommendation Routes]

    F --> L[(MySQL Database)]
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L

    J --> M[Maya Checkout Sandbox]
    M --> N[Maya Webhook]
    N --> L

    K --> O[Google Gemini API]
```

## 3. Technology Stack
| Component | Technology |
|---|---|
| Backend | Node.js and Express.js |
| Database | MySQL |
| Authentication | JWT and bcryptjs |
| Payment Gateway | Maya Checkout Sandbox |
| AI Integration | Google Gemini API |
| API Documentation | Swagger UI and OpenAPI |
| Deployment | Render |
| Database Hosting | Railway |

## 4. Payment Checkout Sequence
The following diagram shows how a customer completes a payment using Maya Checkout.

```mermaid
sequenceDiagram
    actor Customer
    participant API as PetPalShop API
    participant DB as MySQL Database
    participant Maya as Maya Checkout
    participant Webhook as Maya Webhook

    Customer->>API: Request checkout
    API->>DB: Retrieve order
    DB-->>API: Return order details
    API->>Maya: Create checkout session
    Maya-->>API: Return checkout URL
    API-->>Customer: Return checkout URL
    Customer->>Maya: Complete payment
    Maya->>Webhook: Send payment notification
    Webhook->>Webhook: Verify signature and timestamp
    Webhook->>DB: Save webhook event
    Webhook->>DB: Update payment and order status
    Webhook-->>Maya: Return response
```

## 5. Missed Webhook Reconciliation
If the Maya webhook notification is not received, the customer or authorized user can request payment reconciliation.

```mermaid
sequenceDiagram
    actor Customer
    participant API as PetPalShop API
    participant Maya as Maya API
    participant DB as MySQL Database

    Customer->>API: Request payment reconciliation
    API->>DB: Retrieve payment information
    DB-->>API: Return payment reference
    API->>Maya: Retrieve payment status
    Maya-->>API: Return payment details
    API->>API: Validate amount and currency
    API->>DB: Lock and update payment
    API->>DB: Update order or restore stock
    API-->>Customer: Return reconciliation result
```

## 6. Security Measures
- Passwords are hashed using bcryptjs.
- JWT is used for authentication.
- Role-based middleware protects admin routes.
- SQL queries use parameterized statements.
- Helmet provides security headers.
- CORS controls cross-origin access.
- Rate limiting helps protect API endpoints.
- Maya webhook signatures and timestamps are verified.
- Environment variables protect sensitive credentials.