const db = require('../config/database');

const getAll = async () => {
    const [categories] = await db.query(
        'SELECT * FROM categories'
    );

    return categories;
};

const create = async (category_name, description) => {
    const [result] = await db.query(
        `INSERT INTO categories (category_name, description)
        VALUES (?, ?)`,
        [category_name, description]
    );

    return result;
};

const update = async (id, category_name, description) => {
    const [result] = await db.query(
        `UPDATE categories
        SET category_name = ?, description = ?
        WHERE category_id = ?`,
        [category_name, description, id]
    );

    return result;
};

const deleteById = async (id) => {
    const [result] = await db.query(
        'DELETE FROM categories WHERE category_id = ?',
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