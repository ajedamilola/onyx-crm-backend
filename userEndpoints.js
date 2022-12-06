//import libraries
const { User, Customer } = require("./database");
module.exports = (app) => {
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

  app.post("/user", async (req, res) => {
    const { uid } = req.body;
    try {
      const user = await User.findById(uid);
      if (user) {
        const customers = await Customer.find({ handler: user.id });
        res.cookie("uid", user.id, {
          httpOnly: false,
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
        });
        res.send({ user:{...user.toObject(),plans}, customers,plans });
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
      const user = await User.findOne({ email, password });
      if (user) {
        const customers = await Customer.find({ handler: user.id });
        res.cookie("uid", user.id, {
          httpOnly: false,
          sameSite: "none",
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
        });
        res.send({ user:{...user.toObject(),plans}, customers });
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
        replied: false,
        pending: true,
      });
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
          user.tasks[index] = task;
          user.save();
          return res.json({ msg: "Ok" });
        }
      }
    } catch (e) {
      console.log(e.message);
      res.json({ err: "A Server Error Ocurred" });
    }
  });
};
