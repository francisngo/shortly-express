var db = require('../config');
var Link = require('../models/link');

//creates a new collection of links
var Links = new db.Collection();

Links.model = Link;

module.exports = Links;
