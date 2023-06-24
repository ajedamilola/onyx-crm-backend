//adding libraries and modules
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sharp = require("sharp");
require("dotenv").config();
var Imap = require('imap')
var { simpleParser } = require("mailparser")
const ejs = require("ejs")

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


async function sendMail(sender, recipient, subject, body) {
  const transporter = nodemailer.createTransport({
    host: process.env.MAILSERVER,
    // name:"",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: sender, // generated ethereal user
      pass: "coding2005*@", // generated ethereal password
    },
  });

  const mailOptions = {
    from: sender,
    to: recipient,
    subject,
    html: body
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err)
    }
    return err == null;
  })
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
const { User } = require("./database");


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

// async function sendMail(sender, recipient, title, message, signature = false, recipientName, template = "base") {
//   try {
//     const agent = await User.findOne({ email: sender });
//     const transporter = nodemailer.createTransport({
//       host: process.env.MAILSERVER,
//       // name:"",
//       port: 465,
//       secure: true, // true for 465, false for other ports
//       auth: {
//         user: sender, // generated ethereal user
//         pass: agent.mailPassword, // generated ethereal password
//       },
//     });

//     // transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));
//     const customFooter = `<hr />
//     &copy; ${new Date().getFullYear()} Telserve CRPMS By Aje Damilola`;
//     const today = new Date();
//     const date = today.toDateString();
//     let day = getDay(today.getDay())

//     //My Template Feature
//     // const content = message.replace(/\[name\]/g, recipientName || "").replace(/\[day\]/g, day).replace(/\[date\]/g, date);
//     ejs.renderFile(`${__dirname}/templates/email/${template}.ejs`, { content }, async (err, output) => {
//       if (!err) {
//        transporter.sendMail({
//           from: "Aje Damilola <damilola@telservenet.com>",
//           to: recipient,
//           subject: title,
//           html: output,
//         },(err,info)=>{
//           return console.log(info)
//         })
//       } else {
//         console.log(err)
//         return { err: true }
//       }
//     })

//   } catch (err) {
//     console.log("An Error Occured Here ", err);
//     return { err };
//   }
// }
const getInbox = (email, password, start = 0, end = 20) => new Promise((resolve, reject) => {
  const imap = new Imap({
    password,
    user: email,
    host: process.env.MAILSERVER,
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    }
  })

  imap.once("ready", () => {
    imap.openBox("INBOX", (err, box) => {
      if (!err) {
        const messages = [];
        imap.seq.search(["ALL"], (err, results) => {
          const limit = results.slice(start, end)
          const fetched = imap.fetch(limit, { bodies: '' })
          fetched.on("message", (msg, index) => {
            msg.on("body", (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                const from = parsed?.from?.text;
                const subject = parsed.subject;
                const content = parsed.textAsHtml;
                const date = parsed.date;
                messages.push({ from, date, subject, content })
              });
            })
          })

          fetched.once("end", () => {
            imap.end();
            resolve(messages)
          })
        });
      } else {
        resolve([])
      }
    })
  })

  imap.once("error", (err) => {
    resolve([])
  })

  imap.connect();
})



module.exports = {
  hashPassword,
  verifyPassword,
  encode64,
  sendMail,
  getDay,
  getInbox
};
