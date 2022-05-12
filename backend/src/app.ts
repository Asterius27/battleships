import express = require('express');
import bodyparser = require('body-parser');
import mongoose = require('mongoose');
import passport = require('passport');
import passportHTTP = require('passport-http');
import jsonwebtoken = require('jsonwebtoken');
import { expressjwt } from 'express-jwt';
import http = require('http');
import { Server } from 'socket.io';
import * as user from './models/User';

declare global {
  namespace Express {
    interface Request {
      user: {
        username: string,
        name: string,
        surname: string,
        mail: string,
        role: string,
        friends_list: string[],
        id: string
      }
    }
  }
}

const result = require('dotenv').config()
const app = express();
const port = 8000;
const auth = expressjwt({secret: process.env.JWT_SECRET, algorithms: ["HS256"]});
let ios = undefined;

app.use(bodyparser.json());

app.use((req, res, next) => {
  console.log("------------------------------------------------")
  console.log("New request for: " + req.url );
  console.log("Method: " + req.method);
  next();
})

app.get('/', (req, res, next) => {
  return res.status(200).json({api_version: "1.0", endpoints: ["/users", "/login"]});
});

app.get('/users', auth, (req, res, next) => {
  user.getModel().findOne({username: req.query.username}, {digest: 0, salt: 0}).then((user) => {
    return res.status(200).json(user);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
});

app.post('/users', (req, res, next) => {
  let u = user.newUser(req.body);
  if (!req.body.password) {
    return next({statusCode: 404, error: true, errormessage: "Password field missing"});
  }
  u.setPassword(req.body.password);
  u.save().then((data) => {
    return res.status(200).json({error: false, errormessage: "", id: data._id});
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err.errmsg});
  });
});

app.post('/friends/request', auth, (req, res, next) => {
  if (req.body.action === 'send') {
    user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friend_requests: req.user.id}}).then((u) => {
      ios.emit("newfriendrequest" + req.body.username, req.user.id);
      return res.status(200).json(u);
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }
  if (req.body.action === 'accept') {
    user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friends_list: req.user.id}}).then((u) => {
      ios.emit("friendrequestaccepted" + req.body.username, req.user.id);
      user.getModel().findOneAndUpdate({username: req.user.username}, {$push: {friends_list: u._id}, $pull: {friend_requests: u._id}}).then((u) => {
        return res.status(200).json(u);
      }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
      });
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }
  if (req.body.action === 'reject') {
    user.getModel().findOne({username: req.body.username}).then((u) => {
      user.getModel().findOneAndUpdate({username: req.user.username}, {$pull: {friend_requests: u._id}}).then((u) => {
        return res.status(200).json(u);
      }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
      });
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }
  return next({statusCode: 404, error: true, errormessage: "Bad Request"});
});

app.delete('/friends/:username', auth, (req, res, next) => {
  user.getModel().findOneAndUpdate({username: req.params.username}, {$pull: {friends_list: req.user.id}}).then((u) => {
    ios.emit("deletedfriend" + req.params.username, req.user.id);
    user.getModel().findOneAndUpdate({username: req.user.username}, {$pull: {friends_list: u._id}}).then((u) => {
      return res.status(200).json(u);
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
})

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
  let server = http.createServer(app);
  ios = new Server(server);
  ios.on("connection", (client) => {
    console.log("Socket.io client connected");
  });
  ios.on("connect_error", (err) => {
    console.log(err.message);
  });
  server.listen(port, () => {
    console.log(`Express is listening at http://localhost:${port}`);
  });
});