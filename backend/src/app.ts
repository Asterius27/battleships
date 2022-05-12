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
import * as message from './models/Message';
import * as chat from './models/Chat';

declare global {
  namespace Express {
    interface Request {
      auth: {
        username: string,
        name: string,
        surname: string,
        mail: string,
        role: string,
        friends_list: string[],
        friend_requests: string[],
        id: string
      },
      user: {
        username: string,
        name: string,
        surname: string,
        mail: string,
        role: string,
        friends_list: string[],
        friend_requests: string[],
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

app.get('/users/:username', auth, (req, res, next) => {
  user.getModel().findOne({username: req.params.username}, {digest: 0, salt: 0}).then((u) => {
    return res.status(200).json(u);
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
    user.getModel().findOne({$and: [{username: req.body.username}, {$or: [{friend_requests: req.auth.id}, {friends_list: req.auth.id}]}]}).then((u) => {
      if (!u) {
        user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friend_requests: req.auth.id}}).then((u) => {
          ios.emit("newfriendrequest" + req.body.username, req.auth.id);
          return res.status(200).json(u);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
        });
      } else {
        return next({statusCode: 404, error: true, errormessage: "user already in friends list or already sent the request"});
      }
    });
  }
  if (req.body.action === 'accept') {
    user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friends_list: req.auth.id}}).then((u) => {
      ios.emit("friendrequestaccepted" + req.body.username, req.auth.id);
      user.getModel().findOneAndUpdate({username: req.auth.username}, {$push: {friends_list: u._id}, $pull: {friend_requests: u._id}}).then((u) => {
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
      user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {friend_requests: u._id}}).then((u) => {
        return res.status(200).json(u);
      }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
      });
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }
  if (req.body.action !== 'send' && req.body.action !== 'accept' && req.body.action !== 'reject') {
    return next({statusCode: 404, error: true, errormessage: "Bad Request"});
  }
});

app.delete('/friends/:username', auth, (req, res, next) => {
  user.getModel().findOneAndUpdate({username: req.params.username}, {$pull: {friends_list: req.auth.id}}).then((u) => {
    ios.emit("deletedfriend" + req.params.username, req.auth.id);
    user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {friends_list: u._id}}).then((u) => {
      return res.status(200).json(u);
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
});

app.post('/chats', auth, (req, res, next) => {
  let data = {participants: req.body.participants.push(req.auth.id), messages: []};
  let c = chat.newChat(data);
  c.save().then((c) => {
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err.errmsg});
  });
});

app.post('/chats/:chatid/participants', auth, (req, res, next) => {
  chat.getModel().findOneAndUpdate({_id: req.params.chatid}, {$push: {participants: req.auth.id}}).then((c) => {
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
});

app.get('/chats/:chatid', auth, (req, res, next) => {
  chat.getModel().findOne({_id: req.params.chatid}).then((c) => {
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
});

app.get('/chats/:participantid', auth, (req, res, next) => {
  chat.getModel().find({participants: req.params.participantid}).then((cs) => {
    return res.status(200).json(cs);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
});

app.post('/messages', auth, (req, res, next) => {
  let data = {owner: req.auth.id, content: req.body.message};
  let m = message.newMessage(data);
  m.save().then((m) => {
    chat.getModel().findOneAndUpdate({_id: req.body.chat}, {$push: {messages: m.id}}).then((c) => {
      ios.emit("newmessage" + c.id, m.id);
      return res.status(200).json(c);
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err.errmsg});
  });
});

app.get('/messages/:messageid', auth, (req, res, next) => {
  message.getModel().findOne({_id: req.params.messageid}).then((m) => {
    return res.status(200).json(m);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: "+ err});
  });
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