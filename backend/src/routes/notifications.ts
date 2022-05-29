import express = require('express');
import * as notification from '../models/Notification';
const router = express.Router();

router.get('/', (req, res, next) => {
    notification.getModel().findOne({user: req.auth.id}).then((d) => {
        return res.status(200).json(d);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.patch('/', (req, res, next) => {
    notification.getModel().findOne({user: req.auth.id}).then((d) => {
        if (d) {
            d.deleteNotifications(req.body);
            d.save().then((noti) => {
                return res.status(200).json(noti);
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        } else {
            return res.status(200).json(d);
        }
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

module.exports = router;
