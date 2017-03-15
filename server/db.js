const db = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'trusto',
    port: '5432',
    database: 'statcast'
  }
});

module.exports = {
  db
};
