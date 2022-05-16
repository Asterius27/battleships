import express = require('express');
import { ios } from '../app';
import * as chat from '../models/Chat';
import * as message from '../models/Message';
const router = express.Router();

router.post('/', (req, res, next) => {
    let data = {owner: req.auth.id, content: req.body.content};
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

router.get('/:messageid', (req, res, next) => {
    message.getModel().findOne({_id: req.params.messageid}).then((m) => {
        return res.status(200).json(m);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

module.exports = router;