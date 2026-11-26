require('dotenv').config();

const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDatabase() {
    let connection;

    try {
        const sql = fs.readFileSync('./pet_supplies_db.sql', 'utf8');

        connection = await mysql.createConnection({
            host: process.env.RAILWAY_DB_HOST,
            port: Number(process.env.RAILWAY_DB_PORT),
            user: process.env.RAILWAY_DB_USER,
            password: process.env.RAILWAY_DB_PASSWORD,
            database: process.env.RAILWAY_DB_NAME,
            multipleStatements: true
        });

        console.log('Connected to Railway!');
        console.log('Importing database...');

        await connection.query(sql);

        console.log('Database imported successfully!');

    } catch (error) {
        console.log('Import failed:', error.message);

    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

importDatabase();