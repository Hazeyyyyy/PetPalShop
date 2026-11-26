const db = require('../config/database');

const getAvailableProducts = async () => {
    const [products] = await db.query(`
        SELECT
            products.product_id,
            products.product_name,
            products.description,
            products.price,
            products.stock,
            categories.category_name
        FROM products
        LEFT JOIN categories
        ON products.category_id = categories.category_id
        WHERE products.stock > 0
        ORDER BY products.product_name
        LIMIT 50
    `);

    return products;
};

module.exports = {
    getAvailableProducts
};