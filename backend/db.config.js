require('dotenv/config');
const { Pool } = require('pg');

const hasPostgresConfig = Boolean(
    process.env.DB_CONNECTION_STRING || process.env.DB_HOST || process.env.DB_NAME
);

let pgPool = null;

if (hasPostgresConfig) {
    pgPool = new Pool(
        process.env.DB_CONNECTION_STRING
            ? {
                connectionString: process.env.DB_CONNECTION_STRING,
                max: 10,
                idleTimeoutMillis: 60000
            }
            : {
                user: process.env.DB_USER || 'postgres',
                host: process.env.DB_HOST || 'localhost',
                database: process.env.DB_NAME || 'devrooms',
                password: process.env.DB_PASSWORD || '',
                port: Number(process.env.DB_PORT) || 5432,
                max: 10,
                idleTimeoutMillis: 60000
            }
    );
}

module.exports = {
    pgPool,
    hasPostgresConfig
};