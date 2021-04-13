const express = require("express");
const app = express();
const PORT = 8080;


// ----- MORGAN MIDDLEWARE -----
const morgan = require('morgan'); // morgan middleware (gives transparency to incoming & outcoming infomation to the server)
app.use(morgan('dev'));


app.set("view engine", "ejs");  // use EJS as the templating engine
app.use(express.urlencoded({extended: true})); // used instead of body-parser(deprecated)


const urlDatabase = { // database to store key:value pairs of URLs
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


const generateRandomString = function() {  // generate random alphanumeric characters (aka shortURLs)
  return Math.random().toString(20).substr(2, 6);
};

// ----- APP.GET -----
app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls", (req, res) => { // passing the URL data to template (urls_index.ejs)
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => { // rending the template in the browers (urls_new.ejs)
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => { // display a single URL and its shortURL
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => { // redirecting shortURL to correct longURL
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


// ----- APP.POST -----
app.post("/urls", (req, res) => { // creating/saving a new URL and storing it to urlDatabase object
  console.log(req.body);
  res.send("Ok");

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body["longUrl"] };

  res.redirect(`/urls/${shortURL}`);
});


// ----- APP.LISTEN -----
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});