const { text } = require("express");
const { Customer, User } = require("./database");
const { encode64 } = require("./functions");
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

  app.post("/newCustomer", (req, res) => {
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
        newCustomer.image = `data:${
          req.files.image.mimetype
        };base64,${encode64(req.files.image.data)}`;
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
      const { date, isSuccessful, isAnswered, customerId, isPending } =
        req.body;
      const { uid } = req.cookies;
      const user = await User.findById(uid);
      if (user) {
        const successful = Boolean(isSuccessful);
        const replied = Boolean(isAnswered);

        const pending = Boolean(isPending);
        const customer = await Customer.findById(customerId);
        const data = {
          date: new Date(date),
          successful,
          replied,
          pending,
        };
        customer.texts.push(data);
        customer.save();
        res.json(customer.texts[customer.texts.length - 1]);
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

  app.post("/email", async (req, res) => {
    try {
      const { message, recipient, subject, email } = req.body;
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
        };
        //actually send an email later with the "email" param
        customer.emails.push(data);
        customer.save();
        res.json(customer.emails[customer.emails.length - 1]);
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
          qty
        };
        customer.purchases.push(purchase);
        customer.save();
        res.json(customer.purchases[customer.purchases.length - 1]);
      } else {
        throw { message: "Unauthenticated Operation" };
      }
    } catch (e) {
      res.json({ err: e.message, msg: "An Error Occured" });
      console.log(e)
    }
  });
  //#endregion

  //#region Patching Stuff
  app.patch("/purchase", async (req, res) => {
    const { status, purchaseId, customerId } = req.body;
    const customer = await Customer.findById(customerId);
    customer.purchases.forEach((purchase) => {
      if (purchase._id == purchaseId) {
        const successful = status == "successful";
        purchase.pending = false;
        purchase.confirmed = successful;
        return res.json(purchase);
      }
    });
  });

  app.patch("/call", async (req, res) => {
    const { status, callId, customerId } = req.body;
    const customer = await Customer.findById(customerId);
    customer.calls.forEach((call) => {
      if (call._id == callId) {
        const successful = status == "successful";
        call.pending = false;
        call.successful = successful;
        return res.json(call);
      }
    });
  });

  app.patch("/email", async (req, res) => {
    const { status, emailId, customerId, replied } = req.body;
    const customer = await Customer.findById(customerId);
    customer.emails.forEach((email) => {
      if (email._id == emailId) {
        const successful = status == "successful";
        email.pending = false;
        email.successful = successful;
        email.replied = replied == "yes";
        return res.json(email);
      }
    });
  });

  app.patch("/text", async (req, res) => {
    const { status, textId, customerId, replied } = req.body;
    const customer = await Customer.findById(customerId);
    customer.texts.forEach((text) => {
      if (text._id == textId) {
        const successful = status == "successful";
        text.pending = false;
        text.successful = successful;
        text.replied = replied == "yes";
        return res.json(text);
      }
    });
  });

  app.patch("/customer", async (req, res) => {
    try {
      const { name, email, company, phone, id } = req.body;
      const customer = await Customer.findById(id);
      customer.name = name;
      customer.email = email;
      customer.company = company;
      customer.phone = phone;
      if(req.files && req.files.image){
        customer.image = `data:${
          req.files.image.mimetype
        };base64,${encode64(req.files.image.data)}`
      }
      customer.save()
      res.json({ msg: "Ok", customer });
    } catch (err) {
      res.json({ err: "Unable To Edit At This Time Try again later" });
      console.log(err)
    }
  });

  //#endregion
};

//the status of calls,emails,texts should be changed from pending to any
//pending purchases should be able to be changed from failed or successfull
