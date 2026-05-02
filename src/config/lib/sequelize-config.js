const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const username = String(process.env.DB_USER || '');
const password = String(process.env.DB_PASSWORD || '');
const database = String(process.env.DB_NAME || '');
const host = String(process.env.DB_HOST || '127.0.0.1');
const port = Number(process.env.DB_PORT || 5432);

module.exports = {
  development: { username, password, database, host, port, dialect: 'postgres' },
  test: { username, password, database: `${database}_test`, host, port, dialect: 'postgres' },
  production: { username, password, database, host, port, dialect: 'postgres' },
};
