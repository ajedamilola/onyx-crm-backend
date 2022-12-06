const express = require("express");
const app = express();
app.listen(3000,(err)=>{
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

app.use(require("body-parser")({extended:false}))
app.use(require("cookie-parser")("secret"))
app.use(require("cors")(corsOptions));
app.use(require("express-fileupload")())
require("./userEndpoints")(app);
require("./customerEndpoints")(app)


