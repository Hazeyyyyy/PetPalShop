# PetPalShop
PetPalShop is a pet supplies e-commerce API that allows customers to browse pet products, manage their pets, add products to their cart, place orders, and make payments using Maya Checkout. And it also includes AI-powered product recommendations using Google Gemini.

## Features
- User registration and login
- JWT authentication and role-based access
- Product and category management
- Pet profile management
- Shopping cart management
- Order creation and tracking
- Coupon codes and discount validation
- Inventory and stock management
- Maya Checkout Sandbox integration
- Maya webhook signature verification
- Payment reconciliation
- AI-powered product recommendations
- API documentation using Swagger UI

## Technologies Used
- Node.js
- Express.js
- MySQL
- JWT
- bcryptjs
- Maya Checkout Sandbox
- Google Gemini API
- Swagger UI
- Render

## Installation
1. Clone the repository.

   ```bash
   git clone https://github.com/Hazeyyyyy/PetPalShop.git
   ```

2. Open the project folder.

   ```bash
   cd PetPalShop
   ```

3. Install dependencies.

   ```bash
   npm install
   ```

4. Create a `.env` file using `.env.example` as your guide.

5. Add your database credentials and API keys to `.env`.

6. Start the server.

   ```bash
   npm start
   ```

## API Documentation
After starting the server, open:
http://localhost:3000/api-docs

Production API:
https://petpalshopapi.onrender.com

## Environment Variables
The project requires the following environment variables:
- PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
- MAYA_PUBLIC_KEY
- MAYA_SECRET_KEY
- GEMINI_API_KEY

See `.env.example` for the required variable names.

## Third-Party Integrations

### Maya Checkout
used for sandbox payment processing and webhook notifications.

### Google Gemini
used to generate pet product recommendations based on available products in the database.