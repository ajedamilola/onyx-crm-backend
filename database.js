const mongoose = require("mongoose");
require("dotenv").config()
const random = require("randomstring")
//structures
const privilages = [
  "staff", "Head Of Unit", "Head Of Department", "Human Resources", "Management Team"
];

const userTypes = [
  "Sales", "Delivery", "Inventory", "Agent"
]

const departments = [
  {
    name: "Technical", units: [
      "Software Unit and Hardware Unit", "Network Unit",
      "Power unit", "Engineering Assistant and Automations Unit",
      "Project Assistant", "E-marketing"
    ]
  },
  {
    name: "Marketing", units: [
      "Retail Unit",
      "Marketing Unit",
      "E-marketing Unit",
    ]
  },
  { name: "Logistics", units: ["Logistics support unit"] },
  {
    name: "Admin", units: [
      "HR",
      "Junior Staffs",
      "IT staffs and Interim staffs"
    ]
  },
]

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

const Purchase = new mongoose.Schema({
  amount: Number,
  items: [{
    product: String,
    qty: Number,
  }],
  date: Date,
  confirmed: Boolean,
  pending: Boolean,
  pendingDelete: { type: Boolean, default: false },
  discount: Number,
  code: {
    type: Number,
    default: random.generate({
      charset: "numeric",
      length: 6
    })
  }
});


const voucher = new mongoose.Schema({
  code: {
    type: Number,
    default: random.generate({ charset: "numeric", length: 6 }),
  },
  amount: Number,
  admin: String,
  pending: { type: Boolean, default: true },
  approved: Boolean,
  message: String,
  date: Date,
  approveDate: String,

  confirmed: Boolean
})

const report = new mongoose.Schema({
  content: String,
  date: { type: Date, default: () => new Date() },
  seen: { type: Boolean, default: false },
  manual: Boolean
})
const userStructure = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  customers: [mongoose.SchemaTypes.ObjectId],
  tasks: [{ ...ContactInstance, bySuper: false, admin: String }],
  //privilages
  privilage: Number,
  canAddProducts: { type: Boolean, default: false },
  account: { type: Boolean, default: false },
  dateAdded: {
    default: () => new Date(),
    type: Date,
  },
  canAddCustomers: { type: Boolean, default: false },
  image: String,
  checkIns: [Date],
  signature: String,
  mailPassword: String,
  sid: String,
  vouchers: [voucher],
  reports: [report],
  department: Number,
  units: [Number],
  sentReports: [{ date: Date, rType: String, title: String }],
  scheduledEmails:[
    {title:String,content:String, interval:String, date:Date}
  ]
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
  invitor: mongoose.SchemaTypes.ObjectId,
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
      admin: String,
      needPayment: Boolean,
      comments: [
        { content: String, sender: String }
      ]
    },
  ],
  setUpCost: Number,
  address: String,
  area: {
    type: "String",
    default: "NONE"
  },
  code: {
    type: String,
    default: () => Math.floor(Math.random() * 100000) + 100000
  }
});

const productsStructure = new mongoose.Schema({
  name: String,
  price: Number,
  owner: mongoose.SchemaTypes.ObjectId,
  category: String,
  image: String,
  featured: Boolean,
  variablePrice: Boolean,
  qty: Number
});

const category = new mongoose.Schema({
  name: String,
  description: String,
  owner: String,
});

const chat = new mongoose.Schema({
  content: String,
  sender: String,
  recipient: String,
  files: [String]
});

const request = new mongoose.Schema({
  description: String,
  sender: mongoose.SchemaTypes.ObjectId,
  recipient: mongoose.SchemaTypes.ObjectId,
  done: Boolean,
  pendingDone: Boolean,
});

const announcement = new mongoose.Schema({
  title: String,
  description: String,
  sender: String,
  done: Boolean,
  departments: [Number],
  verified: Boolean,
  beyond: Boolean
})

const Transaction = new mongoose.Schema({
  title: String,
  description: String,
  amount: Number,
  sender: String,
  recipient: String,
  isCustomer: Boolean
})

const info = new mongoose.Schema({
  balance: Number,
  transactions: [
    Transaction
  ]
})

const ticket = new mongoose.Schema({
  contents: [{
    title: String, content: String, responder: String, date: {
      type: Date, default: () => new Date()
    }
  }],
  open: {
    type: Boolean,
    default: true
  },
  resolved: Boolean,
  raiser: String,
  ref: {
    type: Number,
    default: () => random.generate({ charset: "numeric", length: 7 })
  }
})

const User = mongoose.model("user", userStructure);
const Customer = mongoose.model("customer", customerStructure);
const Product = mongoose.model("product", productsStructure);
const Category = mongoose.model("category", category);
const Chat = mongoose.model("chat", chat);
const Annoucement = mongoose.model("announcement", announcement);
const Request = mongoose.model("request", request);
const Info = mongoose.model("information", info);
const Ticket = mongoose.model("ticket", ticket)
// const dbName  = "main";
const connString = process.env.NODE_ENV == "development" ? "mongodb://127.0.0.1:27017" : "mongodb://crud:dbnetrix%23%40@127.0.0.1:27017/?authMechanism=DEFAULT"
const dbName = process.env.NODE_ENV == "development" ? "circuit-crm" : "circuitcity";
console.log(connString)
mongoose.set('strictQuery', false)
mongoose.connect(connString, { dbName }, (err) => {
  console.log("Database", err ? "Connection Failed with " + err : "Connection Successful");
});

module.exports = {
  User,
  Customer,
  Product,
  Category,
  Chat,
  Annoucement,
  Request,
  Ticket,
  privilages,
  userTypes
};
