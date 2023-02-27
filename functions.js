//adding libraries and modules
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sharp = require("sharp");
require("dotenv").config();

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

async function encode64(data, large = false, jpeg = false) {
  try {
    const buffer = Buffer.from(data);
    const output = !jpeg
      ? await sharp(buffer)
        .resize({
          width: large ? 1000 : 80,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 90 })
        .toBuffer()
      : await sharp(buffer)
        .resize({
          width: large ? 1000 : 80,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 70 })
        .toBuffer();
    return output.toString("base64");
  } catch (err) {
    console.log(err);
    return "";
  }
}

var inlineBase64 = require("nodemailer-plugin-inline-base64");
const transporter = nodemailer.createTransport({
  host: "mail.telservenet.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "info@telservenet.com", // generated ethereal user
    pass: process.env.SMTPPASSWORD, // generated ethereal password
  },
});

transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));

function getDay(index) {
  switch (index) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
  }
}

async function sendMail(sender, recipient, title, message, signature = false, recipientName) {
  try {
    const customFooter = `<hr />
    &copy; ${new Date().getFullYear()} Telserve CRPMS By Aje Damilola`;
    const today = new Date();
    const date = today.toDateString();
    let day = getDay(today.getDay())

    //My Template Feature
    const output = message.replace(/\[name\]/g, recipientName || "").replace(/\[day\]/g, day).replace(/\[date\]/g, date);
    console.log(output)
    await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: title,
      html: `${output} ${signature
          ? `<img src="${signature}" style='width:100%;height:auto'/>`
          : ""
        } ${customFooter}`,
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
  getDay
};
