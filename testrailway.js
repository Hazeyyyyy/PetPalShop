require('dotenv').config();

const mysql = require('mysql2/promise');

async function checkDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.RAILWAY_DB_HOST,
            port: Number(process.env.RAILWAY_DB_PORT),
            user: process.env.RAILWAY_DB_USER,
            password: process.env.RAILWAY_DB_PASSWORD,
            database: process.env.RAILWAY_DB_NAME
        });

        const [tables] = await connection.query('SHOW TABLES');

        console.log('PetPalShop Railway Tables:');
        tables.forEach(table => {
            console.log(Object.values(table)[0]);
        });

    } catch (error) {
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkDatabase();