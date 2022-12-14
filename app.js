const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const encryption = require("mongoose-encryption");
require("dotenv").config()


const Schema = mongoose.Schema;
const port = 3000;
const secret = process.env.SECRET;
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))
app.set("view engine", "ejs")



mongoose.connect("mongodb://localhost:27017/whisper", { useNewUrlParser: true }, (err) => {
    if (err) {
        throw err;
    }
    else
        console.log("Connected to DB Successfully");
})


const userSchema = new Schema({
    email: String,
    password: String,
});
userSchema.plugin(encryption, { secret: secret, encryptedFields: ['password'] });
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
    User.findOne({ email: req.body.email }, (err, foundUser) => {
        if (foundUser) {
            // console.log('user found')
            if (foundUser.password === req.body.password) {
                // console.log('password matched')
                res.render("secrets");
            }
            else {
                // console.log('password not matched')
                res.render('login')
            }
        }
        else {
            // console.log('user not found')
            res.render("login")
        }
    })
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})