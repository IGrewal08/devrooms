import { Pool } from 'pg';
import 'dotenv/config';

/**
 * Manage DB connections my limiting active users to 10, ideal users are kicked out of connection after 60 seconds.
 * Automatic opening and closing new connections
 */
export default new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'devrooms',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 60000,
});
