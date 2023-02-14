const express = require("express");
const { sendMail } = require("./functions");
const app = express();
app.listen(process.env.PORT || 3000,(err)=>{
    if(!err){
        console.log("Server Running Successfully")
    }else{
        console.log("An Error Occured ",err)
    }
})

corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
};

app.use(require("body-parser")({extended:false,limit:'7mb'}))
app.use(require("cookie-parser")("secret"))
app.use(require("cors")(corsOptions));
app.use(require("express-fileupload")())
require("./userEndpoints")(app);
require("./customerEndpoints")(app)

// setInterval(async ()=>{
//     console.log("Clean Up Systems");
// },1000)

sendMail("info@telservenet.com","ajedamilola2005@gmail.com","Test","testing Email").then(val=>{
    console.log(val.err || "Email Check success");
});