const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";

    assert.equal(user.id, expectedOutput);
  });

  it('should return a undefined with invalid email', function() {
    const user = getUserByEmail(testUsers, "fake@example.com");
    const expectedOutput = undefined;

    assert.equal(user, expectedOutput);
  });
});