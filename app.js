require("dotenv").config()
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const findOrCreate = require("mongoose-findorcreate")
const googleStrategy = require('passport-google-oauth20').Strategy;
const flash=require("express-flash")

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
app.use(flash())

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
    googleId: String,
    secret: String,
    password: { type: String, default: "unset" }
});
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    // db.get('SELECT * FROM users WHERE id = ?', [id], function (err, user) {
    //     if (err) { return cb(err); }
    //     return cb(null, user);
    // });
    User.findById(id, (err, user) => {
        cb(err, user)
    })
});



passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL,
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
    (accessToken, refreshToken, profile, cb) => {
        User.findOne({ username: profile.emails[0].value }, (err, user) => {
            if (err) {
                console.log("Some err occured while finding \n", err)
                req.flash("Some err occured while finding \n", err)
                return cb(err)
            }
            if (!user) {
                console.log("User not found creating new user");
                user = new User({
                    username: profile.emails[0].value,
                    googleId: profile.id
                });
                user.save((err) => {
                    (err) ?
                        console.log("Error creating user\n", err)
                        :
                        console.log("User created successfully");
                    return cb(err, user)
                })
            }
            else {
                user.googleId = profile.id;
                user.save((err) => {
                    (err) ?
                        console.log({ "message": "Some error Occured, Login Again.\n", err })
                        :
                        console.log("User found loggin in");

                    return cb(err, user)
                })
            }
        });
    }
));


app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("/ => User Already authenticated redirecting to secrets page");
        res.redirect("/secrets")
    } else {
        console.log("/ => User not authenticated rendering to home page");
        res.render("home")
    }
})

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
)
app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
    });

app.get("/register", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("/register => User Already authenticated redirecting to secrets page");
        res.redirect("/secrets")
    } else {
        console.log("/register => User not authenticated rendering to regester page");
        res.render("register")
    }
})

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("/login => User Already authenticated redirecting to secrets page");
        res.redirect("/secrets")
    } else {
        console.log("/login => User not authenticated rendering to login page");
        res.render("login")
    }
})

app.get("/secrets", (req, res) => {
    User.find({ "secret": { $ne: null } }, (err, users) => {
        if (err) {
            console.log("Some error occured", err);
            res.redirect("/secrets")
        }
        res.render("secrets", { loggedIn: req.isAuthenticated(), users });
    })
})
app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("/submit => User Already authenticated rendering submit page");
        res.render("submit")
    } else {
        console.log("/submit => User not authenticated redirecting to login page");
        res.redirect("/login")
    }
})
app.get("/logout", (req, res) => {
    if (req.isAuthenticated) {
        req.logout((err) => {
            if (err) {
                console.log("Error logging out \n", err);
                res.redirect('/secrets')
            }
            else {
                console.log("Logged out, redirecting to home page");
                res.redirect("/")
            }
        });
    }
})

app.get("/account", (req, res) => {
    if (req.isAuthenticated()) {
        console.log("/account => User Already authenticated rendering  account page");
        res.render("account")
    } else {
        console.log("/account => User not authenticated redirecting to login page");
        res.redirect("/login")
    }
})

app.post("/register", (req, res) => {
    const username = req.body.username;
    User.findByUsername(username, (err, user) => {
        if (err) {
            console.log("Some error occured\n", err);
        }
        if (user) {
            if (user.googleId != null && user.password == "unset") {
                console.log("user have google id")
                const googleId = user.googleId;
                const secret = user.secret;
                User.findByIdAndDelete(user.id, (err) => {
                    if (err) {
                        console.log("Error deleting previous user\n", err);
                        res.redirect("/register")
                    }
                    else {
                        User.register({ username: username, googleId, secret, password: "set" }, req.body.password, (err, user) => {
                            if (err) {
                                console.log({ message: "some error occured redirecting to register", err });
                                res.redirect("/register")
                            }
                            if (user) {

                                passport.authenticate("local")(req, res, () => {
                                    console.log("authenticated redirecting to /secrets");
                                    res.redirect("/secrets");
                                })
                            }

                        })
                    }
                })

            }
            else {
                console.log("User is already registered try logging in");
                res.redirect("/login");
            }
        } else {
            console.log("User not found creating new one ");
            User.register({ username, password: "set" }, req.body.password, (err, user) => {
                if (err) {
                    console.log({ message: "some error occured redirecting to register", err });
                    res.redirect("/register")
                }
                if (user) {
                    // console.log(user)
                    passport.authenticate("local")(req, res, () => {
                        console.log("authenticated redirecting to /secrets");
                        res.redirect("/secrets");
                    })
                }
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
            req.flash({ "message": "Some error loging in, redirecting to login page", err })
            res.redirect("/login")
        }
        else {
            passport.authenticate("local")(req, res, (err) => {
                if (err) {
                    console.log({ "message": "Some error loging in, redirecting to login page", err })
                    req.flash({ "message": "Some error loging in, redirecting to login page", err })
                    res.render("login")
                }
                else {
                    console.log("authenticated redirecting to secrets page");
                    res.redirect("/secrets");
                }
            })
        }
    })
})

app.post("/submit", (req, res) => {
    const secret = req.body.secret;
    const userId = req.user.id;
    User.findById(userId, (err, user) => {
        if (err) {
            console.log({ "message": "Some error Occured.\n", err })
            res.redirect("/submit")
        }
        else {
            if (user) {
                user.secret = secret;
                user.save((err) => {
                    if (err) {
                        console.log({ "message": "Some error Occured saving the secret.\n", err })
                        res.redirect("/submit")
                    }
                    else {
                        res.redirect("/secrets")
                    }
                })
            }
        }
    })
})

app.post("/account", (req, res) => {
    if (req.isAuthenticated) {
    
        const oldPassword = req.body.old_password;
        // User.findByUsername(req.user.username, (err, user) => {
    //     if (err) {
    //         req.flash("Some error occured while finding user\n", err)
    //         console.log("Some error occured while finding user\n", err)
    //     } else {
            req.user.changePassword(oldPassword,
                req.body.new_password, function (err) {
                    if (err) {
                        req.flash("Some error occured\n", err)
                        console.log("Some error occured\n", err)
                        res.redirect("/account ")
                    } else {
                        console.log('successfully changed password')
                        res.redirect("/")
                    }
                });
                // }
            }
    // });
});
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})