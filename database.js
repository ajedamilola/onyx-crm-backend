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
  discount:Number
};

const userStructure = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  customers: [mongoose.SchemaTypes.ObjectId],
  tasks: [{ ...ContactInstance, bySuper: false }],
  //privilages
  privilage: Number,
  canAddProducts: Boolean,
  account:Boolean,
  dateAdded: {
    default: () => new Date(),
    type: Date,
  },
  canAddCustomers: Boolean,
  image: String,
  checkIns: [Date],
  signature:String,
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
      admin:String
    },
  ],
  setUpCost:Number,
  address:String,
  code: {
    type: String,
    default: ()=>Math.floor(Math.random() * 100000 ) + 100000
  }
});

const productsStructure = mongoose.Schema({
  name: String,
  price: Number,
  owner: mongoose.SchemaTypes.ObjectId,
  category: String,
  image: String,
  featured: Boolean,
  variablePrice:Boolean
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

const request = mongoose.Schema({
  description: String,
  sender: mongoose.SchemaTypes.ObjectId,
  recipient: mongoose.SchemaTypes.ObjectId,
  done: Boolean,
  pendingDone: Boolean,
});

const announcement = mongoose.Schema({
  title:String,
  description:String,
  sender:String,
  done:Boolean
})

const User = mongoose.model("user", userStructure);
const Customer = mongoose.model("customer", customerStructure);
const Product = mongoose.model("product", productsStructure);
const Category = mongoose.model("category", category);
const Chat = mongoose.model("chat", chat);
const Annoucement = mongoose.model("announcement", announcement);
const Request = mongoose.model("request",request);
const connString = "mongodb+srv://damilola:dEqhLFLqge5XDkrh@maincluster.ym0ggdr.mongodb.net/?retryWrites=true&w=majority";
const dbName  = "main";
// const connString = "mongodb://127.0.0.1:27017";
// const dbName  = "telserve-crm";
mongoose.connect(connString, {dbName},(err) => {
  console.log("Database",err ? "Connection Failed with "+err : "Connection Successful");
});

module.exports = {
  User,
  Customer,
  Product,
  Category,
  Chat,
  Annoucement,
  Request
};
