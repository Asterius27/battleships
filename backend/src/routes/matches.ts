import express = require('express');
import { ios } from '../app';
import * as match from '../models/Match';
const router = express.Router();

router.post('/', (req, res, next) => {
    let data = {
        playerOne: req.auth.id,
        playerTwo: req.body.opponent,
        gridOne: [[]],
        gridTwo: [[]],
        moves: [],
        result: "0-0",
        chat: req.body.chat
    };
    let m = match.newMatch(data);
    m.setStartingPlayer();
    m.save().then((m) => {
        ios.emit("newmatch", m._id, m.playerTwo);
        return res.status(200).json({error: false, errormessage: "", id: m._id});
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.post('/:matchid/grid', (req, res, next) => {
    match.getModel().findOne({_id: req.params.matchid}).then((m) => {
        if (req.auth.id === String(m.playerOne)) {
            if (match.isValidGrid(req.body.grid)) {
                match.getModel().updateOne({gridOne: req.body.grid}).then(() => {
                    ios.emit(m._id, "player one submitted his grid");
                    return res.status(200).json(m);
                }).catch((err) => {
                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                });
            } else {
                return next({statusCode: 404, error: true, errormessage: "Grid is not valid"});
            }
        }
        if (req.auth.id === String(m.playerTwo)) {
            if (match.isValidGrid(req.body.grid)) {
                match.getModel().updateOne({gridTwo: req.body.grid}).then(() => {
                    ios.emit(m._id, "player two submitted his grid");
                    return res.status(200).json(m);
                }).catch((err) => {
                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                });
            } else {
                return next({statusCode: 404, error: true, errormessage: "Grid is not valid"});
            }
        }
        if (req.auth.id !== String(m.playerTwo) && req.auth.id !== String(m.playerOne)) {
            return next({statusCode: 404, error: true, errormessage: "You are not a player"});
        }
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.post('/:matchid/move', (req, res, next) => {
    if (match.isMove(req.body.move)) {
        match.getModel().findOne({_id: req.params.matchid}).then((m) => {
            if (req.auth.id === String(m.playerOne) || req.auth.id === String(m.playerTwo)) {
                if (((req.auth.id === String(m.startingPlayer)) && ((m.moves.length % 2) === 0)) || ((req.auth.id !== String(m.startingPlayer)) && ((m.moves.length % 2) !== 0))) {
                    if (req.auth.id === String(m.playerOne)) {
                        if (m.validateMove(req.body.move, true)) {
                            m.updateGrid(req.body.move, true);
                            m.updateMoves(req.body.move);
                            if (m.isMatchFinished()) {
                                m.save().then((data) => {
                                    ios.emit(m._id, "match is finished", m.result);
                                    return res.status(200).json(data);
                                }).catch((err) => {
                                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                                });
                            } else {
                                m.save().then((data) => {
                                    ios.emit(m._id, req.auth.id + " made his move");
                                    return res.status(200).json(data);
                                }).catch((err) => {
                                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                                });
                            }
                        } else {
                            return next({statusCode: 404, error: true, errormessage: "Invalid move"});
                        }
                    }
                    if (req.auth.id === String(m.playerTwo)) {
                        if (m.validateMove(req.body.move, false)) {
                            m.updateGrid(req.body.move, false);
                            m.updateMoves(req.body.move);
                            if (m.isMatchFinished()) {
                                m.save().then((data) => {
                                    ios.emit(m._id, "match is finished", m.result);
                                    return res.status(200).json(data);
                                }).catch((err) => {
                                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                                });
                            } else {
                                m.save().then((data) => {
                                    ios.emit(m._id, req.auth.id + " made his move");
                                    return res.status(200).json(data);
                                }).catch((err) => {
                                    return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
                                });
                            }
                        } else {
                            return next({statusCode: 404, error: true, errormessage: "Invalid move"});
                        }
                    }
                } else {
                    return next({statusCode: 404, error: true, errormessage: "It's not your turn"});
                }
            } else {
                return next({statusCode: 404, error: true, errormessage: "You are not a player"});
            }
        }).catch((err) => {
            return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
        });
    } else {
        return next({statusCode: 404, error: true, errormessage: "Invalid move format"});
    }
});

router.get('/id/:matchid', (req, res, next) => {
    match.getModel().findById(req.params.matchid).then((m) => {
        return res.status(200).json(m);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/mymatches', (req, res, next) => {
    match.getModel().find({$or: [{playerOne: req.auth.id}, {playerTwo: req.auth.id}]}).then((ms) => {
        return res.status(200).json(ms);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
});

router.get('/grid', (req, res, next) => {
    let grid = null;
    while (!grid) {
        grid = match.createRandomGrid()
    }
    let data = {
        grid: grid
    };
    return res.status(200).json(data);
});

router.get('/ongoing', (req, res, next) => {
    match.getModel().find({result: "0-0"}).then((ms) => {
        return res.status(200).json(ms);
    }).catch((err) => {
        return next({statusCode: 404, error: true, errormessage: "DB error: " + err});
    });
})

module.exports = router;