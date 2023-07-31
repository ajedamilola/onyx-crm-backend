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
  { name: "Logistics", units: ["Logistics support unit", "Store"] },
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
  manual: Boolean,
  edited: Boolean
})

const sentReport = new mongoose.Schema({ date: Date, rType: String, title: String })
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
  canViewInventory: Boolean,
  dateAdded: {
    default: () => new Date(),
    type: Date,
  },
  canCreateOrders: Boolean,
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
  sentReports: [sentReport],
  scheduledEmails: [
    { title: String, content: String, interval: String, date: Date }
  ],
  taskHistory: [{
    taskId: String,
    completed: Boolean,
    due: Date,
    admin: String,
    reported: Boolean
  }],
  reportFiles: [String]
});

const customerStructure = new mongoose.Schema({
  wid: String,
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

const productLog = new mongoose.Schema({
  date: {
    type: Date,
    default: () => new Date()
  },
  description: String,
  qty: Number,
  cost: Number,
  ref: {
    type: String,
    default: () => random.generate({ length: 4, charset: "numeric" })
  }
})
const productsStructure = new mongoose.Schema({
  name: String,
  price: Number,
  owner: mongoose.SchemaTypes.ObjectId,
  category: String,
  image: String,
  featured: Boolean,
  variablePrice: Boolean,
  qty: Number,
  wid: String,
  logs: {
    type: [productLog],
    default: []
  }
});

const category = new mongoose.Schema({
  name: String,
  description: String,
  owner: String,
  wid: String
});

const chat = new mongoose.Schema({
  content: String,
  sender: String,
  recipient: String,
  files: [String],
  date: {
    type: Date,
    default: () => new Date()
  }
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

const transaction = new mongoose.Schema({
  title: String,
  description: String,
  amount: Number,
  sender: String,
  recipient: String,
  isCustomer: Boolean,
  date: {
    type: Date,
    default: () => new Date()
  }
})

const info = new mongoose.Schema({
  balance: Number
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

const transfer = new mongoose.Schema({
  location: String,
  items: [{ product: String, qty: String }],
  completed: Boolean,
  customer: String,
  order: String,
  ref: {
    type: String,
    default: () => random.generate({ charset: "numeric", length: 6 })
  },
  status: Number,
  started: {
    type: Date,
    default: () => new Date()
  },
  ended: {
    type: Date,
    default: () => new Date()
  }
})

const order = new mongoose.Schema({
  wid: String,
  number: String,
  orderKey: {
    type: String,
    default: () => random.generate({
      charset: "numeric",
      length: 7
    })
  },
  version: String,
  dateCreated: Date,
  dateModified: Date,
  total: Number,
  totalTax: Number,
  customer: String,
  datePaid: Date,
  payementMethod: String,
  lineItems: [{ productId: String, quantity: Number, price: Number }],
  status: String,
  billing: mongoose.SchemaTypes.Mixed,
  shipping: mongoose.SchemaTypes.Mixed,
  delivery: Boolean,
  invoiceSent: Boolean,
  recieptSent: Boolean,
  paymentHistory: [{
    amount: Number, date: Date
  }],
  invId: String
})

const partPayment = new mongoose.Schema({
  target: Number,
  customer: String,
  targetDate: String,
  expense: Boolean,
  initiator: String,
  ref: {
    type: String,
    default: () => random.generate(7).toUpperCase(),
  },
  payments: [{
    amount: Number,
    date: Date,
    successful: Boolean,
    pending: Boolean,
    /**
     * Reason Transaction Is Pending so pending must be true to display this message
     */
    reason: String,
    ref: {
      type: String,
      default: () => random.generate({
        length: 7,
        charset: "numerical"
      })
    }
  }],
})

const User = mongoose.model("user", userStructure);
const Customer = mongoose.model("customer", customerStructure);
const Product = mongoose.model("product", productsStructure);
const Category = mongoose.model("category", category);
const Chat = mongoose.model("chat", chat);
const Annoucement = mongoose.model("announcement", announcement);
const Request = mongoose.model("request", request);
const Info = mongoose.model("account_info", info);
const Ticket = mongoose.model("ticket", ticket)
const Transfer = mongoose.model("delivery", transfer);
const Order = mongoose.model("order", order);
const PartPayment = mongoose.model("part_payment", partPayment);
const Transaction = mongoose.model("transaction",transaction)

// const dbName  = "main";
const connString = process.env.NODE_ENV == "development" ? "mongodb://127.0.0.1:27017" : "mongodb://crud:dbnetrix%23%40@127.0.0.1:27017/?authMechanism=DEFAULT"
const dbName = process.env.NODE_ENV == "development" ? "circuit-crm" : "circuitcity";

// const connString = "mongodb://crud:dbnetrix%23%40@139.84.233.172:27017/?authMechanism=DEFAULT"
// const dbName = "circuitcity";
console.log(connString)
mongoose.set('strictQuery', false)
mongoose.connect(connString, { dbName }, async (err) => {
  if (!err) {
    let info = await Info.findOne()
    if (!info) {
      info = new Info({ balance: 0, transactions: [] });
      info.save()
    }
  }
  return console.log("Database", err ? "Connection Failed with " + err : "Connection Successful");
})

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const api = new WooCommerceRestApi({
  url: "https://circuitcity.com.ng",
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_SECRET_KEY,
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
  Transfer,
  Order,
  Info,
  PartPayment,
  Transaction,
  api,
  privilages,
  userTypes,
  departments
};