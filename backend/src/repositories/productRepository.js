const db = require('../config/database');

const getAll = async () => {
    const [products] = await db.query(`
        SELECT
            products.*,
            categories.category_name
        FROM products
        LEFT JOIN categories
        ON products.category_id = categories.category_id
    `);

    return products;
};

const create = async (
    category_id,
    product_name,
    description,
    price,
    stock
) => {
    const [result] = await db.query(
        `INSERT INTO products
        (category_id, product_name, description, price, stock)
        VALUES (?, ?, ?, ?, ?)`,
        [category_id, product_name, description, price, stock]
    );

    return result;
};

const update = async (
    id,
    product_name,
    description,
    price,
    stock,
    category_id
) => {
    const [result] = await db.query(
        `UPDATE products
        SET product_name = ?,
            description = ?,
            price = ?,
            stock = ?,
            category_id = ?
        WHERE product_id = ?`,
        [
            product_name,
            description,
            price,
            stock,
            category_id,
            id
        ]
    );

    return result;
};

const deleteById = async (id) => {
    const [result] = await db.query(
        'DELETE FROM products WHERE product_id = ?',
        [id]
    );

    return result;
};

module.exports = {
    getAll,
    create,
    update,
    deleteById
};