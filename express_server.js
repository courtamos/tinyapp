// ----- EXPRESS SETUP -----
const express = require("express");
const app = express();
const PORT = 8080;


// ----- MORGAN MIDDLEWARE SETUP -----
const morgan = require('morgan'); // morgan middleware (gives transparency to incoming & outcoming infomation to the server)
app.use(morgan('dev'));


// ----- COOKIE-PARSER SETUP -----
const cookieParser = require('cookie-parser');
app.use(cookieParser());


app.set("view engine", "ejs");  // use EJS as the templating engine
app.use(express.urlencoded({extended: true})); // used instead of body-parser(deprecated)


const urlDatabase = { // 'database' to store key:value pairs of URLs
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { // 'database' to store key:value pairs for users
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
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

// ----- APP.GET -----
app.get("/", (req, res) => {  // homepage route
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls", (req, res) => { // passing the URL data to template (urls_index.ejs)
  
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => { // rendering the template in the browers (urls_new.ejs)
  const templateVars = { user: users[req.cookies.user_id] };
  
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => { // display a single URL and its shortURL
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => { // redirecting shortURL to correct longURL
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


app.get("/register", (req, res) => { // rending the register template in brower
  const templateVars = { user: users[req.cookies.user_id] };

  res.render("urls_register", templateVars);
});


// ----- APP.POST -----
app.post("/urls", (req, res) => { // creating/saving a new URL and storing it to urlDatabase object
  // console.log("req.body: ", req.body);

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body["longURL"];

  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => { // deleting/removing a URL
  // console.log('in delete route');

  const shortURLDelete = req.params.shortURL;
  delete urlDatabase[shortURLDelete];

  res.redirect("/urls");
});


app.post("/urls/:shortURL", (req, res) => { // edit/update a shortURL's longURL
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body["longURL"];

  res.redirect("/urls");
});


app.post("/login", (req, res) => { // login route to set cookie named username
  const username = req.body["username"];
  res.cookie('username', username);

  res.redirect('/urls');
});


app.post("/logout", (req, res) => { // logout route that clears cookie
  res.clearCookie('username');

  res.redirect('/urls');
});


app.post("/register", (req, res) => { // register route
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  const newUser = {
    id,
    email,
    password
  };

  if (!email || !password) {
    res.status(400).send('Email and Password fields can NOT be empty');
    res.end();
  }

  const user = userEmailLookup(users, email);

  if (user) {
    res.status(400).send('Email is already registered');
    res.end();
  }

  users[id] = newUser;

  res.cookie('user_id', id);
  res.redirect("/urls");
});


// ----- APP.LISTEN -----
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});