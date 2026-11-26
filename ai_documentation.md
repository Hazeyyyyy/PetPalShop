# AI Feature Documentation

## 1. Overview

PetPalShop uses the Google Gemini API to provide AI-powered product recommendations. The feature helps customers find suitable pet supplies based on their questions or needs.

## 2. Technology Used

- **AI Provider:** Google Gemini
- **Model:** `gemini-3.1-flash-lite`
- **Library:** `@google/genai`
- **Backend:** Node.js and Express
- **Database:** MySQL

## 3. Implementation

**File:** `routes/aiRoutes.js`

The AI recommendation feature is available through:

`POST /api/ai/recommendations`

The endpoint accepts a customer's question and uses the Gemini API to generate recommendations.

Before sending information to Gemini, the backend retrieves available products from the MySQL database.

Only products with available stock are included.

The product information includes:
- Product name
- Price
- Available stock
- Category

## 4. How It Works

1. The customer sends a question to the AI recommendation endpoint.
2. The backend retrieves available products from MySQL.
3. The backend sends the customer's question and actual product information to Gemini.
4. Gemini generates recommendations based on the supplied product information.
5. The API returns the recommendation to the customer.

## 5. AI Accuracy and Limitations

The system instructs Gemini to recommend only products found in the supplied database information.

This helps prevent the AI from recommending products that are not available in the store.

However, AI-generated recommendations may not always be perfect. Customers should still check product details before purchasing.

## 6. API Security

The Gemini API key is stored in an environment variable named `GEMINI_API_KEY`.

The key is not included directly in the source code or exposed in API responses.

## 7. Testing

The AI recommendation endpoint was tested using actual product information from the MySQL database.

The feature successfully generated product recommendations and recognized when a requested product type was not available in the database.

## Summary

The Gemini AI feature makes PetPalShop more interactive by helping customers discover available pet supplies using natural-language questions. It uses real database information to make its recommendations more relevant.