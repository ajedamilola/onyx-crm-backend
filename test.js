const { sendMail } = require("./functions");
(async ()=>{
    const d = await sendMail("damilola@circuitcity.com.ng","ajedamilola2005@gmail.com","Welcome","We Welcome you to m=our platform")
})()