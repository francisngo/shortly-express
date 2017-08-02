var db = require('../config');
var Click = require('./click');
var crypto = require('crypto');

var Link = db.Model.extend({
  tableName: 'urls',
  hasTimestamps: true,
  defaults: {
    visits: 0
  },
  clicks: function() {
    return this.hasMany(Click); //returns the click models in 'clicks' table that matches this link. === "this link model has many clicks"
  },
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      var shasum = crypto.createHash('sha1');
      // console.log({shasum});
      shasum.update(model.get('url'));

      // console.log('model.get(\'url\')', model.get('url'));
      // console.log('shasum.digest(\'hex\').slice(0, 5)', shasum.digest('hex').slice(0, 5));

      model.set('code', shasum.digest('hex').slice(0, 5));
    });
  }
});

module.exports = Link;




// at some point it stores actual url into url column table urls

// gets url base url is local host
// shasum digests link into code 2387f
// baseUrl + code is our bitly link
// http://127.0.0.1:4568/2387f
