const mongoose = require("mongoose");

//structures

const ContactInstance = {
    date:Date,
    successful:Boolean,
    replied:Boolean,
    pending:Boolean,
    title:String,
    description:String
}

const Purchase = {
    amount:Number,
    product:mongoose.SchemaTypes.ObjectId,
    date:Date,
    confirmed:Boolean,
    pending:Boolean,
    qty:Number
}


const userStructure = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    customers:[mongoose.SchemaTypes.ObjectId],
    tasks:[ContactInstance],
    privilage:Number,
    canAddProducts:Boolean
})

const customerStructure = new mongoose.Schema({
    name:String,
    email:String,
    phone:String,
    dateAdded:{
        default:()=>new Date(),
        type:Date
    },
    image:String,
    calls:[ContactInstance],
    texts:[ContactInstance],
    emails:[ContactInstance],
    purchases:[Purchase],
    handler:mongoose.SchemaTypes.ObjectId,
    mainProduct:mongoose.SchemaTypes.ObjectId,
    company:String,
    active:Boolean,
})


const productsStructure = mongoose.Schema({
    name:String,
    price:Number,
    owner:mongoose.SchemaTypes.ObjectId,
    category:String,
    image:String,
    featured:Boolean
})

const category = mongoose.Schema({
    name:String,
    description:String,
    owner:String
})





const User = mongoose.model("user",userStructure);
const Customer = mongoose.model("customer",customerStructure);
const Product = mongoose.model("product",productsStructure);
const Category = mongoose.model("category",category);
const connString = "mongodb+srv://damilola:dEqhLFLqge5XDkrh@maincluster.ym0ggdr.mongodb.net/?retryWrites=true&w=majority";
// const connString = "mongodb://localhost:27017/telserve-crm";

mongoose.connect(connString,(err)=>{
    console.log(err ? "Connection Failed" : "Connection Successful");
})

module.exports = {
    User,
    Customer,
    Product,
    Category
}