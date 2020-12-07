"use strict";

const express = require("express");
const app = express();
const bodyParser = require('body-parser');

const jsonParser = bodyParser.json();

const HTTP_PORT = 8000;

// Starts server
app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});

// Catches invalid JSON before it hits routes
app.use(jsonParser, (error, req, res, next) => {
    if(error) {
        res.status(400).json({ error: error.message }); // Bad request error
        return;
    }
    else {
        next();
    }
})

app.use(require("./routes"));