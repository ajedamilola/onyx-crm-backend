const express = require("express");
const { sendMail } = require("./functions");
const fs = require("fs")
const https = require("https")
const http = require("http")
const app = express();
require("dotenv").config()
const PORT = process.env.PORT || 3007;
const ejs = require("ejs")

if (fs.existsSync("/root/certificates")) {
    https
        .createServer(
            // Provide the private and public key to the server by reading each
            // file's content with the readFileSync() method.
            {
                key: fs.readFileSync("/root/certificates/new_key.key"),
                cert: fs.readFileSync("/root/certificates/new_cert.crt"),
            },
            app
        )
        .listen(PORT, () => {
            console.log("serever is runing at port With HTTPS ", PORT);
        });
} else {
    http.createServer(app).listen(PORT, () => {
        console.log("Server Running On Port ", PORT)
    })
}
corsOptions = {
    origin: true, //included origin as true
    credentials: true, //included credentials as true
};
process.title = "CircuitCity";

app.use(require("body-parser")({ extended: false, limit: '7mb' }))
app.use(require("cookie-parser")("secret"))
app.use(require("cors")(corsOptions));
app.use(require("express-fileupload")())
require("./userEndpoints")(app);
require("./customerEndpoints")(app)

// setInterval(async ()=>{
//     console.log("Clean Up Systems");
// },1000)

// sendMail("info@telservenet.com","ajedamilola2005@gmail.com","Test","testing Email").then(val=>{
//     console.log(val.err || "Email Check success");
// });
app.get("/test", (req, res) => {
    sendMail("damilola@circuitcity.com.ng", "ajedamilola2005@gmail.com", "Weekly Report", "", "report", {
        name: "Aje",
        type: "Weekly",
        image: "",
        events: [{ content: "Demo", date: "12/may/2023", }]
    })
    res.send("Ok")
})