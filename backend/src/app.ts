import express = require('express');
import bodyparser = require('body-parser');
import mongoose = require('mongoose');
import passport = require('passport');
import passportHTTP = require('passport-http');
import jsonwebtoken = require('jsonwebtoken');
import { expressjwt } from 'express-jwt';
import * as user from './models/User'

declare global {
  namespace Express {
    interface Request {
      user: {
        username: string,
        name: string,
        surname: string,
        mail: string,
        role: string,
        id: string
      }
    }
  }
}

const result = require('dotenv').config()
const app = express();
const port = 3000;
const auth = expressjwt({secret: process.env.JWT_SECRET, algorithms: ["HS256"]});

app.use(bodyparser.json());

app.use((req, res, next) => {
  console.log("------------------------------------------------")
  console.log("New request for: " + req.url );
  console.log("Method: " + req.method);
  next();
})

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/users', (req, res, next) => {
  let u = user.newUser(req.body);
  console.log(req.body);
  if (!req.body.password) {
    return next({statusCode: 404, error: true, errormessage: "Password field missing"});
  }
  u.setPassword(req.body.password);
  u.save().then((data) => {
    return res.status(200).json({error: false, errormessage: "", id: data._id});
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err.errmsg});
  })
});

passport.use(new passportHTTP.BasicStrategy(
  function(username, password, done) {
    console.log("New login attempt from " + username);
    user.getModel().findOne({username: username}, (err, user) => {
      if (err) {
        return done({statusCode: 500, error: true, errormessage:err});
      }
      if (!user) {
        return done(null, false, {statusCode: 500, error: true, errormessage: "Invalid user"});
      }
      if (user.validatePassword(password)) {
        return done(null, user);
      }
      return done(null, false, {statusCode: 500, error: true, errormessage: "Invalid password"});
    })
  }
));

app.get('/login', passport.authenticate('basic', {session: false}), (req, res, next) => {
  let tokendata = {
    username: req.user.username,
    name: req.user.name,
    surname: req.user.surname,
    mail: req.user.mail,
    role: req.user.role,
    id: req.user.id
  };
  let token_signed = jsonwebtoken.sign(tokendata, process.env.JWT_SECRET, {expiresIn: '5h'});
  return res.status(200).json({error: false, errormessage: "", token: token_signed});
})

app.use(function(err, req, res, next) {
  console.log("Request error: " + JSON.stringify(err));
  res.status(err.statusCode || 500).json(err);
});

app.use((req, res, next) => {
  res.status(404).json({statusCode: 404, error: true, errormessage: "Invalid endpoint"});
});

mongoose.connect(process.env.DATABASE_URL).then(() => {
  app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
  });
});