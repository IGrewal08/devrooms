const pg = require('pg');
const Pool = pg.Pool;
const env = require('dotenv/config');

/**
 * Manage DB connections my limiting active users to 10, ideal users are kicked out of connection after 60 seconds.
 * Automatic opening and closing new connections
 */
export default new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 10,
  idleTimeoutMillis: 60000,
});
