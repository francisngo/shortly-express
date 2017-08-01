var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true
  // intialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     // get() = get the current value of an attribute from the model
  //     // on creating this model, invoke the function
  //     console.log('username:', model.get('username'));
  //     console.log('password:', model.get('password'));
  //   });
  // }

});

// model get username
// model get password
// set has many

module.exports = User;
