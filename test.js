// const { sendMail } = require("./functions");
// (async ()=>{
//     const d = await sendMail("damilola@circuitcity.com.ng","ajedamilola2005@gmail.com","Welcome","We Welcome you to m=our platform")
// })()

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.telservenet.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: 'damilola@telservenet.com',
    pass: 'workohh2023@'
  }
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Aje Damilola" <damilola@telservenet.com>', // sender address
    to: "ajedamilola2005@gmail.com, damilola@telservenet.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
}

main().catch(console.error);