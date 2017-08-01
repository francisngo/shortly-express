var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var saltRounds = 10;
// require db
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
// @ sets path to views
app.set('views', __dirname + '/views');
// @ we set the engine to ejs
// now renders ejs
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/',
  function(req, res) {
    res.render('index');
  });

app.get('/create',
  function(req, res) {
    res.render('index');
  });

app.get('/links',
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  });

app.post('/links',
  function(req, res) {
    var uri = req.body.url;
    // console.log(util.isValidUrl(uri));
    if (!util.isValidUrl(uri)) {
      // console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }
    // console.log('i ran');
    new Link({ url: uri }).fetch().then(function(found) {
      // console.log({found});
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }
          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
            .then(function(newLink) {
              res.status(200).send(newLink);
            });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  //on creating a new user, pass in an attribute object {username: username, password: password} => fetches the model from the database => then => invoke callback function passing in 'found' value
  //if found, handle error
  //otherwise, (create is a collection method) create a new model passing in the given attribute object then pass in 201 status code and redirect user back to '/'

  new User({ username: username, password: password}).fetch().then(function(found) { //fetch => collection
    if (found) {
      //if found, redirect user back to login because username already exists (in db);
      res.status(302).redirect('/login');
    } else {
      var salt = bcrypt.genSaltSync(saltRounds);
      var hash = bcrypt.hashSync(password, salt);
      var data = { //create => collection method
        username: username,
        password: hash,
        salt: salt
      };
      Users.create(data)
      .then(function() {
        res.status(201).redirect('/');
      });
    }
  });
  console.log('signed up successfully');
});
// { data:
//    { username: '2222',
//      password: '$2a$10$ZKZlmwzvqCk8kVgkblU21.HyTW8MdnIJ/kTzpFFuSbqAiAaeqVpWi',
//      salt: '$2a$10$ZKZlmwzvqCk8kVgkblU21.' }
// }

// create links
// collections are classes

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  // directly interact with collection => then talks to model => db
  // create new user
  //create a user and pass in attribute object => fetch the model from database => then => invoke callback function passing in 'found' value
  //if found, (when user successfully logs in), what do we do? redirect them to where?
  //if error, redirect back to login page

  // salt

  new User({username: username, password: password }).fetch().then(function(found) {
    if (found) {
      res.status(201).redirect('/');
    }
    console.log({password});
  });

});
// username === ModelBase = {
//      attributes:
//       { username: '1234',
//         password: '1234',
//         id: 7,
//         salt: null,
//         created_at: 1501613129779,
//         updated_at: 1501613129779 },
//      _previousAttributes:
//       { username: '1234',
//         password: '1234',
//         id: 7,
//         salt: null,
//         created_at: 1501613129779,
//         updated_at: 1501613129779 },
//      changed: {},
//      relations: {},
//      cid: 'c2',
//      _knex: null,
//      id: 7 } }

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
