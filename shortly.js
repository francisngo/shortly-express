var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

//hash/salt
var bcrypt = require('bcrypt-nodejs');
var saltRounds = 10;

// sessions
var session = require('express-session');

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

app.use(session({
  secret: 'cake is a lie', //required
  resave: false, //forces session to be saved back to session store
  saveUninitialized: true, //forces a session identifier cookie to be set on every response
  cookie: { secure: true } //specifies boolean value for Secure Set-Cookie attribut
}));



app.get('/', function(req, res) {
  // console.log('req.session: ', req.session);
  var doesExist = false;
  // if has user exists (express/sessions) then index else login

  // if (doesExist) {
  res.render('index');
  // } else {
    // res.status(200).redirect('login');
  // }
});

app.get('/create', function(req, res) {
  // var doesExist = false;
  // // if has user exists (express/sessions) then index else login
  // if (doesExist) {
  res.render('create');
  // } else {
  //   res.status(200).redirect('login');
  // }
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', function(req, res) {
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

// OUR SIGN UP =================/////////
app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var data = { username: username };
  new User(data).fetch().then(function(found) { //fetch => collection
    if (found) {
      //if found, redirect user back to login because username already exists (in db)
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


// OUR LOGIN =================/////////
app.post('/login', function(req, res) {
  // console.log('POST LOGIN LINE 151');
  var username = req.body.username;
  var passwordInput = req.body.password; //record password

  new User({ username: username }).fetch().then(function(found) {
    if (found) {

      var salt = found.attributes.salt;
      var savedPass = found.attributes.password;
      var hash = bcrypt.hashSync(passwordInput, salt);
      var passDoesMatch = savedPass === hash;
      if (passDoesMatch) {
        res.status(201).redirect('/');
      } else {
        res.status(302).redirect('/login');
      }
    } else {
      res.status(302).redirect('/signup');
    }
  });

});

// OUR LOGOUT =================/////////


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
