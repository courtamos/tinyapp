const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');


const app = express();
const PORT = 8080;
const saltRounds = 10;

app.set("view engine", "ejs");  // use EJS as the templating engine
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true})); // used instead of body-parser(deprecated)

app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"]
}));

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$7JHZ2AZr.s48bX3UYCIJYOOc1ZxcLTJm0wyG7Ww//BFgF5v8Exzu2"
    // password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$7ozzzE0f42EPABOvQEPJWuiuntejoAQaiWS4YwyilDTGEpnmiWIe2"
    // password: "dishwasher-funk"
  }
};


// ----- APP.GET -----
// homepage
app.get("/", (req, res) => {
  res.redirect("/login");
});

// rendering the url template in browser
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    return res.send('To view this page you must be logged in. Please login or register!');
  }

  const userURLS = urlsForUser(urlDatabase, user.id);
  const templateVars = { urls: userURLS, user: user };

  res.render("urls_index", templateVars);
});

// rendering the newURL template in browser
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  const user = users[req.session.user_id];

  if (!user) {
    return res.redirect('/login');
  }
  
  res.render("urls_new", templateVars);
});

// display a single URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  const user = users[req.session.user_id];

  if (!user) {
    return res.redirect('/login');
  }

  const urlEntry = urlDatabase[req.params.shortURL];
  if (urlEntry.userID !== user.id) {
    return res.status(401).send('You do not have access to edit this shortURL');
  }
  
  res.render("urls_show", templateVars);
});

// redirecting shortURL to correct longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// rending the register template in brower
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  if (templateVars.user) {
    res.redirect("/urls");
  }

  res.render("urls_register", templateVars);
});

// rendering the login template in browser
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };

  if (templateVars.user) {
    res.redirect("/urls");
  }

  res.render("urls_login", templateVars);
});

// ----- APP.POST -----
// creating/saving a new URL route
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('No userID provided');
  }

  const user = users[req.session.user_id];
  if (!user) {
    return res.status(401).send('User not found');
  }

  const isValidURL = req.body["longURL"].startsWith('http://') || req.body["longURL"].startsWith('https://');
  if (!isValidURL) {
    return res.status(400).send('Invalid URL entry, must start with http:// or https://');
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body["longURL"], userID: user.id };

  res.redirect(`/urls/${shortURL}`);
});

// delete shortURL route
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = users[req.session.user_id].id;

  if (!userID) {
    return res.status(401).send('No userID provided');
  }

  const urlEntry = urlDatabase[shortURL];
  if (urlEntry.userID !== userID) {
    return res.status(401).send('You do not have access to delete this shortURL');
  }

  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

// edit a shortURL route
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = users[req.session.user_id].id;

  if (!userID) {
    return res.status(401).send('No userID provided');
  }

  const urlEntry = urlDatabase[shortURL];
  if (urlEntry.userID !== userID) {
    return res.status(401).send('You do not have access to edit this shortURL');
  }

  urlDatabase[shortURL].longURL = req.body["longURL"];

  res.redirect("/urls");
});

// login route
app.post("/login", (req, res) => {
  const user = getUserByEmail(users, req.body.email);

  if (!user) {
    return res.status(403).send('Email not found. Please register!');
  }

  bcrypt.compare(req.body.password, user.password, function(err, result) {
    if (err) return res.status(400).send('Error logging in');

    if (!result) {
      return res.status(403).send('Password is incorrect. Try again!');
    }

    req.session.user_id = user.id;
    res.redirect('/urls');
  });
});

// logout route
app.post("/logout", (req, res) => {
  req.session = null;

  res.redirect('/login');
});

// register route
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('Email and Password fields can NOT be empty');
  }

  const user = getUserByEmail(users, email);
  if (user) {
    return res.status(400).send('Email is already registered');
  }

  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) return res.status(400).send('Error saving user');
    
    const newUser = {
      id,
      email,
      password: hash
    };

    users[id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect("/urls");
  });
});

// ----- APP.LISTEN -----
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});