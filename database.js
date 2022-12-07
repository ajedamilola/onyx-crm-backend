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

const Plan = {
    name:String,
    amount:Number,
}

const Purchase = {
    amount:Number,
    plan:Plan,
    date:Date,
    confirmed:Boolean,
    pending:Boolean
}


const userStructure = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    customers:[mongoose.SchemaTypes.ObjectId],
    tasks:[ContactInstance]
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
    plan:Plan,
    company:String,
    active:Boolean,
    setupPayment:Number

})




const User = mongoose.model("user",userStructure);
const Customer = mongoose.model("customer",customerStructure);

mongoose.connect("mongodb+srv://damilola:dEqhLFLqge5XDkrh@maincluster.ym0ggdr.mongodb.net/?retryWrites=true&w=majority",(err)=>{
    console.log(err ? "Connection Failed" : "Connection Successful");
})

module.exports = {
    User,
    Customer
}