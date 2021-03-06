import express = require('express');
import { ios } from '../app';
import * as user from '../models/User';
import * as match from '../models/Match';
import * as chat from '../models/Chat';
import * as notification from '../models/Notification';
const router = express.Router();

router.post('/request', (req, res, next) => {
    if (req.body.action === 'send') {
        user.getModel().findOne({$and: [{username: req.body.username}, {$or: [{friend_requests: req.auth.id}, {friends_list: req.auth.id}]}]}).then((u) => {
            if (!u) {
                user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friend_requests: req.auth.id}}, {projection: {digest: 0, salt: 0}}).then(async (us) => {
                    ios.emit("newfriendrequest" + req.body.username, req.auth.id);
                    ios.emit("nnewfriendrequest" + req.body.username, req.auth.id);
                    await notification.getModel().findOneAndUpdate({user: us._id}, {friend_request: true}).catch((err) => {
                        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                    });
                    return res.status(200).json(us);
                }).catch((err) => {
                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                });
            } else {
                return next({statusCode: 404, error: true, errormessage: "user already in friends list or already sent the request"});
            }
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
    if (req.body.action === 'accept') {
        user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {friends_list: req.auth.id}}).then(async (u) => {
            ios.emit("friendrequestaccepted" + req.body.username, req.auth.id);
            ios.emit("nfriendrequestaccepted" + req.body.username, req.auth.id);
            await notification.getModel().findOneAndUpdate({user: u._id}, {friend_request_accepted: true}).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
            user.getModel().findOneAndUpdate({username: req.auth.username}, {$push: {friends_list: u._id}, $pull: {friend_requests: u._id}}, {projection: {digest: 0, salt: 0}}).then((us) => {
                return res.status(200).json(us);
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
    if (req.body.action === 'reject') {
        user.getModel().findOne({username: req.body.username}).then((u) => {
            user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {friend_requests: u._id}}, {projection: {digest: 0, salt: 0}}).then((us) => {
                ios.emit("friendrequestrejected" + req.body.username, req.auth.id);
                return res.status(200).json(us);
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

router.post('/play', (req, res, next) => {
    if (req.body.action === 'invite') {
        user.getModel().findOne({username: req.body.username}).then((temp) => {
            user.getModel().findOne({$or: [{$and: [{username: req.auth.username}, {match_invites: temp._id}]}, {$and: [{username: req.body.username}, {match_invites: req.auth.id}]}]}).then((u) => {
                if (!u) {
                    user.getModel().findOneAndUpdate({username: req.body.username}, {$push: {match_invites: req.auth.id}}, {projection: {digest: 0, salt: 0}}).then(async (us) => {
                        ios.emit("newmatchinvite" + req.body.username, req.auth.id);
                        ios.emit("nnewmatchinvite" + req.body.username, req.auth.id);
                        await notification.getModel().findOneAndUpdate({user: us._id}, {match_invite: true}).catch((err) => {
                            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                        });
                        return res.status(200).json(us);
                    }).catch((err) => {
                        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                    });
                } else {
                    return next({statusCode: 404, error: true, errormessage: "Already sent match invite to this user"});
                }
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
    if (req.body.action === 'accept') {
        user.getModel().findOne({username: req.body.username}).then((u) => {
            user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {match_invites: u._id}}).then((us) => {
                let chat_data = {
                    participants: [req.auth.id, u._id],
                    messages: [],
                    type: "match"
                }
                let c = chat.newChat(chat_data);
                c.save().then((ch) => {
                    let data = {
                        playerOne: req.auth.id,
                        playerTwo: u._id,
                        gridOne: [[]],
                        gridTwo: [[]],
                        moves: [],
                        result: "0-0",
                        chat: ch._id
                    };
                    let m = match.newMatch(data);
                    m.setStartingPlayer();
                    m.save().then((m) => {
                        ios.emit("newmatch", m);
                        ios.emit("nnewmatch", m);
                        ios.emit("matchinviteaccepted" + req.body.username, m._id);
                        return res.status(200).json({error: false, errormessage: "", id: m._id});
                    }).catch((err) => {
                        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                    });
                }).catch((err) => {
                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                });
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
    if (req.body.action === 'reject') {
        user.getModel().findOne({username: req.body.username}).then((u) => {
            user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {match_invites: u._id}}, {projection: {digest: 0, salt: 0}}).then((us) => {
                ios.emit("matchinviterejected" + req.body.username, req.auth.id);
                return res.status(200).json(us);
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
    if (req.body.action !== 'invite' && req.body.action !== 'accept' && req.body.action !== 'reject') {
        return next({statusCode: 404, error: true, errormessage: "Bad Request"});
    }
});

router.delete('/:username', (req, res, next) => {
    user.getModel().findOneAndUpdate({username: req.params.username}, {$pull: {friends_list: req.auth.id, match_invites: req.auth.id}}).then((u) => {
        ios.emit("deletedfriend" + req.params.username, req.auth.id);
        user.getModel().findOneAndUpdate({username: req.auth.username}, {$pull: {friends_list: u._id, match_invites: u._id}}, {projection: {digest: 0, salt: 0}}).then((us) => {
            return res.status(200).json(us);
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

module.exports = router;
