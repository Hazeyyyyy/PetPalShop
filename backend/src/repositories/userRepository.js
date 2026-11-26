const db = require('../config/database');

const getAll = async () => {
    const [users] = await db.query(
        `SELECT user_id, name, email, role, created_at
        FROM users`
    );

    return users;
};

const getByEmail = async (email) => {
    const [users] = await db.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
    );

    return users;
};

const create = async (name, email, passwordHash) => {
    const [result] = await db.query(
        `INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)`,
        [name, email, passwordHash]
    );

    return result;
};

module.exports = {
    getAll,
    getByEmail,
    create
};