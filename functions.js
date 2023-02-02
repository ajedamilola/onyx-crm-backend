//adding libraries and modules
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sharp = require("sharp");

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

async function encode64(data, large = false) {
  try {
    const buffer = Buffer.from(data);
    const output = await sharp(buffer)
      .resize({ width: large ? 1000 : 80, fit: "inside",withoutEnlargement:true })
      .webp({ quality: 90 })
      .toBuffer();
    return output.toString("base64");
  } catch (err) {
    console.log(err);
    return "";
  }
}

var inlineBase64 = require("nodemailer-plugin-inline-base64");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ajedamilola2005@gmail.com",
    pass: "utrsgwdslzwxdlnz",
  },
});

transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));

async function sendMail(sender, recipient, title, message, signature=false) {
  try {
    const customFooter = `<hr />
    &copy; ${new Date().getFullYear()} Telserve CRPMS By Aje Damilola`;
    await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: title,
      html: `${message} ${signature &&  `<img src='${signature}' style='width:100%'/>`} ${customFooter}`,
    });
    return { err: false };
  } catch (err) {
    console.log("An Error Occured Here ", err);
    return { err };
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  encode64,
  sendMail,
};
