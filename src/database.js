const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'taskmanager',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const initDB = async () => {
    const client = await pool.connect();
    try {
        // Таблица задач
        await client.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                                                 id SERIAL PRIMARY KEY,
                                                 title VARCHAR(255) NOT NULL,
                description TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
        `);

        // Таблица для пользователей из API
        await client.query(`
            CREATE TABLE IF NOT EXISTS external_users (
                                                          id SERIAL PRIMARY KEY,
                                                          uuid VARCHAR(100) UNIQUE,
                gender VARCHAR(10),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                email VARCHAR(255),
                phone VARCHAR(50),
                country VARCHAR(100),
                city VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
        `);

        console.log('Database initialized with external_users table');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        client.release();
    }
};

module.exports = { pool, initDB };