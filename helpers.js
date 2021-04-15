const getUserByEmail = function(database, email) { // lookup user by email
  for (let key in database) {
    if (database[key].email === email) {
      return database[key];
    }
  }
  return null;
};

const generateRandomString = function() {  // generate random alphanumeric characters
  return Math.random().toString(20).substr(2, 6);
};

const urlsForUser = function(database, id) { // returns the URLs for a specified user
  let userURLS = {};
  
  for (let key in database) {
    if (database[key].userID === id) {
      userURLS[key] = database[key];
    }
  }

  return userURLS;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };