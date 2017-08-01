var db = require('../config');
var Link = require('./link.js');

var Click = db.Model.extend({ //bookshelf knex
  tableName: 'clicks', //database table 'clicks'
  hasTimestamps: true, //has timestamps
  link: function() {
    return this.belongsTo(Link, 'linkId'); //"this click model belongs to the link"
  }
});

module.exports = Click;
