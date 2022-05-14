import express = require('express');
import { ios } from '../app';
import * as user from '../models/User';
const router = express.Router();

router.post('/request', (req, res, next) => {
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

router.delete('/:username', (req, res, next) => {
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

module.exports = router;