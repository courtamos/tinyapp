const express = require("express");
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');


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

const urlDatabase = { // 'database' to store key:value pairs of URLs
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": {longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = { // 'database' to store key:value pairs for users
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


const generateRandomString = function() {  // generate random alphanumeric characters (aka shortURLs)
  return Math.random().toString(20).substr(2, 6);
};

const userEmailLookup = function(database, email) { // helper function to lookup user by email and return the entire user object if found or null if not
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

const urlsForUser = function(database, id) { // helper function to return the URLs for a specified user
  let userURLS = {};
  
  for (let key in database) {
    if (database[key].userID === id) {
      userURLS[key] = database[key];
    }
  }

  return userURLS;
};

// ----- APP.GET -----
app.get("/", (req, res) => {  // homepage route
  res.redirect("/login");
});


app.get("/urls", (req, res) => { // passing the URL data to template (urls_index.ejs)
  const user = users[req.session.user_id];

  if (!user) {
    return res.send('To view this page you must be logged in. Please login or register!');
  }

  const userURLS = urlsForUser(urlDatabase, user.id);
  const templateVars = { urls: userURLS, user: user };

  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => { // rendering the template in the browers (urls_new.ejs)
  const templateVars = { user: users[req.session.user_id] };
  const user = users[req.session.user_id];

  if (!user) {
    return res.redirect('/login');
  }
  
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => { // display a single URL and its shortURL
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


app.get("/u/:shortURL", (req, res) => { // redirecting shortURL to correct longURL
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


app.get("/register", (req, res) => { // rending the register template in brower
  const templateVars = { user: users[req.session.user_id] };

  if (templateVars.user) {
    res.redirect("/urls");
  }

  res.render("urls_register", templateVars);
});


app.get("/login", (req, res) => { // rendering the login template in browser
  const templateVars = { user: users[req.session.user_id] };

  if (templateVars.user) {
    res.redirect("/urls");
  }

  res.render("urls_login", templateVars);
});


// ----- APP.POST -----
app.post("/urls", (req, res) => { // creating/saving a new URL and storing it to urlDatabase object
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


app.post("/urls/:shortURL/delete", (req, res) => { // deleting/removing a URL
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


app.post("/urls/:shortURL", (req, res) => { // edit/update a shortURL's longURL
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


app.post("/login", (req, res) => { // login route to set cookie named user_id
  const user = userEmailLookup(users, req.body.email);

  if (!user) {
    return res.status(403).send('Email not found. Please register!');
  }

  bcrypt.compare(req.body.password, user.password, function(err, result) {
    if (err) return res.status(400).send('Error logging in');

    if (!result) {
      return res.status(403).send('Password is incorrect. Try again!');
    }

    console.log("password L: ", req.body.password);
    console.log("hashed L: ", user.password);

    req.session.user_id = user.id;
    res.redirect('/urls');
  });
});


app.post("/logout", (req, res) => { // logout route that clears cookie
  req.session = null;

  res.redirect('/login');
});


app.post("/register", (req, res) => { // register route
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send('Email and Password fields can NOT be empty');
  }

  const user = userEmailLookup(users, email);
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

    console.log("password R: ", password);
    console.log("hashed R: ", hash);

    users[id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect("/urls");
  });
});


// ----- APP.LISTEN -----
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});