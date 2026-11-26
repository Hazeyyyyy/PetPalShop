# PetPalShop Database Documentation

## Entity Relationship Diagram (ERD)
The following ERD shows the database tables, their primary keys, foreign keys, and relationships.

```mermaid
erDiagram
    USERS {
        int user_id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role
        timestamp created_at
    }

    CATEGORIES {
        int category_id PK
        varchar category_name UK
        text description
    }

    PRODUCTS {
        int product_id PK
        int category_id FK
        varchar product_name
        text description
        decimal price
        int stock
        varchar image_url
        timestamp created_at
    }

    PETS {
        int pet_id PK
        int user_id FK
        varchar pet_name
        varchar pet_type
        varchar breed
        int age
        varchar size
        timestamp created_at
    }

    CART {
        int cart_id PK
        int user_id FK
        timestamp created_at
    }

    CART_ITEMS {
        int cart_item_id PK
        int cart_id FK
        int product_id FK
        int quantity
    }

    COUPONS {
        int coupon_id PK
        varchar coupon_code UK
        enum discount_type
        decimal discount_value
        decimal minimum_order
        datetime expiry_date
        int usage_limit
        int times_used
        boolean is_active
        timestamp created_at
    }

    ORDERS {
        int order_id PK
        int user_id FK
        int coupon_id FK
        decimal total_amount
        decimal discount_amount
        enum order_status
        timestamp created_at
    }

    ORDER_ITEMS {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal price
    }

    PAYMENTS {
        int payment_id PK
        int order_id FK
        varchar payment_method
        varchar payment_reference
        varchar merchant_reference
        enum payment_status
        timestamp created_at
    }

    SUBSCRIPTIONS {
        int subscription_id PK
        int user_id FK
        int product_id FK
        int quantity
        enum frequency
        date next_order_date
        enum subscription_status
        timestamp created_at
    }

    WEBHOOK_EVENTS {
        int event_id PK
        varchar event_key UK
        varchar merchant_reference
        varchar event_type
        json event_payload
        enum processing_status
        timestamp received_at
        timestamp processed_at
    }

    USERS ||--o| CART : owns
    USERS ||--o{ PETS : has
    USERS ||--o{ ORDERS : places
    USERS ||--o{ SUBSCRIPTIONS : creates

    CATEGORIES ||--o{ PRODUCTS : contains

    CART ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : added_to

    COUPONS o|--o{ ORDERS : applied_to

    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in

    ORDERS ||--o{ PAYMENTS : has

    PRODUCTS ||--o{ SUBSCRIPTIONS : subscribed_to
```

## Database Description
PetPalShop uses a MySQL relational database to store customer accounts, pet information, products, shopping carts, orders, payments, coupons, subscriptions, and webhook events. The database uses primary keys to identify records and foreign keys to connect related tables.

## Main Relationships
- One user can have multiple pets, orders, and subscriptions.
- One user can have at most one cart.
- One category can contain multiple products.
- One cart can contain multiple cart items.
- One product can appear in multiple cart items and order items.
- One order can contain multiple order items and payment records.
- One coupon can be applied to multiple orders.
- Webhook events are stored separately to track Maya payment notifications and prevent duplicate processing.