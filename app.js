const express = require("express");
const cors =require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// app.use("/api/v1/auth", require("./routes//authRoutes"));

app.get("/",(req,res)=>{
    res.send("WBC Backend Running");
});

module.exports = app;