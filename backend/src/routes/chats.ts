import express = require('express');
import { ios } from '../app';
import * as chat from '../models/Chat';
const router = express.Router();

router.post('/', (req, res, next) => {
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

router.post('/:chatid/participants', (req, res, next) => {
    chat.getModel().findOneAndUpdate({_id: req.params.chatid}, {$push: {participants: req.auth.id}}).then((c) => {
        return res.status(200).json(c);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/chat/:chatid', (req, res, next) => {
    chat.getModel().findOne({_id: req.params.chatid}).then((c) => {
        return res.status(200).json(c);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/participant/:participantid', (req, res, next) => {
    chat.getModel().find({participants: req.params.participantid}).then((cs) => {
        return res.status(200).json(cs);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

module.exports = router;