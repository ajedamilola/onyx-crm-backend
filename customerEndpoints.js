const { text } = require("express");
const { Customer, User } = require("./database");
const { encode64, sendMail } = require("./functions");
const nodemailer = require("nodemailer");
module.exports = (app) => {
  const plans = [
    {
      name: "Home Lite",
      amount: 14420,
    },
    {
      name: "Home Smart",
      amount: 20200,
    },
    {
      name: "Home Premium",
      amount: 65000,
    },
  ];

  app.post("/newCustomer", async (req, res) => {
    try {
      const { uid } = req.cookies;
      const { email, phone, name, purchaseAmount, company, payment, product } =
        req.body;

      const newCustomer = new Customer({
        name,
        email,
        phone,
        handler: uid,
        purchases: [
          {
            amount: purchaseAmount,
            product,
            pending: payment != "done",
            confirmed: payment == "done",
            date: new Date(),
          },
        ],
        company,
      });

      if (req.files && req.files.image) {
        newCustomer.image = "data:image/webp;base64,"+await encode64(req.files.image.data)
      }
      newCustomer.save();
      res.json({
        err: false,
        customer: newCustomer,
      });
    } catch (err) {
      console.log(err);
      res.json({ err: "An Error Ocurred" });
    }
  });

  //#region adding Stuff
  app.post("/call", async (req, res) => {
    try {
      const { date, isSuccessful, customerId, title, description } = req.body;
      const { uid } = req.cookies;
      const user = await User.findById(uid);
      if (user) {
        const successful = Boolean(isSuccessful);
        const replied = true;
        const customer = await Customer.findById(customerId);
        const data = {
          date: new Date(date),
          successful,
          replied,
          title,
          description,
        };
        customer.calls.push(data);
        customer.save();
        res.json(customer.calls[customer.calls.length - 1]);
      } else {
        throw { message: "UnAuthenticated Requests" };
      }
    } catch (err) {
      res.json({
        err: err.message,
        msg: "An Error Occured",
      });
    }
  });

  app.post("/text", async (req, res) => {
    try {
      const { customerId, title, description } = req.body;
      const { uid } = req.cookies;
      const user = await User.findById(uid);
      if (user) {
        const customer = await Customer.findById(customerId);
        const data = {
          date: new Date(),
          successful: false,
          pending: true,
          title,
          description,
        };
        customer.texts.push(data);
        res.json(customer.texts[customer.texts.length - 1]);
        customer.save();
      } else {
        throw { message: "UnAuthenticated Requests" };
      }
    } catch (err) {
      res.json({
        err: err.message,
        msg: "An Error Occured",
      });
      console.log(err);
    }
  });

  app.post("/email", async (req, res) => {
    try {
      const { message, recipient, subject, interval, intervalDate } = req.body;
      const { uid } = req.cookies;
      const user = await User.findById(uid);
      if (user) {
        const successful = false;
        const replied = false;
        const pending = true;
        const customer = await Customer.findById(recipient);
        const data = {
          date: new Date(),
          successful,
          replied,
          pending,
          title: subject,
          description: message,
          interval: interval || "Once",
          intervalDate: intervalDate,
          isActive: true,
        };
        //actually send an email later with the "email" param
        let testAccount = await nodemailer.createTestAccount();
        try {
          console.log(testAccount);
          const { err } = await sendMail(
            `"${user.name}" <${user.email}>`,
            `<${customer.email}>`,
            subject,
            message,
            testAccount
          );
          if (!err) {
            customer.emails.push(data);
            customer.save();
            res.json(customer.emails[customer.emails.length - 1]);
          } else {
            res.json({
              err: "Unable To Send Emails At the moment. try again later",
            });
          }
        } catch (err) {
          res.send({ err: "Unable To Send Mail Try again later" });
        }
      } else {
        throw { message: "UnAuthenticated Requests" };
      }
    } catch (err) {
      console.log(err);
      res.json({
        err: "An Error Occured. Try Again later",
        msg: "An Error Occured",
      });
    }
  });

  app.post("/purchase", async (req, res) => {
    try {
      const { uid } = req.cookies;
      const { product, customerId, amount, confirmed, date, qty } = req.body;
      const user = await User.findById(uid);
      if (user) {
        const customer = await Customer.findById(customerId);
        const purchase = {
          amount: Number(amount),
          pending: !confirmed,
          confirmed: confirmed,
          date,
          product,
          qty,
        };
        customer.purchases.push(purchase);
        customer.save();
        res.json(customer.purchases[customer.purchases.length - 1]);
      } else {
        throw { message: "Unauthenticated Operation" };
      }
    } catch (e) {
      res.json({ err: e.message, msg: "An Error Occured" });
      console.log(e);
    }
  });
  //#endregion

  //#region Patching Stuff
  app.patch("/purchase", async (req, res) => {
    if (req.cookies.uid) {
      try {
        const { pending, successful, purchaseId, customerId } = req.body;
        const customer = await Customer.findById(customerId);
        customer.purchases.forEach((purchase) => {
          if (purchase._id == purchaseId) {
            purchase.pending = pending;
            purchase.confirmed = successful;
            return res.json({ purchase });
          }
        });
      } catch (err) {
        res.json({ err: "Database Error Try again later" });
        console.log(err);
      }
    } else {
      res.json({ err: "Unauthenticated Request" });
    }
  });

  app.delete("/purchase", async (req, res) => {
    if (req.cookies.uid) {
      try {
        const priv = (await User.findById(req.cookies.uid)).privilage;
        const customer = await Customer.findById(req.headers.customer);
        if (priv > 1) {
          customer.purchases = customer.purchases.filter(
            (p) => p.id !== req.headers.purchase
          );
        } else {
          customer.purchases.forEach((purchase) => {
            if (purchase.id == req.headers.purchase) {
              purchase.pendingDelete = true;
            }
          });
        }
        customer.save();
        res.json({ msg: "Ok" });
      } catch (err) {
        console.log(err);
        res.json({ err: "Databse Error Try again later" });
      }
    } else {
      res.json({ err: "Unauthenticated Request" });
    }
  });

  app.patch("/call", async (req, res) => {
    const { status, callId, customerId } = req.body;
    try {
      if (req.cookies.uid) {
        const customer = await Customer.findById(customerId);
        customer.calls.forEach((call) => {
          if (call.id == callId) {
            const successful = status == "successful";
            call.pending = false;
            call.successful = successful;
            return res.json(call);
          }
        });
        customer.save();
      } else {
        res.json({ err: "Unathenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Database Error Try Again later" });
    }
  });

  app.patch("/text", async (req, res) => {
    const { status, textId, customerId } = req.body;
    try {
      if (req.cookies.uid) {
        const customer = await Customer.findById(customerId);
        customer.texts.forEach((text) => {
          if (text._id == textId) {
            const successful = status == "successful";
            text.pending = false;
            text.successful = successful;
            return res.json(text);
          }
        });
        customer.save();
      } else {
        res.json({ err: "Unathenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Database Error Try Again later" });
    }
  });

  app.delete("/text", async (req, res) => {
    const { uid } = req.cookies;
    try {
      if (uid) {
        const user = await User.findById(uid);
        const { id } = req.headers;
        const customer = await Customer.findById(req.headers.customer);
        if (user.privilage > 1) {
          customer.texts = customer.texts.filter((t) => t._id != id);
        } else {
          customer.texts.forEach((text) => {
            if (text.id == id) {
              text.pendingDelete = true;
            }
          });
        }
        customer.save();
        res.json({ msg: "Ok" });
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Unable To Delete At This Time Try again  later" });
    }
  });

  app.delete("/call", async (req, res) => {
    const { uid } = req.cookies;
    try {
      if (uid) {
        const user = await User.findById(uid);
        const { id } = req.headers;
        const customer = await Customer.findById(req.headers.customer);
        if (user.privilage > 1) {
          customer.calls = customer.calls.filter((t) => t._id != id);
        } else {
          customer.calls.forEach((call) => {
            if (call.id == id) {
              call.pendingDelete = true;
            }
          });
        }
        customer.save();
        res.json({ msg: "Ok" });
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Unable To Delete At This Time Try again  later" });
    }
  });

  app.delete("/email", async (req, res) => {
    const { uid } = req.cookies;
    try {
      if (uid) {
        const user = await User.findById(uid);
        const { id } = req.headers;
        const customer = await Customer.findById(req.headers.customer);
        if (user.privilage > 1) {
          customer.emails = customer.emails.filter((t) => t._id != id);
        } else {
          customer.emails.forEach((email) => {
            if (email.id == id) {
              email.pendingDelete = true;
            }
          });
        }
        customer.save();
        res.json({ msg: "Ok" });
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Unable To Delete At This Time Try again  later" });
    }
  });

  app.patch("/email", async (req, res) => {
    const { status, textId, customerId } = req.body;
    console.log(textId);
    try {
      if (req.cookies.uid) {
        const customer = await Customer.findById(customerId);
        customer.emails.forEach((email) => {
          if (email._id == textId) {
            const successful = status == "successful";
            email.pending = false;
            email.successful = successful;
            return res.json(email);
          }
        });
        customer.save();
      } else {
        res.json({ err: "Unathenticated Request" });
      }
    } catch (err) {
      console.log(err);
      res.json({ err: "Database Error Try Again later" });
    }
  });

  app.patch("/customer", async (req, res) => {
    try {
      const { name, email, company, phone, id } = req.body;
      const customer = await Customer.findById(id);
      customer.name = name;
      customer.email = email;
      customer.company = company;
      customer.phone = phone;
      if (req.files && req.files.image) {
        customer.image = "data:image/webp;base64,"+await encode64(req.files.image.data)
        
      }
      customer.save();
      res.json({ msg: "Ok", customer });
    } catch (err) {
      res.json({ err: "Unable To Edit At This Time Try again later" });
      console.log(err);
    }
  });

  app.post("/assignToAgent", async (req, res) => {
    try {
      if (req.cookies.uid) {
        const { customerId, agent } = req.body;
        const customer = await Customer.findById(customerId);
        customer.handler = agent;
        customer.save();
        return res.json({ msg: "Ok" });
      } else {
        return res.json({ err: "Unathenticated Request" });
      }
    } catch (err) {
      console.log(err);
      return res.json({ err: "Databse Error Try again later" });
    }
  });

  app.post("/setIntervalMessage", async (req, res) => {
    try {
      const { isActive, id } = req.body;
      const customer = await Customer.findById(req.body.customer);
      customer.emails.forEach((mail) => {
        if (mail._id == id) {
          mail.isActive = isActive;
          return res.json({ email: mail });
        }
      });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error Try again later" });
    }
  });

  app.delete("/customer", async (req, res) => {
    try {
      if (req.cookies.uid) {
        const user = await User.findById(req.cookies.uid);
        if (user.privilage > 1) {
          await Customer.findByIdAndDelete(req.headers.customer);
          res.json({ msg: "Ok" });
        } else {
          res.json({
            err: "You Do not have the appropriate privilage to complete this action",
          });
        }
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      res.json({err:"An Error Occured Try again later"});
    }
  });

  //#endregion
};

//the status of calls,emails,texts should be changed from pending to any
