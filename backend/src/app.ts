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
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/users/:userid', auth, (req, res, next) => {
  user.getModel().findOne({_id: req.params.userid}, {digest: 0, salt: 0}).then((u) => {
    return res.status(200).json(u);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
})

app.post('/users', (req, res, next) => {
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

app.post('/users/moderator', auth, (req, res, next) => {
  if (req.auth.role === 'MODERATOR') {
    let data = {
      name: req.body.name,
      surname: req.body.surname,
      username: req.body.username,
      mail: req.body.mail,
      role: "MODERATOR",
      friends_list: [],
      friend_requests: [],
      temporary: true,
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
  } else {
    return next({statusCode: 404, error: true, errormessage: "Unauthorized"});
  }
});

app.patch('/users/:username', auth, (req, res, next) => {
  if (!req.body.password) {
    return next({statusCode: 404, error: true, errormessage: "Password field missing"});
  }
  user.getModel().findOneAndUpdate({username: req.params.username}, {
    name: req.body.name,
    surname: req.body.surname,
    username: req.body.username,
    mail: req.body.mail,
    temporary: false
  }, {new: true}).then((u) => {
    u.setPassword(req.body.password);
    u.save().then((data) => {
      return res.status(200).json({error: false, errormessage: "", id: data._id});
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.delete('/users/:username', auth, async (req, res, next) => {
  if (req.auth.role === 'MODERATOR') {
    let deleted_user_id = undefined;
    let deleted_messages_ids = [];
    await user.getModel().findOne({username: req.params.username}).then((u) => {
      deleted_user_id = u._id;
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await user.getModel().deleteOne({username: req.params.username}).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await user.getModel().updateMany({friends_list: deleted_user_id}, {$pull: {friends_list: deleted_user_id}}).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await user.getModel().updateMany({friend_requests: deleted_user_id}, {$pull: {friend_requests: deleted_user_id}}).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await message.getModel().find({owner: deleted_user_id}).then((ms) => {
      for (let m of ms) {
        deleted_messages_ids.push(m._id);
      }
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await message.getModel().deleteMany({owner: deleted_user_id}).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    await chat.getModel().updateMany({participants: deleted_user_id}, {$pull: {participants: deleted_user_id}, $pullAll: {messages: deleted_messages_ids}}).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
    return res.status(200).json({error: false, errormessage: "", id: deleted_user_id});
  } else {
    return next({statusCode: 404, error: true, errormessage: "Unauthorized"});
  }
});

app.post('/friends/request', auth, (req, res, next) => {
  if (req.body.action === 'send') {
    user.getModel().findOne({$and: [{username: req.body.username}, {$or: [{friend_requests: req.auth.id}, {friends_list: req.auth.id}]}]}).then((u) => {
      if (!u) {
        user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friend_requests: req.auth.id}}).then((u) => {
          ios.emit("newfriendrequest" + req.body.username, req.auth.id);
          return res.status(200).json(u);
        }).catch((err) => {
          return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
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
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
      });
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
  }
  if (req.body.action === 'reject') {
    user.getModel().findOne({username: req.body.username}).then((u) => {
      user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {friend_requests: u._id}}).then((u) => {
        return res.status(200).json(u);
      }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
      });
    }).catch((err) => {
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
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
      return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.post('/chats', auth, (req, res, next) => {
  let array = []
  array.push(String(req.auth.id));
  for (let elem of req.body.participants) {
    array.push(String(elem));
  }
  let data = {participants: array, messages: []};
  let c = chat.newChat(data);
  c.save().then((c) => {
    for (let p of array) {
      ios.emit("newchat" + p, c._id);
    }
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.post('/chats/:chatid/participants', auth, (req, res, next) => {
  chat.getModel().findOneAndUpdate({_id: req.params.chatid}, {$push: {participants: req.auth.id}}).then((c) => {
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/chats/:chatid', auth, (req, res, next) => {
  chat.getModel().findOne({_id: req.params.chatid}).then((c) => {
    return res.status(200).json(c);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
  });
});

app.get('/chats/:participantid', auth, (req, res, next) => {
  chat.getModel().find({participants: req.params.participantid}).then((cs) => {
    return res.status(200).json(cs);
  }).catch((err) => {
    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
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