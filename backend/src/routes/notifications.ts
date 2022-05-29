import express = require('express');
import * as notification from '../models/Notification';
const router = express.Router();

// needed?
router.post('/', (req, res, next) => {
    notification.getModel().findOne({user: req.auth.id}).then((d) => {
        if (!d) {
            let data = {
                user: req.auth.id, 
                friend_request: req.body.friend_request || false,
                match_invite: req.body.match_invite || false,
                friend_request_accepted: req.body.friend_request_accepted || false,
                friend_messages: req.body.friend_messages || [],
                moderator_messages: req.body.moderator_messages || [],
                match_alerts: req.body.match_alerts || []
            }
            let n = notification.newNotification(data);
            n.save().then((noti) => {
                return res.status(200).json(noti);
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        } else {
            d.setNotifications(req.body);
            d.save().then((noti) => {
                return res.status(200).json(noti);
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        }
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

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
