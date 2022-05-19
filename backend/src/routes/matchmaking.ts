import express = require('express');
import { ios } from '../app';
import { Mutex } from 'async-mutex';
import * as match from '../models/Match';
import * as chat from '../models/Chat';
const router = express.Router();
const mutex = new Mutex();
let queue = [];

let findOpponent = function(player:string) : string {
    if (queue.length > 1) {
        let index = queue.indexOf(player);
        if (index !== -1) {
            queue.splice(index, 1);
        } else {
            console.log("player not found in queue");
        }
        for (let i = 0; i < queue.length; i++) {
            // TODO base matchmaking on player stats
            let opponent = queue[i];
            queue.splice(i, 1);
            return opponent;
        }
    } else {
        return "";
    }
}

router.post('/queue', (req, res, next) => {
    mutex.acquire().then((release) => {
        queue.push(req.auth.id);
        let opponent_id = findOpponent(req.auth.id);
        release();
        if (opponent_id) {
            let chat_data = {
                participants: [req.auth.id, opponent_id],
                messages: [],
                type: "match"
            }
            let c = chat.newChat(chat_data);
            c.save().then((ch) => {
                let data = {
                    playerOne: req.auth.id,
                    playerTwo: opponent_id,
                    gridOne: [[]],
                    gridTwo: [[]],
                    moves: [],
                    result: "0-0",
                    chat: ch._id
                };
                let m = match.newMatch(data);
                m.setStartingPlayer();
                m.save().then((m) => {
                    ios.emit("newmatch", m._id, m.playerTwo);
                    return res.status(200).json({error: false, errormessage: "", id: m._id});
                }).catch((err) => {
                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                });
            }).catch((err) => {
                return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
            });
        } else {
            return res.status(200).json({status: "player queued"});
        }
    });
});

router.delete('/queue', (req, res, next) => {
    mutex.acquire().then((release) => {
        let index = queue.indexOf(req.auth.id);
        if (index !== -1) {
            queue.splice(index, 1);
            release();
            return res.status(200).json({status: "removed player from queue"});
        } else {
            release();
            return next({statusCode: 404, error: true, errormessage: "Player not in queue"});
        }
    });
});

module.exports = router;