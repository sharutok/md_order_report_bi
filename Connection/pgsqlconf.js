const { Pool } = require('pg');

// Connection pool configuration
const poolConfig = {
    host: process.env.PROD_PG_HOST,
    database: process.env.PROD_PG_DATABASE,
    user: process.env.PROD_PG_USER,
    password: process.env.PROD_PG_PASSWORD,
    port: 5432,
    max: 10,
    idleTimeoutMillis: 30000
};

// Create a connection pool
const pool = new Pool(poolConfig);

// Function to execute queries
exports.pgConnect = async (query) => {
    let client;
    try {
        client = await pool.connect();
        const { rows } = await client.query(query);
        return rows
    } catch (err) {
        console.error('PG Query error:', err, query);
    } finally {
        if (client) {
            client.release();
        }
    }
}
