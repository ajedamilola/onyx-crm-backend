//import libraries
const {
  User,
  Customer,
  Category,
  Product,
  Chat,
  Annoucement,
  Request,
  Ticket,
} = require("./database");
const formatter = new Intl.NumberFormat("en-US");
const { encode64, sendMail, getInbox } = require("./functions");
module.exports = (app) => {
  const d_productImage =
    "data:image/jpeg;base64,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";
  const setupCost = 3000;
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
  app.get("/", (req, res) => {
    res.send("Server Running Successfully");
  });

  app.post("/editUser", async (req, res) => {
    if (req.cookies.uid) {
      try {
        const { name, password, email, mailPassword } = req.body;
        const user = await User.findById(req.cookies.uid);
        user.name = name;
        user.password = password;
        user.email = email;
        user.mailPassword = mailPassword;

        if (req.files && req.files.image) {
          user.image =
            "data:image/webp;base64," + (await encode64(req.files.image.data));
        }
        user.save();
        res.json({ msg: "ok" });
      } catch (error) {
        res.json({ err: "Database Error Try again later" });
        console.log(new Date().toLocaleString(), "===>  ", error);
      }
    } else {
      res.json({ err: "Unauthenticated Request Logout and try again later" });
    }
  });

  app.post("/agent", async (req, res) => {
    try {
      if (req.cookies.uid) {
        const { uid } = req.cookies;
        const user = User.findById(uid);
        if (user) {
          if (user.privilage < 2) {
            res.json({
              err: "You do not have enough clearance for this action",
            });
          } else {
            //good to go
            const { name, email, privilage, password, sid, department, units } = req.body;
            const agent = new User({
              name,
              email,
              password,
              privilage,
              image: d_productImage,
              sid,
              canAddProducts: false,
              department: Number(department || 0), units: JSON.parse(units)
            });
            if (req.files && req.files.image) {
              agent.image =
                "data:image/webp;base64," +
                (await encode64(req.files.image.data));
            }
            agent.save();
            res.json({ agent });
          }
        } else {
          res.json({
            err: "Aparently You Have Been Deleted. Logout and try again. if this does not work contect your super user",
          });
        }
      } else {
        return res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      res.json({ err: "Database Error Try again later" });
    }
  });

  app.patch("/agent", async (req, res) => {
    try {
      const {
        id,
        email,
        name,
        canAddProducts,
        privilage,
        canAddCustomers,
        account,
        sid,
        department,
        units
      } = req.body;
      const user = await User.findById(id);
      user.email = email;
      user.name = name;
      user.canAddProducts = canAddProducts;
      user.privilage = privilage;
      user.canAddCustomers = canAddCustomers;
      user.account = account;
      user.sid = sid;
      user.department = Number(department);
      user.units = JSON.parse(units)
      // user.account = account;
      if (req.files && req.files.image) {
        user.image =
          "data:image/webp;base64," + (await encode64(req.files.image.data));
      }
      user.save();
      res.json({ user });
    } catch (err) {
      console.log(new Date().toLocaleString(), "===>  ", err);
      res.json({ err: "Databse Error Try again later" });
    }
  });

  app.delete("/agent", async (req, res) => {
    if (req.cookies.uid) {
      try {
        await User.findByIdAndDelete(req.headers.id);
        console.log(new Date().toLocaleString(), "===>  ", req.headers.id);
        res.json({ msg: "Ok" });
      } catch (err) {
        res.json({ err: "Database Error Try Again later" });
      }
    } else {
      res.json({ err: "Unauthenticated Request" });
    }
  });

  app.post("/user", async (req, res) => {
    const { uid } = req.body;
    try {
      const user = await User.findById(uid);
      if (user) {
        const customers = await Customer.find({});
        const categories = await Category.find({});
        const products = await Product.find({});
        const annoucements = await Annoucement.find({});
        const chats = await Chat.find().or([
          { "recipient": user.id },
          { "sender": user.id }
        ])
        res.cookie("uid", user.id, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: "none"
        });
        const agents = (await User.find({})).map((u) =>
          user.privilage < 1 ? { _id: u.id, image: u.image, name: u.name, privilage: u.privilage, department: u.department } : u
        );
        const emails = user.mailPassword ? await getInbox(user.email, user.mailPassword) : []
        const tickets = user.privilage < 1 ? await Ticket.find({ raiser: user._id }) : await Ticket.find({});

        // console.log(emails)
        res.send({
          user: { ...user.toObject(), plans },
          customers,
          plans,
          categories,
          products,
          agents,
          annoucements,
          chats,
          emails,
          tickets
        });
      } else {
        res.json({ err: "Invalid Credentials Procided" });
      }
    } catch (e) {
      res.json({ err: e.message });
    }
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const products = await Product.find({});
      const user = await User.findOne({ email, password });
      if (user) {
        const customers = await Customer.find({});
        const categories = await Category.find({});
        const annoucements = await Annoucement.find({});
        res.cookie("uid", user.id, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: "none"
        });
        const agents = (await User.find({})).map((u) =>
          user.privilage < 1 ? { _id: u.id, image: u.image, name: u.name, privilage: u.privilage, department: u.department } : u
        );
        const tickets = user.privilage < 1 ? await Ticket.find({ raiser: user._id }) : await Ticket.find({});
        const emails = await getInbox(user.email, user.mailPassword)
        user.reports.push({ content: `Logged In` })
        user.save()

        res.send({
          user: { ...user.toObject(), plans },
          customers,
          categories,
          products,
          agents,
          annoucements,
          emails,
          tickets
        });
      } else {
        res.json({ err: "Invalid Credentials Procided" });
      }
    } catch (e) {
      res.json({ err: e.message });
    }
  });

  app.post("/task", async (req, res) => {
    const { title, description, dateEnded } = req.body;
    try {
      const { uid } = req.cookies;
      if (!uid) {
        throw { message: "Unauthenticated Request!" };
      }
      const user = await User.findById(uid);
      user.tasks.push({
        date: new Date(dateEnded),
        description,
        title,
        pending: true,
        successful: false,
      });
      user.reports.push({ content: `Created a tesk titled: <b>${title}</b>` })
      user.save();
      res.json(user.tasks[user.tasks.length - 1]);
    } catch (err) {
      res.json({ err: err.message });
    }
  });

  app.patch("/task", async (req, res) => {
    const { r_task } = req.body;
    try {
      const task = JSON.parse(r_task);
      const { uid } = req.cookies;
      const user = await User.findById(uid);
      for (let index = 0; index < user.tasks.length; index++) {
        const element = user.tasks[index];
        if (element._id == task._id) {
          var msg = "Task Updated Successfully";
          if (!element.bySuper) {
            user.tasks[index] = task;
          } else {
            msg = "Report Sent Successfully";
            user.tasks[index].pendingDelete = true;
          }
          user.save();
          return res.json({ msg });
        }
      }
    } catch (e) {
      console.log(new Date().toLocaleString(), "===>  ", e.message);
      res.json({ err: "A Server Error Ocurred" });
    }
  });

  app.patch("/agent/doneTask", async (req, res) => {
    try {
      const { agent, task } = req.body;
      const user = await User.findById(agent);
      for (let i = 0; i < user.tasks.length; i++) {
        const t = user.tasks[i];
        if (t.id == task) {
          user.tasks[i].successful = !t.successful;
          user.reports.push({ content: `Marked Task <b>${t.title}</b> as completed` })
          user.save();
          return res.json({ msg: "Ok" });
        }
      }
    } catch (error) {
      console.log(new Date().toLocaleString(), "===>  ", error);
      res.json({ err: "Databse Error Try Again Later" });
    }
  });

  app.delete("/task", async (req, res) => {
    try {
      const uid = req.cookies.uid;
      if (uid) {
        const user = await User.findById(uid);
        if (user.privilage > 1) {
          user.reports.push({ content: `Deleted Task <b>${user.tasks.find((t) => t.id == req.headers.id).title}</b>` })
          user.tasks = user.tasks.filter((t) => t.id != req.headers.id);
        } else {
          user.tasks.forEach((task) => {
            if (task._id == req.headers.id) {
              task.pendingDelete = true;
            }
          });
        }

        user.save();
        res.json({ msg: "Ok" });
      } else {
        res.json({
          err: "Unauthenticated Request. Logout, relogin and try again",
        });
      }
    } catch (err) {
      res.json({ err: "Database Error Try again later" });
      console.log(new Date().toLocaleString(), "===>  ", err);
    }
  });

  app.delete("/agent/task", async (req, res) => {
    try {
      if (req.cookies.uid) {
        const { agent, task } = req.headers;
        const user = await User.findById(agent);
        user.tasks = user.tasks.filter((t) => t.id != task);
        user.save();
        res.json({ msg: "Ok" });
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      res.json({ err: "Database Error Try Again later" });
      console.log(new Date().toLocaleString(), "===>  ", err);
    }
  });

  app.post("/category", async (req, res) => {
    const { name, description } = req.body;
    try {
      const category = new Category({
        name,
        description,
        owner: req.cookies.uid,
      });
      category.save();
      res.json({ msg: "Ok", category });
    } catch (err) {
      console.log(new Date().toLocaleString(), "===>  ", err);
      res.json({
        err: err.message,
        msg: "A Error Occured, Unable to add Category Try again later",
      });
    }
  });

  app.delete("/category", async (req, res) => {
    const { id } = req.headers;
    try {
      await Category.findByIdAndDelete(id);
      res.json({ msg: "Ok" });
    } catch (error) {
      res.json({
        err: error.message,
        msg: "Unable To Delete category try again later",
      });
      console.log(new Date().toLocaleString(), "===>  ", error);
    }
  });

  app.post("/product", async (req, res) => {
    try {
      const { name, price, category, variablePrice, qty } = req.body;
      const { uid } = req.cookies;
      const product = new Product({
        name,
        price,
        category,
        owner: uid,
        image: d_productImage,
        featured: false,
        variablePrice,
        qty
      });

      if (req.files && req.files.image) {
        product.image =
          "data:image/webp;base64," + (await encode64(req.files.image.data));
      }
      product.save();
      res.json({ msg: "Ok", product });
    } catch (err) {
      console.log("An Error Occuered Here ===>  ", err);
      res.json({
        err: err.message,
        msg: "Unable to create Product At this time try again later",
      });
    }
  });

  app.patch("/toggleFeatured", async (req, res) => {
    const { id } = req.body;
    try {
      const product = await Product.findById(id);
      product.featured = !product.featured;
      product.save();
      res.json({ msg: "Ok" });
    } catch (err) {
      res.json({ err: "Unable to add category try again later" });
      console.log(new Date().toLocaleString(), "===>  ", err);
    }
  });

  app.delete("/product", async (req, res) => {
    const { id } = req.headers;
    try {
      await Product.findByIdAndDelete(id);
      res.json({ msg: "Ok" });
    } catch (error) {
      res.json({
        err: error.message,
        msg: "Unable To Delete Product try again later",
      });
      console.log(new Date().toLocaleString(), "===>  ", error);
    }
  });

  app.patch("/product", async (req, res) => {
    const { name, id, category, price, variablePrice, qty } = req.body;
    try {
      const product = await Product.findById(id);
      (product.name = name),
        (product.category = category),
        (product.price = price);
      (product.qty = qty);
      product.variablePrice = variablePrice;
      if (req.files && req.files.image) {
        product.image =
          "data:image/webp;base64," + (await encode64(req.files.image.data));
      }
      product.save();
      res.json({ msg: "Ok", product });
    } catch (error) {
      console.log(new Date().toLocaleString(), "===>  ", error);
      res.json({ err: "Unable To Edit Product at this time try again later" });
    }
  });

  app.get("/all", async (req, res) => {
    try {
      const { uid } = req.cookies;
      if (uid) {
        const master = await User.findById(uid);
        if (master) {
          if (master.privilage > 1) {
            agents = (await User.find({})).filter(
              (u) => u.privilage <= master.privilage
            );
            res.json({ agents });
          } else {
            res.json({
              err: "Apparently You do not have the proper privilage for this information. Contact A Super User",
            });
          }
        } else {
          res.json({
            err: "Apparently You Have Been Deleted from the system. Contact A Super User",
          });
        }
      } else {
        res.json({ err: "Unauthenticated Request" });
      }
    } catch (err) {
      console.log(new Date().toLocaleString(), "===>  ", err);
      res.json({ err: "Database Error Try again later" });
    }
  });

  app.post("/agent/task", async (req, res) => {
    try {
      const { agent, title, description, date } = req.body;
      const Agent = await User.findById(agent);
      Agent.tasks.push({
        title,
        description,
        date: new Date(date),
        bySuper: true,
        pending: true,
        admin: req.cookies.uid
      });
      const admin = await User.findById(req.cookies.uid);
      Agent.reports.push({ content: `Task <b>${title}</b> Was assigned By ${admin.name}` })
      Agent.save();

      res.json({ newTask: Agent.tasks[Agent.tasks.length - 1] });
    } catch (err) {
      console.log(new Date().toLocaleString(), "===>  ", err);
      res.json({ err: "Database Error Try Again Later" });
    }
  });

  app.post("/check-in", async (req, res) => {
    const { uid } = req.cookies;
    try {
      const user = await User.findById(uid);
      const today = new Date();
      if (user.checkIns.length < 1) {
        user.checkIns.push(today);
      } else {
        const latest = user.checkIns[user.checkIns.length - 1];
        if (latest.toDateString() != today.toDateString()) {
          user.checkIns.push(today);
          user.reports.push({ content: "Just Checked In For the First Time" });
        }
      }
      await user.save();
      res.json({ err: false });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error, Try again later" });
    }
  });

  app.post("/annoucement", async (req, res) => {
    const { title, description, beyond, departments } = req.body;
    const { uid } = req.cookies;
    const user = await User.findById(uid);
    try {
      const annoucement = new Annoucement({
        title,
        description,
        sender: uid,
        departments,
        beyond,
        verified: user.privilage >= 2
      });
      console.log(departments)
      annoucement.save();

      user.reports.push({ content: `Sent An Announcemet titled: ${title}` });
      user.save()
      res.json({ annoucement });
    } catch (error) {
      console.log(error);
      res.json({ err: "database Error try again later" });
    }
  });

  app.delete("/annoucement", async (req, res) => {
    try {
      const announcement = await Annoucement.findById(req.headers.id)
      await announcement.delete()
      if (req.headers.byadmin) {
        const user = await User.findById(announcement.sender);
        user.reports.push({ content: `Announcement <b>${announcement.title}</b> was Deleted By An Admin or HOD` })
        user.save()
      }
      res.json({ err: false });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error try again later" });
    }
  });

  app.patch("/announcement/accept", async (req, res) => {
    try {
      const { id } = req.body;
      const annoucement = await Annoucement.findById(id)
      annoucement.verified = true;
      annoucement.save()
      const user = await User.findById(annoucement.sender);
      user.reports.push({ content: `Announcement <b>${annoucement.title}</b> Has Been verified for viewing by an Admin or HOD` })
      user.save()
      res.json({ annoucement });
    } catch (error) {
      console.log(error);
      res.json({ err: "Database Error try again later" });
    }
  })
  //============= Chat Section

  app.post("/chat", async (req, res) => {
    //TODO: Add support for files attachment
    if (req.cookies.uid) {
      const { content, recipient } = req.body;
      const chat = new Chat({
        content, sender: req.cookies.uid, recipient, files: []
      })
      chat.save()
      res.json({ chat })
    } else {
      res.json({ err: "Unauthorized Request" })
    }
  });

  app.delete("/chat", async (req, res) => {

  });

  app.post("/request", async (req, res) => {
    const { title, description, recipient } = req.body;
    if (req.cookies.uid) {
      try {
        const request = new Request({
          description,
          sender: req.cookies.uid,
          recipient,
          done: false,
          pendingDone: false,
        });
        request.save();
        res.json({ request });
      } catch (err) {
        console.log(err);
        res.json({ err: "" });
      }
    } else {
      res.json({ err: "Unauthenticated Request" });
    }
  });

  app.get("/requests", async (req, res) => {
    if (req.cookies.uid) {
      const { uid } = req.cookies;
      try {
        const requests = await Request.find({
          $or: [{ sender: uid }, { recipient: uid }],
        });
        res.json({ requests });
      } catch (error) {
        console.log(error);
        res.json({ err: "Unknown Error try again later" });
      }
    } else {
      res.json({ err: "unauthenticated Request" });
    }
  });

  app.delete("/request", async (req, res) => {
    try {
      await Request.findByIdAndDelete(req.headers.id);
      res.json({});
    } catch (error) {
      res.json({ err: "Unkown Error try again later" });
    }
  });

  app.patch("/request", async (req, res) => {
    try {
      const request = await Request.findByIdAndUpdate(req.body.id, {
        done: true,
      });
      res.json({});
    } catch (error) {
      console.log(error);
      res.json({ err: "unknown Error try again later" });
    }
  });

  app.post("/signature", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      if (req.files && req.files.image) {
        const agent = await User.findById(uid);
        agent.signature =
          "data:image/jpeg;base64," +
          (await encode64(req.files.image.data, true, true));
        agent.save();
        res.json({ image: agent.signature });
      } else {
        res.json({ err: "Signature must be an image" });
      }
    } else {
      res.json({ err: "Unauthenticated Request" });
    }
  });

  app.post("/voucher", async (req, res) => {
    const { amount, admin, message, date } = req.body;
    const { uid } = req.cookies;
    try {
      if (uid) {
        const user = await User.findById(uid);
        let approved = user.privilage > 2;
        let pending = user.privilage <= 2;
        user.vouchers.push({ amount, admin, message, date, approved, pending, approveDate: new Date() });
        user.reports.push({ content: `Requested A Voucher Worth <b>₦${formatter.format(amount)}</b>` })
        user.save()
        res.json({ voucher: user.vouchers[user.vouchers.length - 1] })
      } else {
        res.json({ err: "Unauthenticated Request" })
      }
    } catch (error) {
      console.log(error)
      res.json({ err: "Unknown Error, try again lter" })
    }
  })

  app.delete("/voucher", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const { vid, aid } = req.headers;
        const user = await User.findById(aid);
        const admin = await User.findById(uid);
        user.vouchers = user.vouchers.filter(v => v.id != vid);
        user.reports.push({ content: `Voucher With Ref <b class='copy'>${voucher.code}</b> Was <b class='text-danger'>Deleted</b> By ${admin.name}` })
        user.save();
        res.json({ voucher: vid })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  });

  app.patch("/voucher", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const admin = await User.findById(uid);

        const { confirmed, vid } = req.body;
        const user = await User.findById(req.body.aid)
        for (let i = 0; i < user.vouchers.length; i++) {
          let msg = "Voucher Sent Successfully"
          const voucher = user.vouchers[i];
          if (voucher.id == vid) {
            if (admin.privilage >= 3) {
              voucher.pending = false;
              voucher.approved = confirmed;
              voucher.approveDate = new Date();
              msg = confirmed ? "Voucher Has Been Confirmed Successfully" : "Voucher Has Been Declined Successfully";
              user.reports.push({ content: `Voucher With Ref <b class='copy'>${voucher.code}</b> Was ${confirmed ? "<b class='text-success'>Confirmed</b>" : "<b class='text-danger'>Declined</b>"}` })
            } else {
              if (confirmed) {
                voucher.pending = true;
                msg = "Voucher Has Been Sent To HR Successfully"
                voucher.admin = (await User.findOne({ privilage: 3 })).id
                user.reports.push({ content: `Voucher With Ref <b class='copy'>${voucher.code}</b> Was <span class='text-success'>Sent To HR For Approval</span>` })

              } else {
                voucher.approved = false;
                voucher.pending = false;
                msg = "Voucher Has Been Declined Successfully"
                user.reports.push({ content: `Voucher With Ref <b class='copy'>${voucher.code}</b> Was <b class='text-danger'>Declined</b>` })

              }
            }
            user.save()
            return res.json({ voucher, msg })
          }
        }
        res.json({ err: "Invalid Request. Resync/Refresh Page and try again" });
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.post("/event", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const { content } = req.body;
        const user = await User.findById(uid)
        user.reports.push({ content, manual: true })
        user.save();
        res.json({ user })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.post("/ticket", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { title, content } = req.body;
        const ticket = new Ticket({
          contents: [{ title, content, responder: uid }],
          raiser: uid,
          resolved: false
        })
        user.reports.push({ content: `${user.name} Raised A ticket with ref <b class='copy'>${ticket.ref}</b>` })
        user.save()
        ticket.save()
        res.json({ ticket })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  });

  app.delete("/ticket", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const { id } = req.body
        const ticket = await Ticket.findById(id);
        ticket.delete()
        const user = await User.findById(ticket.raiser)
        user.reports.push({ content: `Ticket with ref <b>${ticket.ref}</b> Was Deleted` });
        user.save()
        res.json({ msg: "ok" })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.patch("/ticket", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const ticket = await Ticket.findById(req.body.id);
        ticket.open = req.body.open;
        ticket.resolved = req.body.resolved;
        ticket.save()
        res.json({ ticket })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.post("/ticket/response", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { id, content, title } = req.body;
        const ticket = await Ticket.findById(id);
        ticket.contents.push({ content, title, responder: uid });
        user.reports.push({ content: `${user.name} Gave a response to a ticket with ref <b>#${ticket.ref}</b>` })
        if (uid != ticket.raiser) {
          const recipient = await User.findById(ticket.raiser);
          console.log(recipient.email)
          sendMail(user.email, recipient.email, `Ticket Update`,
            `<h3>Ticket Update</h3><br />A New Response was sent for ticket with ref: <b>${ticket.ref}</b> by <b>${user.name}</b>
            <br />
            <a href='https://circuit-crm.vercel.app/#/tickets/${ticket.ref}'>
            <button class='btn btn-primary'>Check Here</button> to check ticket
          </a>`
          );
        }
        user.save()
        ticket.save()
        res.json({ ticket })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.patch("/ticket/close", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { id, resolved } = req.body;
        const ticket = await Ticket.findById(id)
        ticket.resolved = resolved;
        ticket.open = false;
        ticket.save();
        user.reports.push({ content: `${user.name} Closed A ticket with ref #${ticket.ref}` })
        if (uid != ticket.raiser) {
          const recipient = await User.findById(ticket.raiser);
          sendMail(user.email, recipient.email, `Ticket Update`, `<h3>Ticket Update</h3><br /> Ticket <b>#${ticket.ref}</b> was Closed by: <img src='${user.image}' class='rounded-circle mx-2' style='width:50px' /> <b>${user.name}</b>`);
        }
        res.json({ ticket })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })

  app.patch("/ticket/open", async (req, res) => {
    const { uid } = req.cookies;
    if (uid) {
      try {
        const user = await User.findById(uid)
        const { id } = req.body;
        const ticket = await Ticket.findById(id)
        // ticket.resolved = resolved;
        ticket.open = true;
        ticket.save();
        user.reports.push({ content: `${user.name} Reopened A ticket with ref #${ticket.ref}` })
        if (uid != ticket.raiser) {
          const recipient = await User.findById(ticket.raiser);
          sendMail(user.email, recipient.email, `Ticket Update`, `<h1><b>${ticket.ref}</b></h1><br />This ticket Was reopened by ${user.name}`);
        }
        res.json({ ticket })
      } catch (error) {
        console.log(error)
        res.json({ err: "Unknown Error, try again later" })
      }
    } else {
      res.json({ err: "Unauthenticated Request" })
    }
  })
};

function isInPriorMonth(date) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const inputMonth = date.getMonth();
  const inputYear = date.getFullYear();
  if (inputYear < currentYear) {
    return true;
  } else if (inputYear == currentYear && inputMonth < currentMonth) {
    return true;
  } else {
    return false;
  }
}

function isInFormerYear(date) {
  const currentYear = new Date().getFullYear();
  return date.getFullYear() < currentYear;
}

function isYesterdayOrOlder(date) {
  const currentDate = new Date();
  const yesterday = new Date(currentDate.getTime() - 86400000);
  return date.getTime() < yesterday.getTime();
}

async function sendScheduledEmails() {
  console.log(
    new Date().toLocaleString(),
    "==> Running Scheduled Emails Check...."
  );
  const today = new Date();
  const customers = await Customer.find({});
  customers.forEach(async (customer) => {
    for (let i = 0; i < customer.emails.length; i++) {
      const email = customer.emails[i];
      if (email.interval != "Once" && email.isActive) {
        const agent = await User.findById(customer.handler);
        if (!email.lastSent) {
          try {
            if (email.interval == "Monthly") {
              if (today.getDay() == email.intervalDate.getDay()) {
                await sendMail(
                  agent.name,
                  customer.email,
                  email.title,
                  email.description,
                  agent.signature,
                  customer.name
                );
                email.lastSent = today;
              }
            } else if (email.interval == "Annually") {
              if (
                today.getMonth() == email.intervalDate.getMonth() &&
                today.getDay() == email.intervalDate.getDay()
              ) {
                await sendMail(
                  agent.name,
                  customer.email,
                  email.title,
                  email.description,
                  agent.signature,
                  customer.name
                );
                email.lastSent = today;
              }
            } else if (email.interval == "Annivesary") {
              if (
                today.getMonth() == customer.dateAdded.getMonth() &&
                today.getDay() == customer.dateAdded.getDay()
              ) {
                email.lastSent = today;
                await sendMail(
                  agent.name,
                  customer.email,
                  email.title,
                  email.description,
                  agent.signature,
                  customer.name
                );
              }
            } else if (email.interval == "Daily") {
              email.lastSent = today;
              await sendMail(
                agent.name,
                customer.email,
                email.title,
                email.description,
                agent.signature,
                customer.name
              );
            }
          } catch (err) {
            console.log(new Date().toLocaleString(), "===>  ", err);
          }
        } else {
          //has sent them before
          if (email.interval == "Monthly") {
            if (
              isInPriorMonth(email.lastSent) &&
              today.getDay() == email.intervalDate.getDay()
            ) {
              await sendMail(
                agent.name,
                customer.email,
                email.title,
                email.description,
                agent.signature,
                customer.name
              );
              email.lastSent = today;
            }
          } else if (email.interval == "Annually") {
            if (
              isInFormerYear(email.lastSent) &&
              today.getMonth() == email.intervalDate.getMonth() &&
              today.getDay() == email.intervalDate.getDay()
            ) {
              await sendMail(
                agent.name,
                customer.email,
                email.title,
                email.description,
                agent.signature,
                customer.name
              );
              email.lastSent = today;
            }
          } else if (email.interval == "Annivesary") {
            if (
              isInFormerYear(email.lastSent) &&
              today.getMonth() == customer.dateAdded.getMonth() &&
              today.getDay() == customer.dateAdded.getDay()
            ) {
              await sendMail(
                agent.name,
                customer.email,
                email.title,
                email.description,
                agent.signature,
                customer.name
              );
              email.lastSent = today;
            }
          } else if (email.interval == "Daily") {
            if (isYesterdayOrOlder(email.lastSent)) {
              await sendMail(
                agent.name,
                customer.email,
                email.title,
                email.description,
                agent.signature,
                customer.name
              );
              email.lastSent = today;
            }
          }
        }
      }
    }

    customer.save();
  });
}
setInterval(() => {
  //check for emails every 12 hours
  sendScheduledEmails();
}, 43200000);
