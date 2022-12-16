require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


const Schema = mongoose.Schema;
const port = 3000;
const app = express();

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/whisper", { useNewUrlParser: true }, (err) => {
    if (err) {
        throw err;
    }
    else
        console.log("Connected to DB Successfully");
})



const userSchema = new Schema({
    username: String,
    password: String,
});
userSchema.plugin(passportLocalMongoose)
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("already authentiocated redirecting to secrets");
        res.redirect("/secrets")
    } else {
        console.log(" not authentiocated redirecting to home");
        res.render("home")
    }
})

app.get("/register", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("already authentiocated redirecting to secrets");
        res.redirect("/secrets")
    } else {
        console.log(" not authentiocated redirecting to register");
        res.render("register")
    }
})

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("already authentiocated redirecting to secrets");
        res.redirect("/secrets")
    } else {
        console.log(" not authentiocated redirecting to login");
        res.render("login")
    }
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        console.log(" not authentiocated redirecting to login");
        res.redirect("/login")
    }
})
app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    }
    else {
        console.log(" not authentiocated redirecting to login");
        res.redirect("/login")
    }
})
app.get("/logout", (req, res) => {
    if (req.isAuthenticated) {
        req.logout((err) => {
            if (err) {
                console.log("error logging out \n", err);
                res.redirect('/secrets')
            }
            else {
                console.log("Logged out, redirecting to home page");
                res.redirect("/")
            }
        });
    }
})

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log({ message: "some error occured redirecting to register", err });
            res.redirect("/register")
        }
        if (user) {
            console.log(user)
            passport.authenticate("local")(req, res, () => {
                console.log("authenticated redirecting to /secrets");
                res.redirect("/secrets");
            })
        }
    })
})
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.logIn(user, (err) => {
        if (err) {
            console.log({ "message": "Some error loging in, redirecting to login page", err })
            res.redirect("/login")
        }
        else {
            passport.authenticate("local")(req, res, () => {
                console.log("authenticated redirecting to secrets page");
                res.redirect("/secrets");
            })
        }
    })
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})