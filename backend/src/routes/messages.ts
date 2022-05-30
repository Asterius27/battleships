import express = require('express');
import { ios } from '../app';
import * as chat from '../models/Chat';
import * as message from '../models/Message';
import * as notification from '../models/Notification';
const router = express.Router();

router.post('/', (req, res, next) => {
    let data = {owner: req.auth.id, owner_username: req.auth.username, content: req.body.content, visibility: req.body.visibility};
    let m = message.newMessage(data);
    m.save().then((m) => {
        chat.getModel().findOneAndUpdate({_id: req.body.chat}, {$push: {messages: m.id}}).then(async (c) => {
            ios.emit("newmessage" + c.id, m.id);
            ios.emit("nnewmessage" + c.id, m.id);
            for (let p of c.participants) {
                if (c.type === "friend" && String(p) !== req.auth.id) {
                    await notification.getModel().findOneAndUpdate({user: p}, {$addToSet: {friend_messages: req.auth.id}}).catch((err) => {
                        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                    });
                }
                if (c.type === "moderator" && String(p) !== req.auth.id) {
                    await notification.getModel().findOneAndUpdate({user: p}, {$addToSet: {moderator_messages: c._id}}).catch((err) => {
                        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                    });
                }
            }
            return res.status(200).json(m);
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/', (req, res, next) => {
    if (req.query.visibility === "true") {
        message.getModel().find({_id: {$in: req.query.ids}, visibility: true}).sort({createdAt: -1}).then((ms) => {
            return res.status(200).json(ms);
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    } else {
        message.getModel().find({_id: {$in: req.query.ids}}).sort({createdAt: -1}).then((ms) => {
            return res.status(200).json(ms);
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    }
})

module.exports = router;
