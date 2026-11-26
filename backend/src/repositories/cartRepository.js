const db = require('../config/database');

const getByUserId = async (user_id) => {
    const [carts] = await db.query(
        'SELECT * FROM cart WHERE user_id = ?',
        [user_id]
    );

    return carts;
};

const getItems = async (cart_id) => {
    const [items] = await db.query(`
        SELECT
            cart_items.cart_item_id,
            cart_items.product_id,
            products.product_name,
            products.price,
            cart_items.quantity,
            (products.price * cart_items.quantity) AS subtotal
        FROM cart_items
        JOIN products
        ON cart_items.product_id = products.product_id
        WHERE cart_items.cart_id = ?
    `, [cart_id]);

    return items;
};

const getProductById = async (product_id) => {
    const [products] = await db.query(
        'SELECT * FROM products WHERE product_id = ?',
        [product_id]
    );

    return products;
};

const createCart = async (user_id) => {
    const [result] = await db.query(
        'INSERT INTO cart (user_id) VALUES (?)',
        [user_id]
    );

    return result;
};

const getCartItem = async (cart_id, product_id) => {
    const [items] = await db.query(
        `SELECT * FROM cart_items
        WHERE cart_id = ? AND product_id = ?`,
        [cart_id, product_id]
    );

    return items;
};

const updateCartItemQuantity = async (quantity, cart_item_id) => {
    const [result] = await db.query(
        `UPDATE cart_items
        SET quantity = ?
        WHERE cart_item_id = ?`,
        [quantity, cart_item_id]
    );

    return result;
};

const createCartItem = async (cart_id, product_id, quantity) => {
    const [result] = await db.query(
        `INSERT INTO cart_items
        (cart_id, product_id, quantity)
        VALUES (?, ?, ?)`,
        [cart_id, product_id, quantity]
    );

    return result;
};

const getCartItemWithStock = async (cart_item_id, user_id) => {
    const [items] = await db.query(`
        SELECT cart_items.*, products.stock
        FROM cart_items
        JOIN cart ON cart_items.cart_id = cart.cart_id
        JOIN products ON cart_items.product_id = products.product_id
        WHERE cart_items.cart_item_id = ?
        AND cart.user_id = ?
    `, [cart_item_id, user_id]);

    return items;
};

const deleteCartItem = async (cart_item_id, user_id) => {
    const [result] = await db.query(`
        DELETE cart_items FROM cart_items
        JOIN cart ON cart_items.cart_id = cart.cart_id
        WHERE cart_items.cart_item_id = ?
        AND cart.user_id = ?
    `, [cart_item_id, user_id]);

    return result;
};

module.exports = {
    getByUserId,
    getItems,
    getProductById,
    createCart,
    getCartItem,
    updateCartItemQuantity,
    createCartItem,
    getCartItemWithStock,
    deleteCartItem
};