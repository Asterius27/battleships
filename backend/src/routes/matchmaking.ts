import express = require('express');
import { ios } from '../app';
import { Mutex } from 'async-mutex';
import * as match from '../models/Match';
import * as chat from '../models/Chat';
import mongoose from 'mongoose';
const router = express.Router();
const mutex = new Mutex();
let queue = [];

let findOpponent = async function(player:string, match_range:number, win_range:number) : Promise<string> {
    if (queue.length > 1) {
        let player_id = new mongoose.Types.ObjectId(player);
        let player_stats = {_id: null, wins: 0, losses: 0};
        let opponent_stats = {_id: null, wins: 0, losses: 0};
        let index = queue.indexOf(player);
        await match.getModel().aggregate([
            {
                $match: {$or: [{playerOne: player_id}, {playerTwo: player_id}]}
            },
            {
                $project: {
                    win: {$cond: {if: {$or: [
                        {$and: [{$eq: ['$result', '1-0']}, {$eq: ['$playerOne', player_id]}]},
                        {$and: [{$eq: ['$result', '0-1']}, {$eq: ['$playerTwo', player_id]}]}
                    ]}, then: 1, else: 0}},
                    loss: {$cond: {if: {$or: [
                        {$and: [{$eq: ['$result', '1-0']}, {$eq: ['$playerTwo', player_id]}]},
                        {$and: [{$eq: ['$result', '0-1']}, {$eq: ['$playerOne', player_id]}]}
                    ]}, then: 1, else: 0}}
                }
            },
            {
                $group: {
                    _id: null,
                    wins: {$sum: '$win'},
                    losses: {$sum: '$loss'}
                }
            }
        ]).then((d) => {
            if (d.length !== 0) {
                player_stats = d[0];
            }
        }).catch((err) => {
            console.log(err);
            return "";
        });
        for (let i = 0; i < queue.length; i++) {
            if (i !== index) {
                let opponent_id = new mongoose.Types.ObjectId(queue[i]);
                await match.getModel().aggregate([
                    {
                        $match: {$or: [{playerOne: opponent_id}, {playerTwo: opponent_id}]}
                    },
                    {
                        $project: {
                            win: {$cond: {if: {$or: [
                                {$and: [{$eq: ['$result', '1-0']}, {$eq: ['$playerOne', opponent_id]}]},
                                {$and: [{$eq: ['$result', '0-1']}, {$eq: ['$playerTwo', opponent_id]}]}
                            ]}, then: 1, else: 0}},
                            loss: {$cond: {if: {$or: [
                                {$and: [{$eq: ['$result', '1-0']}, {$eq: ['$playerTwo', opponent_id]}]},
                                {$and: [{$eq: ['$result', '0-1']}, {$eq: ['$playerOne', opponent_id]}]}
                            ]}, then: 1, else: 0}}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            wins: {$sum: '$win'},
                            losses: {$sum: '$loss'}
                        }
                    }
                ]).then((d) => {
                    if (d.length !== 0) {
                        opponent_stats = d[0];
                    }
                }).catch((err) => {
                    console.log(err);
                    return "";
                });
                let max_matches = player_stats.wins + player_stats.losses + match_range;
                let min_matches = (player_stats.wins + player_stats.losses) - match_range;
                let max_wins = player_stats.wins + win_range;
                let min_wins = player_stats.wins - win_range;
                if (opponent_stats.losses + opponent_stats.wins <= max_matches && opponent_stats.losses + opponent_stats.wins >= min_matches && opponent_stats.wins <= max_wins && opponent_stats.wins >= min_wins) {
                    let opponent = queue[i];
                    if (index !== -1) {
                        queue.splice(index, 1);
                    } else {
                        console.log("player not found in queue");
                    }
                    queue.splice(i, 1);
                    return opponent;
                }
            }
        }
        return "";
    } else {
        return "";
    }
}

router.post('/queue', (req, res, next) => {
    mutex.acquire().then(async (release) => {
        if (!queue.includes(req.auth.id)) {
            queue.push(req.auth.id);
        }
        let opponent_id = "";
        await findOpponent(req.auth.id, req.body.match_range, req.body.win_range).then((id) => {opponent_id = id;});
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
                    ios.emit("newmatch", m);
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
