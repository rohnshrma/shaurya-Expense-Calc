var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var port = 3000;
const md5 = require("md5");

console.log(md5("hello world"));

// mongoose connect // app.liste

mongoose.connect("mongodb://localhost:27017/fetDB").then(() => {
  console.log("Connected To DB");
  app.listen(port, () => {
    console.log(`Server Started On Port ${port}`);
  });
});
// middleware

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static("public"));

app.set("view engine", "ejs");

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

// routes

app.get("/auth/signup", (req, res) => [res.render("signup.ejs")]);

app.get("/auth/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/:category?", (req, res) => {
  var category = req.params.category;
  var filter = category ? { category: category } : {};

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
  var password = md5(req.body.password);
  var user = new User({
    name,
    email,
    password,
  });
  user
    .save()
    .then((savedUser) => {
      console.log(savedUser);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
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
    console.log(`Found Users : ${foundUser}`);
    if (foundUser.password == md5(req.body.password)) {
      res.send("Signed In");
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
