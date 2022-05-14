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
import * as match from './models/Match';

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
        temporary: boolean,
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
        temporary: boolean,
        id: string
      }
    }
  }
}

const result = require('dotenv').config()
const app = express();
const port = 8000;
const auth = expressjwt({secret: process.env.JWT_SECRET, algorithms: ["HS256"]});
export let ios = undefined; // TODO check if this works

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

app.use('/users', auth, require('./routes/users'));
app.use('/friends', auth, require('./routes/friends'));
app.use('/chats', auth, require('./routes/chats'));

app.post('/messages', auth, (req, res, next) => {
  let data = {owner: req.auth.id, content: req.body.message};
  let m = message.newMessage(data);
  m.save().then((m) => {
    chat.getModel().findOneAndUpdate({_id: req.body.chat}, {$push: {messages: m.id}}).then((c) => {
      ios.emit("newmessage" + c.id, m.id);
      return res.status(200).json(c);
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/messages/:messageid', auth, (req, res, next) => {
  message.getModel().findOne({_id: req.params.messageid}).then((m) => {
    return res.status(200).json(m);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.post('/matches', auth, (req, res, next) => {
  let data = {
    playerOne: req.auth.id,
    playerTwo: req.body.opponent,
    gridOne: [[]],
    gridTwo: [[]],
    moves: []
  }
  let m = match.newMatch(data);
  m.setStartingPlayer();
  m.save().then((m) => {
    ios.emit("newmatch", m._id, m.playerTwo);
    return res.status(200).json({error: false, errormessage: "", id: m._id});
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.post('/matches/:matchid/grid', auth, (req, res, next) => {
  match.getModel().findOne({_id: req.params.matchid}).then((m) => {
    if (req.auth.id === String(m.playerOne)) {
      if (match.isValidGrid(req.body.grid)) {
        match.getModel().updateOne({gridOne: req.body.grid}).then(() => {
          ios.emit(m._id, "player one submitted his grid");
          return res.status(200).json(m);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
      } else {
        return next({statusCode: 404, error: true, errormessage: "Grid is not valid"});
      }
    }
    if (req.auth.id === String(m.playerTwo)) {
      if (match.isValidGrid(req.body.grid)) {
        match.getModel().updateOne({gridTwo: req.body.grid}).then(() => {
          ios.emit(m._id, "player two submitted his grid");
          return res.status(200).json(m);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
      } else {
        return next({statusCode: 404, error: true, errormessage: "Grid is not valid"});
      }
    }
    if (req.auth.id !== String(m.playerTwo) && req.auth.id !== String(m.playerOne)) {
      return next({statusCode: 404, error: true, errormessage: "You are not a player"});
    }
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.post('/matches/:matchid/move', auth, (req, res, next) => {
  match.getModel().findOne({_id: req.params.matchid}).then((m) => {
    if (req.auth.id === String(m.playerOne) || req.auth.id === String(m.playerTwo)) {
      if ((req.auth.id === String(m.startingPlayer)) && ((m.moves.length % 2) === 0)) {
        match.getModel().updateOne({$push: {moves: req.body.move}}).then(() => {
          ios.emit(m._id, req.auth.id + " made his move");
          return res.status(200).json(m);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
      }
      if ((req.auth.id !== String(m.startingPlayer)) && ((m.moves.length % 2) !== 0)) {
        match.getModel().updateOne({$push: {moves: req.body.move}}).then(() => {
          ios.emit(m._id, req.auth.id + " made his move");
          return res.status(200).json(m);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
      }
      if (!((req.auth.id !== String(m.startingPlayer)) && ((m.moves.length % 2) !== 0)) && !((req.auth.id === String(m.startingPlayer)) && ((m.moves.length % 2) === 0))) {
        return next({statusCode: 404, error: true, errormessage: "It's not your turn"});
      }
    } else {
      return next({statusCode: 404, error: true, errormessage: "You are not a player"});
    }
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/matches/:matchid', auth, (req, res, next) => {
  match.getModel().findById(req.params.matchid).then((m) => {
    return res.status(200).json(m);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/grid', auth, (req, res, next) => {
  let grid = null;
  while (!grid) {
    grid = match.createRandomGrid()
  }
  let data = {
    grid: grid
  };
  return res.status(200).json(data);
});

app.post('/signup', (req, res, next) => {
  let data = {
      name: req.body.name,
      surname: req.body.surname,
      username: req.body.username,
      mail: req.body.mail,
      role: "UTENTE",
      friends_list: [],
      friend_requests: [],
      temporary: false,
      password: req.body.password
  };
  let u = user.newUser(data);
  if (!req.body.password) {
      return next({statusCode: 404, error: true, errormessage: "Password field missing"});
  }
  u.setPassword(req.body.password);
  u.save().then((data) => {
      return res.status(200).json({error: false, errormessage: "", id: data._id});
  }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
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
  return res.status(200).json({error: false, errormessage: "", token: token_signed, temporary: req.user.temporary});
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