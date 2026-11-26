const db = require('../config/database');

const getAll = async () => {
    const [pets] = await db.query(`
        SELECT pets.*, users.name AS owner_name
        FROM pets
        JOIN users ON pets.user_id = users.user_id
    `);

    return pets;
};

const getByUserId = async (user_id) => {
    const [pets] = await db.query(`
        SELECT pets.*, users.name AS owner_name
        FROM pets
        JOIN users ON pets.user_id = users.user_id
        WHERE pets.user_id = ?
    `, [user_id]);

    return pets;
};

const create = async (user_id, pet_name, pet_type, breed, age, size) => {
    const [result] = await db.query(
        `INSERT INTO pets
        (user_id, pet_name, pet_type, breed, age, size)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, pet_name, pet_type, breed, age, size]
    );

    return result;
};

const update = async (
    id,
    pet_name,
    pet_type,
    breed,
    age,
    size,
    user_id,
    isAdmin
) => {
    let sql = `
        UPDATE pets
        SET pet_name = ?, pet_type = ?, breed = ?, age = ?, size = ?
        WHERE pet_id = ?
    `;

    let values = [
        pet_name,
        pet_type,
        breed,
        age,
        size,
        id
    ];

    if (!isAdmin) {
        sql += ' AND user_id = ?';
        values.push(user_id);
    }

    const [result] = await db.query(sql, values);

    return result;
};

const deleteById = async (id, user_id, isAdmin) => {
    let sql = 'DELETE FROM pets WHERE pet_id = ?';
    let values = [id];

    if (!isAdmin) {
        sql += ' AND user_id = ?';
        values.push(user_id);
    }

    const [result] = await db.query(sql, values);

    return result;
};

module.exports = {
    getAll,
    getByUserId,
    create,
    update,
    deleteById
};