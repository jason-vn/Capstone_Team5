const mysql = require ('mysql');
const fs = require ('fs');
require ('dotenv').config ();

const ssl_ca = [fs.readFileSync ('ssl/ca-cert.pem', 'utf8')];
const ssl_key = [fs.readFileSync ('ssl/client-key.pem', 'utf8')];
const ssl_cert = [fs.readFileSync ('ssl/client-cert.pem', 'utf8')];

const pool = mysql.createPool ({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  multipleStatements: true,
  ssl: {
    ca: ssl_ca,
    cert: ssl_cert,
    key: ssl_key,
  },
});

pool.getConnection (function (err, connection) {
  if (err) {
    console.error (err); // Not connected!
  } else {
    // Use the connection
    console.log ('Database connection ' + connection.threadId + ' started...');
  }
});

pool.on ('release', function (connection) {
  console.log ('Connection %d released', connection.threadId);
});

module.exports = pool;
