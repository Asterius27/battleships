import express = require('express');
import * as user from '../models/User';
import * as message from '../models/Message';
import * as chat from '../models/Chat';
import * as match from '../models/Match';
const router = express.Router();

router.get('/username/:username', (req, res, next) => {
    user.getModel().findOne({username: req.params.username}, {digest: 0, salt: 0}).then((u) => {
        return res.status(200).json(u);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/id/:userid', (req, res, next) => {
    user.getModel().findOne({_id: req.params.userid}, {digest: 0, salt: 0}).then((u) => {
        return res.status(200).json(u);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.post('/moderator', (req, res, next) => {
    if (req.auth.role === 'MODERATOR') {
        let data = {
            name: "placeholder",
            surname: "placeholder",
            username: req.body.username,
            mail: "placeholder",
            role: "MODERATOR",
            friends_list: [],
            friend_requests: [],
            match_invites: [],
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

router.patch('/:username', (req, res, next) => {
    if (req.auth.username === req.params.username) {
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
    } else {
        return next({statusCode: 404, error: true, errormessage: "Unauthorized"});
    }
});

router.delete('/:username', async (req, res, next) => {
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
        await match.getModel().deleteMany({$or: [{playerOne: deleted_user_id}, {playerTwo: deleted_user_id}]}).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
        await user.getModel().updateMany({match_invites: deleted_user_id}, {$pull: {match_invites: deleted_user_id}}).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
        return res.status(200).json({error: false, errormessage: "", id: deleted_user_id});
    } else {
        return next({statusCode: 404, error: true, errormessage: "Unauthorized"});
    }
});

module.exports = router;