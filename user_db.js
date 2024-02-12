require('dotenv').config();

const mysql = require('mysql');
const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'node.js',
  password : process.env.MYSQL_PASSWORD,
  database : 'users'
});


async function fetchUser(where, email) {
  const insertQuery = 'SELECT * from usertable WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [where, email], (error, rows, fields) => {
      if (error) {
        console.error('Error during query execution:', error);
        reject(error);
      }
      else {
        resolve(rows[0]);
      }
    });
  });
}

async function createUser(email, username, password, type) {
  const insertQuery = 'INSERT INTO usertable (email, username, password, type) VALUES (?, ?, ?, ?)';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [email, username, password, type], (error, rows, fields) => {
      if (error) {
        console.error('Error during query execution:', error);
        reject(error);
      }
      else {
        resolve();
      }
    });
  });
}

async function removeUser(where, email) {
  const insertQuery = 'DELETE from usertable WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [where, email], (error, rows, fields) => {
      if (error) {
          console.error('Error during query execution:', error);
          reject(error);
      }
      else {
        resolve();
      }
    });
  });
}

async function updateUser(where, email, username) {
  const insertQuery = 'UPDATE usertable SET username = ? WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [username, where, email], (error, rows, fields) => {
      if (error) {
          console.error('Error during query execution:', error);
          reject(error);
      }
      else{
        resolve();
      }
    });
  });
}


module.exports = {
  db,
  fetchUser,
  createUser,
  removeUser,
  updateUser
};