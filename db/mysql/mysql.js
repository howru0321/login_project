require('dotenv').config();

const mysql = require('mysql');
const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'node.js',
  password : process.env.MYSQL_PASSWORD,
  database : 'users'
});


async function fetchUser(Column, Value) {
  const insertQuery = 'SELECT * from usertable WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [Column, Value], (error, rows, fields) => {
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

async function fetchUserColumns(ColumnsToSelect, Column, Value) {
  const insertQuery = 'SELECT ?? from usertable WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [ColumnsToSelect, Column, Value], (error, rows, fields) => {
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

async function removeUser(Column, Value) {
  const insertQuery = 'DELETE from usertable WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [Column, Value], (error, rows, fields) => {
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

async function updatePassword(Column, Value, username) {
  const insertQuery = 'UPDATE usertable SET password = ? WHERE ?? = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [username, Column, Value], (error, rows, fields) => {
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
  fetchUserColumns,
  createUser,
  removeUser,
  updatePassword
};