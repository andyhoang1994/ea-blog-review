"use strict";

const express = require("express");
const app = express();
const path = require('path');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const HTTP_PORT = 8000;

// Sets the view engine for the frontend
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.use(express.static('./public'));

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