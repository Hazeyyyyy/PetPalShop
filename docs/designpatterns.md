# Design Patterns Documentation

## 1. MVC (Model-View-Controller) - Inspired Architecture
**Purpose:**

The project uses an MVC-inspired architecture to organize the application into different responsibilities.

**Implementation:**

- **Model:** MySQL database stores and manages application data.
- **View:** The frontend is responsible for displaying information to users.
- **Controller:** Express route handlers process requests, perform operations, and return responses.

**File References:**
- `routes/productRoutes.js`
- `routes/orderRoutes.js`
- `routes/paymentRoutes.js`
- `config/database.js`

**How It Works:**

When a user sends a request, the Express route handles the request, communicates with the MySQL database, and returns the result to the client.

**Trade-offs:**

This approach makes the application easier to organize. However, some route handlers contain both request-handling and database logic instead of using separate controller and model files.

## 2. Singleton Pattern - Database Connection Pool

**Purpose:**

The Singleton pattern helps ensure that the application reuses one shared database connection pool instead of creating a new pool every time a route needs database access.

**Implementation:**

File: `config/database.js`

The application creates a MySQL connection pool using `mysql.createPool()` and exports it through `module.exports`.

Node.js CommonJS module caching allows other files that require this module to reuse the same exported database pool.

**How It Works:**

Routes such as `productRoutes.js`, `orderRoutes.js`, and `paymentRoutes.js` import the shared database pool.

**Trade-offs:**

Reusing one pool helps manage database connections efficiently. However, the pool must be configured properly to handle the application's database workload.

## 3. Chain of Responsibility Pattern - Authentication Middleware

**Purpose:**

The Chain of Responsibility pattern allows a request to pass through a series of handlers. Each handler checks something before allowing the request to continue.

**Implementation:**

File: `middleware/authMiddleware.js`

The project uses:
- `authenticateToken` to verify the user's JWT.
- `authorizeRole` to check whether the user has the required role.

**How It Works:**

A protected request first passes through authentication. If the token is valid, the request continues using `next()`. Role authorization can then check whether the user has permission to access the requested resource.

**Trade-offs:**

This approach makes security checks reusable across different routes. However, middleware must be applied in the correct order to protect resources properly.

## Summary

The PetPalShop API uses an MVC-inspired architecture, a Singleton-style shared database connection pool, and Chain of Responsibility through Express middleware. These patterns help organize the application, reuse database connections, and manage authentication and authorization.