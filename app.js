const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const e = require("express");



const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))
app.set("view engine", "ejs")

const port = 3000;


mongoose.connect("mongodb://localhost:27017/whisper", { useNewUrlParser: true }, (err) => {
    if (err) {
        throw err;
    }
    else
        console.log("Connected to DB Successfully");
})


const userSchema = {
    email: String,
    password: String,
}

const User = mongoose.model("User", userSchema);


app.get("/", (req, res) => {
    res.render("home")
})
app.get("/register", (req, res) => {
    res.render("register")
})
app.get("/login", (req, res) => {
    res.render("login")
})
app.post("/register", (req, res) => {
    const newUser = User({
        email: req.body.email,
        password: req.body.password,
    })
    newUser.save((err) => {
        if (err) {
            res.send(err)
        } else
            res.redirect("/login")
    })
})
app.post("/login", (req, res) => {
    User.findOne(req.body, (err,foundUser) => {
        if (foundUser)
            res.render("secrets");
        else {
            res.render("login")
        }
    })
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})