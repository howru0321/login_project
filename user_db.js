require('dotenv').config();

const mysql = require('mysql');
const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'node.js',
  password : process.env.MYSQL_PASSWORD,
  database : 'users'
});


async function fetchUser(email) {
  const insertQuery = 'SELECT * from usertable WHERE email = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [email], (error, rows, fields) => {
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

async function removeUser(email) {
  const insertQuery = 'DELETE from usertable WHERE email = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [email], (error, rows, fields) => {
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

async function update_username(email, username) {
  const insertQuery = 'UPDATE usertable SET username = ? WHERE email = ?';

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [username, email], (error, rows, fields) => {
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
async function update_password(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const insertQuery = 'UPDATE usertable SET password = ? WHERE email = ?';

  db.query(insertQuery, [hashedPassword, email], (error, rows, fields) => {
      if (error) {
          console.error('Error during query execution:', error);
          throw error;
      }
  });

  return new Promise((resolve, reject) => {
    db.query(insertQuery, [hashedPassword, email], (error, rows, fields) => {
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
  update_username,
  update_password
};