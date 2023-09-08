const { Customer, User, Transfer, Order, api, Product, Info } = require("./database");
const { encode64, sendMail, generatePDF } = require("./functions");
const nodemailer = require("nodemailer");
const random = require("randomstring")
const { ToWords } = require("to-words")
const ejs = require("ejs")
const pth = require("path")

const toWords = new ToWords({
  localeCode: 'en-NG',
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: { // can be used to override defaults for the selected locale
      name: 'Naira',
      plural: 'Naira',
      symbol: '₦',
      fractionalUnit: {
        name: 'Kobo',
        plural: 'Kobo',
        symbol: 'K',
      },
    }
  }
})

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

  app.get("/test/:name", (req, res) => {
    sendMail("damilola@circuitcity.com.ng", req.params.name, "Hello", "THis is a test");
    res.send("Ok")
  })

  app.post("/newCustomer", async (req, res) => {
    const { uid } = req.cookies;
    const {
      email,
      phone,
      name,
      company,
      date,
      address
    } = req.body;
    try {
      const newCustomer = new Customer({
        name,
        email,
        phone,
        address,
        handler: uid,
        invitor: uid,
        company,
      });

      if (req.files && req.files.image) {
        newCustomer.image =
          "data:image/webp;base64," + (await encode64(req.files.image.data));
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
        user.reports.push({ content: `Sent SMS with title:<b>${title}</b> to customer named <b>${customer.name}</b> with id <b>${customer.code}</b>` })
        user.save()
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
        if (interval == "Once") {
          try {
            const { err } = await sendMail(
              `"${user.name}" <${user.email}>`,
              `<${customer.email}>`,
              subject,
              message,
              user.signature,
              customer.name
            );
            user.reports.push({ content: `Sent Email with subject:<b>${subject}</b> to customer named <b>${customer.name}</b> with id <b>${customer.code}</b>` })
            customer.emails.push(data);
            customer.save();
            user.save();
            res.json(customer.emails[customer.emails.length - 1]);
          } catch (err) {
            res.send({ err: "Unable To Send Mail Try again later" });
          }
        } else {
          customer.emails.push(data);
          user.reports.push({ content: `Scheduled Email ${interval} with subject:<b>${subject}</b> to customer named <b>${customer.name}</b> with id <b>${customer.code}</b>` })
          user.save();
          customer.save();
          res.json(customer.emails[customer.emails.length - 1]);
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
      const { cart, customerId, amount, } = req.body;
      const user = await User.findById(uid);
      if (user) {
        const customer = await Customer.findById(customerId);
        const purchase = {
          amount: Number(amount),
          pending: true,
          confirmed: false,
          date,
          items: cart,
          date: new Date()
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

  app.post("/customer/task", async (req, res) => {
    const { title, description, compulsory, customerId, agent, needPayment } = req.body;
    try {
      const customer = await Customer.findById(customerId);
      const Agent = await User.findById(agent);
      const Admin = await User.findById(req.cookies.uid);
      customer.tasks.push({
        title,
        description,
        compulsory,
        completed: false,
        agent,
        requestComplete: false,
        needPayment,
        admin: req.cookies.uid,
        handler: agent
      });

      customer.save();
      res.json({ task: customer.tasks[customer.tasks.length - 1], err: false });
      await sendMail(
        Admin.email,
        Agent.email,
        `New Task For Customer ${customer.name}`,
        `<h3>Title</h3><p>${title}</p><h3>Details: </h3><p>${description}</p>${compulsory && "<p style='color:red'>This Task Has Been Flagged Compulsory</p>"
        }
        <br /><br /><br />
       
        `,
        Admin.signature
      );
    } catch (err) {
      res.json({ err: "Database Error try again later" });
      console.log(err);
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
            customer.save();
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

  app.patch("/agent/declineDeletePurchase", async (req, res) => {
    if (req.cookies.uid) {
      try {
        const customer = await Customer.findById(req.body.customer);

        customer.purchases.forEach((purchase) => {
          if (purchase.id == req.body.purchase) {
            purchase.pendingDelete = false;
          }
        });

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
            res.json(email);
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
      const { name, email, company, phone, id, active, address, setUpCost, area, engineer } = req.body;
      const customer = await Customer.findById(id);
      customer.name = name;
      customer.email = email;
      customer.company = company;
      customer.phone = phone;
      customer.engineer = engineer;
      customer.address = address;
      customer.setUpCost = setUpCost;
      customer.area = area.toUpperCase() || customer.area
      customer.active = Boolean(active == "true");
      const isWoo = Boolean(customer.wid);
      if (req.files && req.files.image) {
        customer.image =
          "data:image/webp;base64," + (await encode64(req.files.image.data));
      }
      if (isWoo) {
        try {
          const data = {
            first_name: name.split(" ")[0], last_name: name.split(" ")[1] || "", email, avatar_url: customer.image, phone
          }
          // console.log(`customer/${customer.wid}`)
          await api.put(`customers/${customer.wid}`, data)
        } catch (error) {
          console.log(error)
          console.log("Unable To Sync Customer with woo")
        }
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
        const user = await User.findById(agent)
        user.reports.push({ content: `Customer ${customer.name} with Id <b class='copy'>${customer.code}</b> Was Assigned To Agent` })
        user.save()
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

  app.post("/assignToEngineer", async (req, res) => {
    try {
      if (req.cookies.uid) {
        const { customerId, agent } = req.body;
        const customer = await Customer.findById(customerId);
        customer.engineer = agent;
        const user = await User.findById(agent)
        user.reports.push({ content: `Customer ${customer.name} with Id <b class='copy'>${customer.code}</b> Was Assigned To An Engineer` })
        user.save()
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
      customer.save();
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
      res.json({ err: "An Error Occured Try again later" });
    }
  });

  //TODO: Add Reports to these
  app.patch("/customer/task/complete", async (req, res) => {
    const { customerid, taskid } = req.body;
    try {
      const customer = await Customer.findById(customerid);
      var t = {};
      customer.tasks.forEach((task) => {
        if (task._id == taskid) {
          task.completed = true;
          t = task;
        }
      });
      customer.save();
      res.json({ task: t });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error Try again later" });
    }
  });


  app.patch("/customer/task/fail", async (req, res) => {
    const { customerid, taskid } = req.body;
    try {
      const customer = await Customer.findById(customerid);
      var t = {};
      customer.tasks.forEach((task) => {
        if (task._id == taskid) {
          task.completed = false;
          t = task;
        }
      });
      customer.save();
      res.json({ task: t });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error Try again later" });
    }
  });

  app.post("/customer/task/comment", async (req, res) => {
    const { customerid, taskid, admin, content, sender } = req.body;
    const { uid } = req.cookies
    if (uid) {
      try {
        const customer = await Customer.findById(customerid);
        var t = {};
        const task = customer.tasks.find(ta => ta.id == taskid)
        task.comments.push({ content, sender })

        if (req.files) {
          Object.keys(req.files).forEach(key => {
            const file = req.files[key]
            const tm = Date.now()
            customer.tasks[customer.tasks.indexOf(task)].comments[task.comments.length - 1].files.push(tm + "-" + file.name)
            file.mv(`${process.env.FILE_ROOT}/customerTasks/${tm}-${file.name}`, (err) => {
              if (!err) {
              }
            })
          })
        }
        const user = await User.findById(uid)
        user.reports.push({ content: `Added A Report update on report with title <b>${task.title}</b>` })
        user.save()
        customer.save();
        res.json({ task });
      } catch (error) {
        console.log(error);
        res.json({ err: "Database Error Try again later" });
      }
    } else {
      res.json({ err: "Unable to authenticate Request. Re-Login and try again" })
    }
  })

  app.delete("/customer/task", async (req, res) => {
    const { task, customerid } = req.headers;
    try {
      const customer = await Customer.findById(customerid);
      customer.tasks = customer.tasks.filter((t) => {
        return t._id != task;
      });
      customer.save();
      res.json({ err: false });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error, Try again later" });
    }
  });

  app.patch("/customer/tasks/requestComplete", async (req, res) => {
    const { taskid, customerid } = req.body;
    try {
      const customer = await Customer.findById(customerid);
      customer.tasks.forEach(async (task) => {
        if (task._id == taskid) {
          task.requestComplete = true;
          const agent = await User.findById(task.agent);
          const admin = await User.findById(task.admin);
          sendMail(
            agent.email,
            admin.email,
            `Completion Of A Task By ${agent.name}`,
            `
            ${agent.name} Just Notified that <b>${task.title}</b> For Customer <b>${customer.name}</b> Has been completed,
            click the below button to check it out <br /><br />
            <a href='https://telserve-crm.vercel.app/#/customers/${customer.id}'>
            <button style='border:2px solid #00ff00;background-color:#00ff00;border-radius:10px;padding:13px'>Check</button>
            </a>
            `,
            agent.signature
          );
        }
      });
      customer.save();
      res.json({ err: false });
    } catch (error) {
      console.log(error);
      res.json({ err: "Databse Error, Try again later" });
    }
  });

  app.patch("/onboarders", async (req, res) => {
    if (req.cookies.uid) {
      try {
        const { data } = req.body;
        data.forEach(async person => {
          const customer = await Customer.findById(person.id)
          customer.invitor = person.invitor;
          customer.save()
          if (data.indexOf(person) == data.length - 1) {
            res.json({ err: false })
          }
        })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown error, try again later" })
      }

    } else {
      res.json({ err: "Unauthenticated Request, Login and try again" })
    }
  })

  app.post("/delivery", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const { location, customerWooId, items, wooOrderId } = req.body;
        const delivery = new Transfer({
          customer: customerWooId,
          items: items.map(i => ({ product: i.productId, qty: i.quantity })),
          completed: false,
          order: wooOrderId,
          location,
          status: 1,
          started: new Date()
        })
        console.log(wooOrderId)
        const order = await Order.findOne({ $or: [{ wid: wooOrderId }, { orderKey: wooOrderId }] });
        order.delivery = true;
        order.save()
        delivery.save()
        res.json({ delivery, order })
      } catch (error) {
        console.log(error)
        res.json({ err: "Server Error, Try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.patch("/delivery", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        // const user = await User.findById(uid)
        const { id, status } = req.body;
        const delivery = await Transfer.findById(id)
        delivery.status = status;
        if (status >= 3) {
          delivery.ended = new Date();
        }
        delivery.save()
        if (status == 3) {
          delivery.items.forEach(async item => {
            const product = await Product.findById(item.product)
            if (product) {
              product.qty -= item.qty;
              product.save()
              if (Boolean(product.wid)) {
                await api.put(`products/${product.wid}`, { stock_quantity: Number(product.qty), manage_stock: true })
              }
            }
          })
        }
        res.json({ delivery })
      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.patch("/order", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { _id, status } = req.body;
        const order = await Order.findById(_id);
        order.status = status || order.status;
        if (Boolean(order.wid)) {
          api.put(`orders/${order.wid}`, { status })
          // console.log(`/orders/${order.wid}`)
        }
        order.save()
        res.json({ order })
      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.post("/invoice", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {

        const user = await User.findById(uid)
        const { orderId, paid } = req.body;
        const order = await Order.findById(orderId);
        const inv_id = random.generate({ charset: "numeric", length: 6 }) + "-" + random.generate({ charset: "numeric", length: 3 });
        order.invId = order.invId || inv_id
        const data = {
          subtotal: 0,
          vat: 0,
          total: 0,
          items: [],
          date: new Date().toDateString(),
          inv_id: order.invId,
          paid,
          customer: "",
          order_id: order.wid || order.orderKey,
          words_amt: ""
        }
        let subtotal = 0;
        let vat = 0;
        let total = 0;
        let amountPaid = 0;
        data.items = await Promise.all(order.lineItems.map(async item => {
          const product = item.productId.length == 24 ? await Product.findById(item.productId) : await Product.findOne({ wid: item.productId })
          subtotal += product.price * item.quantity;
          return { name: product?.name || "Not Found", price: product.price, qty: item.quantity }
        }))
        order.paymentHistory.forEach(history => {
          amountPaid += history.amount;
        })
        data.amountPaid = amountPaid;
        const customer = Boolean(order.wid) ? await Customer.findOne({ wid: order.customer }) : await Customer.findById(order.customer)
        vat = subtotal * 0.075;
        total = subtotal + vat;
        data.subtotal = subtotal;
        data.vat = vat;
        data.usevat  = order.usevat
        data.total = total;
        data.customer = customer?.name || "Not Found";
        if (paid) {
          order.recieptSent = true;
          order.datePaid = new Date();
        } else {
          order.invoiceSent = true;
        }
        data.words_amt = toWords.convert(total)
        order.save();
        // const name = order.billing.first_name + " " +  order.billing.last_name
        const path = `${process.env.FILE_ROOT}/${paid ? "reciepts" : "invoices"}/${order.invId}.pdf`;
        const rawInvoiceHTML = await ejs.renderFile("templates/email/invoice.ejs", data);
        await generatePDF(rawInvoiceHTML, path);
        const attachments = [path]
        sendMail(`${user.name}<${user.email}>`, order?.billing?.email || customer?.email || "", paid ? "Purchase Reciept" : "PROFORMA INVOICE", `Find the Attachment Below For Invoice <b>${inv_id}</b>`, "base", {}, customer?.email || "", attachments);
        res.json({ order })
      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.post("/order", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { cid, items, shipping } = req.body;
        const customer = await Customer.findById(cid)

        let subtotal = 0;
        const lineItems = await Promise.all(items.map(async it => {
          const product = await Product.findById(it.product);
          subtotal += product?.price * it.qty;
          return ({ productId: it.product, quantity: it.qty, price: product?.price })
        }))
        const tax = subtotal * 0.075;

        const order = new Order({
          lineItems,
          billing: customer.address,
          customer: cid,
          shipping,
          dateCreated: new Date(),
          total: subtotal,
          totalTax: tax,
          status: "processing",
          usevat: true
        })
        order.save()
        res.json({ order })
      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }

  })

  app.post("/order/payment", async (req, res) => {
    const { id, amount, date } = req.body;
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const order = await Order.findById(id)
        order.paymentHistory.push({
          amount, date
        })
        user.reports.push({ content: `Added Payment Record On Order With Id <b>${order.orderKey}</b>` })

        user.save()


        //Receipt Control
        const inv_id = random.generate({ charset: "numeric", length: 6 }) + "-" + random.generate({ charset: "numeric", length: 3 });
        let subtotal = 0;
        let vat = 0;
        let total = 0;
        const data = {
          subtotal: 0,
          vat: 0,
          total: 0,
          items: [],
          date: new Date().toDateString(),
          inv_id: order.invId || inv_id,
          paid: false,
          customer: "",
          order_id: order.wid || order.orderKey,
          words_amt: "",
          amountPaid: 0
        }
        data.items = await Promise.all(order.lineItems.map(async item => {
          const product = item.productId.length == 24 ? await Product.findById(item.productId) : await Product.findOne({ wid: item.productId })
          subtotal += product.price * item.quantity;
          return { name: product?.name || "Not Found", price: product.price, qty: item.quantity }
        }))
        order.paymentHistory.forEach(history => {
          data.amountPaid += history.amount;
        })
        total = subtotal + vat;
        vat = subtotal * 0.075;
        if (data.amountPaid >= total) {
          data.paid = true;
          order.status = "completed";
        }
        const customer = Boolean(order.wid) ? await Customer.findOne({ wid: order.customer }) : await Customer.findById(order.customer)
        data.subtotal = subtotal;
        data.vat = vat;
        data.total = total;
        data.usevat  = order.usevat
        data.customer = customer?.name || "Not Found";
        order.datePaid = new Date();
        data.words_amt = toWords.convert(total)
        order.invId = order.invId || inv_id;
        order.save();
        // const name = order.billing.first_name + " " +  order.billing.last_name
        const path = `${process.env.FILE_ROOT}/invoices/${order.invId}.pdf`;
        const rawInvoiceHTML = await ejs.renderFile("templates/email/invoice.ejs", data);
        await generatePDF(rawInvoiceHTML, path);
        res.json({ order })

        //Adding the Transaction History
        const info = await Info.findOne()
        info.transactions.push({
          title: "Order Payment",
          description: `Payment Was Made For Order ${order.wid || order.orderKey}`,
          amount,
          sender: customer._id,
          recipient: uid,
          isCustomer: true
        })
        info.balance += amount;
        info.save();
        const attachments = [path]
        sendMail(`${user.name}<${user.email}>`, order?.billing?.email || customer?.email || "", order.status == "completed" ? "Purchase Reciept" : "PROFORMA INVOICE", `Find the Attachment Below For Invoice <b>${order.invId || inv_id}</b>`, "base", {}, customer?.email || "", attachments);

      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }


  })

  app.get("/order/payment/preview/:id", async (req, res) => {
    const { id, amount, date } = req.params;
    const { uid } = req.cookies;
    if (uid) {
      try {
        // const user = await User.findById(uid)
        const order = await Order.findById(id)


        //Receipt Control
        const inv_id = random.generate({ charset: "numeric", length: 6 }) + "-" + random.generate({ charset: "numeric", length: 3 });
        let subtotal = 0;
        let vat = 0;
        let total = 0;
        const data = {
          subtotal: 0,
          vat: 0,
          total: 0,
          items: [],
          date: new Date().toDateString(),
          inv_id: order.invId || inv_id,
          paid: false,
          customer: "",
          order_id: order.wid || order.orderKey,
          words_amt: "",
          amountPaid: 0,
          footnote: "This The Invoice might change when you are sending the invoice to client"
        }
        data.items = await Promise.all(order.lineItems.map(async item => {
          const product = item.productId.length == 24 ? await Product.findById(item.productId) : await Product.findOne({ wid: item.productId })
          subtotal += product.price * item.quantity;
          return { name: product?.name || "Not Found", price: product.price, qty: item.quantity }
        }))
        order.paymentHistory.forEach(history => {
          data.amountPaid += history.amount;
        })
        total = subtotal + vat;
        vat = subtotal * 0.075;
        if (data.amountPaid >= total) {
          data.paid = true;
          order.status = "completed";
        }
        const customer = Boolean(order.wid) ? await Customer.findOne({ wid: order.customer }) : await Customer.findById(order.customer)
        data.subtotal = subtotal;
        data.vat = vat;
        data.total = total;
        data.usevat  = order.usevat
        if (order?.billing?.first_name) {
          data.customer = order?.billing?.first_name + " " + order.shipping?.last_name
        } else {
          data.customer = customer?.name || "Not Found"
        }
        order.datePaid = new Date();
        data.words_amt = toWords.convert(total)
        order.invId = order.invId || inv_id;
        order.save();
        // const name = order.billing.first_name + " " +  order.billing.last_name
        const path = `${process.env.FILE_ROOT}/invoices/${order.invId}.pdf`;
        const rawInvoiceHTML = await ejs.renderFile("templates/email/invoice.ejs", data);
        await generatePDF(rawInvoiceHTML, path);
        res.sendFile(pth.resolve(path))


      } catch (err) {
        console.log(err)
        res.json({ err: "An Error Occured" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }


  })

  app.patch("/order/vat", async (req, res) => {
    try {
      if (!req.cookies.uid) return res.json({ err: "Unauthenticated Request" })
      const { id } = req.body
      const order = await Order.findById(id)
      order.usevat = !order.usevat
      if(order.usevat){
        order.totalTax = order.total * 0.075
      }else{
        order.totalTax = 0;
      }
      order.save()
      res.json({ order })
    } catch (error) {
      console.log(error)
      res.json({ err: "An error has occured" })
    }
  })

  app.get("/order/payment", (req, res) => {
    res.send("<h1>Hello</h1>")
  })

  //#endregion
};

//the status of calls,emails,texts should be changed from pending to any