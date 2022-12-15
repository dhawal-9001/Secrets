const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
require("dotenv").config()


const Schema = mongoose.Schema;
const port = 3000;
const saltRounds = 10;
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
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (!err) {

            const newUser = User({
                email: req.body.email,
                password: hash,
            })
            newUser.save((err) => {
                if (err) {
                    res.send(err)
                } else
                    res.redirect("/login")
            })
        }
        else {
            console.log('Something went wrong')
            res.render("register")   
        }
    });
})
app.post("/login", (req, res) => {
    User.findOne({ email: req.body.email }, (err, foundUser) => {
        if (foundUser) {
            console.log('user found')
            bcrypt.compare(req.body.password, foundUser.password, (err, matched) => {
                if(err) {
                    console.log('Something went wrong')
                    res.render("login")
                }
                if (matched) {
                        console.log('password matched')
                        res.render("secrets");
                    }
                    else {
                        console.log('password not matched')
                        res.render('login')
                    }
                
            });
        }
        else {
            console.log('user not found')
            res.render("login")
        }
    })
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})