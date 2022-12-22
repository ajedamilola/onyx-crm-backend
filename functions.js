//adding libraries and modules
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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

function encode64(data) {
  return Buffer.from(data).toString("base64");
}

async function sendMail(sender, recipient, title, message, account) {
  try {
    const customFooter = "";
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: account.user, // generated ethereal user
        pass: account.pass, // generated ethereal password
      },
    });
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: title,
      html: message + customFooter,
    });
    console.log(nodemailer.getTestMessageUrl(info))
    return {err:false}
  } catch (err) {
    console.log(err);
    return {err}
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  encode64,
  sendMail
};
