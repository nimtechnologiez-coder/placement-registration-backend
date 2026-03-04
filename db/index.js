const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const initDb = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS placement_students (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      college_name VARCHAR(255) NOT NULL,
      college_type VARCHAR(50) NOT NULL,
      department VARCHAR(100) NOT NULL,
      year_of_passing VARCHAR(10) NOT NULL,
      skills TEXT,
      resume_path VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await pool.query(queryText);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    initDb,
};
