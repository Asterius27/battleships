import express = require('express');
import { ios } from '../app';
import * as match from '../models/Match';
const router = express.Router();
let queue = [];

router.post('/queue', (req, res, next) => {
    queue.push(req.auth.id);
});

module.exports = router;