'use strict';

const express = require('express');
const app = express();
const port = process.env.PORT || 4205;
const router = express.Router();
//const routes = require('./routes');
const mtl = require('./magicthelinker');

// pass routes.js to router and initialise
//routes(router);
app.use('/', router);

// start slackBot
mtl.fn.slackBot();

// start server
app.listen(port, function (req, res) {
    console.info(`Started Express server on port ${port}`)
});
