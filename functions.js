//adding libraries and modules
const bcrypt = require("bcrypt");

async function hashPassword(password) {
  return new Promise((resolve) => {
    bcrypt.hash(password, 8, function (_err, hash) {
      resolve(hash);
    });
  });
}

async function verifyPassword(password, hash) {
  return new Promise((resolve) => {
    bcrypt.compare(password, hash, function (_err, result) {
      resolve(result);
    });
  });
}

function encode64(data){
  return Buffer.from(data).toString("base64");
}

module.exports = {
  hashPassword,
  verifyPassword,
  encode64
};
