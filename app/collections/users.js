var db = require('../config');
var User = require('../models/user');

//creates a new collection of users
var Users = new db.Collection();

Users.model = User;

module.exports = Users;
