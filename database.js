const mongoose = require("mongoose");

//structures

const ContactInstance = {
  date: Date,
  successful: Boolean,
  replied: Boolean,
  pending: Boolean,
  title: String,
  description: String,
  pendingDelete: {
    type: Boolean,
    default: false,
  },
  interval: String,
  intervalDate: Date,
  isActive: Boolean,
  lastSent: Date,
};

const Purchase = {
  amount: Number,
  product: String,
  date: Date,
  confirmed: Boolean,
  pending: Boolean,
  qty: Number,
  pendingDelete: { type: Boolean, default: false },
};

const userStructure = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  customers: [mongoose.SchemaTypes.ObjectId],
  tasks: [{ ...ContactInstance, bySuper: false }],
  privilage: Number,
  canAddProducts: Boolean,
  dateAdded: {
    type: Date,
    default: () => new Date(),
  },
  image: String,
  checkIns: [Date],
  canAddCustomers: Boolean,
});

const customerStructure = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  dateAdded: {
    default: () => new Date(),
    type: Date,
  },
  image: String,
  calls: [ContactInstance],
  texts: [ContactInstance],
  emails: [ContactInstance],
  purchases: [Purchase],
  handler: mongoose.SchemaTypes.ObjectId,
  mainProduct: mongoose.SchemaTypes.ObjectId,
  company: String,
  active: Boolean,
  tasks: [
    {
      title: String,
      description: String,
      compulsory: Boolean,
      completed: Boolean,
      agent: String,
      requestComplete: Boolean,
    },
  ],
});

const productsStructure = mongoose.Schema({
  name: String,
  price: Number,
  owner: mongoose.SchemaTypes.ObjectId,
  category: String,
  image: String,
  featured: Boolean,
});

const category = mongoose.Schema({
  name: String,
  description: String,
  owner: String,
});

const chat = mongoose.Schema({
  content: String,
  files: [String],
  sender: String,
});

const requests = mongoose.Schema({
  message: String,
  sender: mongoose.SchemaTypes.ObjectId,
  recipient: mongoose.SchemaTypes.ObjectId,
  done: Boolean,
  pendingDone: Boolean,
});

const User = mongoose.model("user", userStructure);
const Customer = mongoose.model("customer", customerStructure);
const Product = mongoose.model("product", productsStructure);
const Category = mongoose.model("category", category);
const Chat = mongoose.model("chat", chat);
// const connString = "mongodb+srv://damilola:dEqhLFLqge5XDkrh@maincluster.ym0ggdr.mongodb.net/?retryWrites=true&w=majority";
const connString = "mongodb://localhost:27017/telserve-crm";

mongoose.connect(connString, (err) => {
  console.log(err ? "Connection Failed" : "Connection Successful");
});

module.exports = {
  User,
  Customer,
  Product,
  Category,
  Chat,
};
