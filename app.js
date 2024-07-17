require("dotenv").config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var port = 3000;
var bcrypt = require("bcrypt");
var passport = require("passport");
const Strategy = require("passport-local").Strategy;
const session = require("express-session");

var saltRounds = 11;

var session = require("express-session");
// mongoose connect // app.liste

mongoose.connect("mongodb://localhost:27017/fetDB").then(() => {
  console.log("Connected To DB");
  app.listen(port, () => {
    console.log(`Server Started On Port ${port}`);
  });
});
// middleware

app.use(
  session({
    secret: "hello world",
    saveUninitialized: true,
    resave: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());

// schema

var expenseSchema = new mongoose.Schema({
  name: { type: String, required: true, minLength: 3 },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
});
var userSchema = new mongoose.Schema({
  name: { type: String, required: true, minLength: 3 },
  email: { type: String, required: true, minLength: 8, unique: true },
  password: { type: String, required: true, minLength: 8 },
});

// model

const Expense = mongoose.model("expense", expenseSchema);
const User = mongoose.model("user", userSchema);

app.use((req, res, next) => {
  console.log(req.session);
  next();
});

// routes

app.get("/auth/signup", (req, res) => [res.render("signup.ejs")]);

app.get("/auth/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/:category?", (req, res) => {
  var category = req.params.category;
  var filter = category ? { category: category } : {};

  if (req.session.userId) {
    console.log("user found", req.session.userId);
  }

  Expense.find(filter)
    .then((foundExpenses) => {
      if (foundExpenses.length > 0) {
        console.log(foundExpenses);
        res.render("index", {
          data: foundExpenses,
        });
      } else {
        res.render("index", {
          data: "No expenses found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/auth/signup", (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (!err) {
      var user = new User({
        name,
        email,
        password: hash,
      });
      user
        .save()
        .then((savedUser) => {
          console.log(savedUser);
          req.session.userId = savedUser._id;
          res.redirect("/");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});
app.post("/", (req, res) => {
  var name = req.body.name;
  var amount = req.body.amount;
  var category = req.body.category;
  var expense = new Expense({
    name,
    amount,
    category,
  });
  expense
    .save()
    .then((savedExpense) => {
      console.log(savedExpense);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});
app.post("/auth/login", (req, res) => {
  User.findOne({ email: req.body.email }).then((foundUser) => {
    console.log(foundUser);
    if (foundUser) {
      bcrypt.compare(req.body.password, foundUser.password, (err, result) => {
        if (!err) {
          if (result) {
            res.send("Logged In");
          } else {
            res.send("Incorrect Password");
          }
        }
      });
    } else {
      res.send("No user found");
    }
  });
});

app.get("/delete/:id", (req, res) => {
  var id = req.params.id;
  Expense.findByIdAndDelete(id)
    .then((deletedExpense) => {
      console.log(deletedExpense);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

passport.use(
  new Strategy(async function Verify(username, password, cb) {
    try {
      const user = await User.findOne({ email: username });
      if (user) {
        bcrypt.compare(passport, user.password, (err, isValid) => {
          if (err) {
            console.error("Error Comparing Passwords : ", err);
            return cb(err);
          }
          if (isValid) {
            return cb(null, user);
          } else {
            return cb(null, false, { message: "Incorrect Password." });
          }
        });
      } else {
        return cb(null, false, { message: "User Not Found" });
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser(async (user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});
