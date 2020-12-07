"use strict";

const express = require('express');
const db = require('../database/db');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const router = express.Router();

/* Front-end Route */
// Populates mock data and displays it on '/' route
router.get('/', function (req, res) {
    let mockText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat"
    
    db.serialize(() => {
        let userStatement = db.prepare("INSERT INTO users (username, first_name, last_name) VALUES (?, ?, ?);");
        let postStatement = db.prepare("INSERT INTO posts (user_id, date, title, body) VALUES (?, ?, ?, ?);");
        let commentStatement = db.prepare("INSERT INTO comments (post_id, user_id, date, body) VALUES (?, ?, ?, ?);");

        for(let i = 0; i < 10; i++) {
            userStatement.run([
                "User" + "_" + (Math.random() * 10000000),
                String.fromCharCode(('A').charCodeAt(0) + i) + "im",
                String.fromCharCode(('A').charCodeAt(0) + i) + "ones"
            ]);
        }
        userStatement.finalize();

        for(let i = 0; i < 20; i++) {
            postStatement.run([
                Math.floor(Math.random() * 10) + 1,
                new Date().toISOString(),
                "Test Post " + (i + 1),
                mockText.slice(Math.floor(Math.random() * 10), 36 - Math.floor(Math.random() * 10))
            ]);
        }
        postStatement.finalize();

        for(let i = 0; i < 40; ++i) {
            commentStatement.run([
                Math.floor(Math.random() * 20) + 1,
                Math.floor(Math.random() * 10) + 1,
                new Date().toISOString(),
                mockText.slice(Math.floor(Math.random() * 10), 36 - Math.floor(Math.random() * 10))
            ])
        }
        commentStatement.finalize();

        db.all("SELECT * FROM posts INNER JOIN users ON posts.user_id = users.id;",
            [],
            (err, posts) => {
                db.all(`SELECT comments.*, users.username FROM comments
                    INNER JOIN users ON comments.user_id = users.id;`,
                    [],
                    (err, comments) => {
                        res.render('home', { posts: posts, comments: comments });
                    }
                );
            }
        )
    });
    

});

/* User Routes */
// Get all users in database
router.get("/users", (req, res) => {
    db.all("SELECT * FROM users;",
        [],
        (err, rows) => {
            if(err) {
                res.status(400).json({ "error": err.message }); // Bad request error
                return;
            }
            else if(rows.length == 0) {
                res.status(204).json(rows); // Request processed but no data was found
                return;
            }

            res.status(200).json(rows); // OK. Users found
            return;
        }
    );
});

// Create user 
router.post("/users", jsonParser, (req, res) => {
    let reqBody = req.body;
    
    db.run("INSERT INTO users (username, first_name, last_name) VALUES (?, ?, ?);",
        [reqBody.username, reqBody.first_name, reqBody.last_name],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: err.message }) // Bad request error
                }

                return;
            }

            res.status(201).json({ message: "User successfully created", userId: this.lastID }); // OK. User created
            return;
        }
    );
})

// Get user of specific id
router.get("/users/:id", (req, res) => {
    let userId = req.params.id;
    
    db.get(`SELECT * FROM users WHERE id = ?;`,
        [userId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. User found
            return;
        }
    );
});

// Update entire user of id
router.patch("/users/:id", jsonParser, (req, res) => {
    let reqBody = req.body;
    let userId = req.params.id;

    db.run(`UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE id = ?;`,
        [reqBody.username, reqBody.first_name, reqBody.last_name, userId],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            res.status(200).json({ message: "User successfully updated" }); // OK. User updated
            return;
        }
    );
});

// Delete user of id
router.delete("/users/:id", (req, res) => {
    let userId = req.params.id;
    
    db.run(`DELETE FROM users WHERE id = ?;`,
        [userId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No user of that ID found" }) // No user found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "User successfully deleted" }); // OK. User deleted
            return;
        }
    );
});

// Get all post of user of id
router.get("users/:id/posts", (req, res) => {
    let userId = req.params.id;
    
    db.get(`SELECT * FROM posts WHERE user_id = ?;`,
        [userId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. Posts found
            return;
        }
    );
});

// Delete all post of user of id
router.delete("/users/:id/posts", (req, res) => {
    let userId = req.params.id;
    
    db.run(`DELETE FROM posts WHERE user_id = ?;`,
        [userId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No posts from user found" }) // No user found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "Posts successfully deleted" }); // OK. Posts deleted
            return;
        }
    );
});

// Get all comments of user of id
router.get("users/:id/comments", (req, res) => {
    let userId = req.params.id;
    
    db.get(`SELECT * FROM comments WHERE user_id = ?;`,
        [userId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. Comments found
            return;
        }
    );
});

// Delete all comments of user of id
router.delete("/users/:id/comments", (req, res) => {
    let userId = req.params.id;
    
    db.run(`DELETE FROM comments WHERE user_id = ?;`,
        [userId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No comments from user found" }) // No user found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "Posts successfully deleted" }); // OK. Comments deleted
            return;
        }
    );
});

/* Post Routes */
// Get all posts
router.get("/posts", (req, res) => {
    db.all("SELECT * FROM posts;",
        [],
        (err, rows) => {
            if(err) {
                res.status(400).json({ "error": err.message }); // Bad request error
                return;
            }
            else if(rows.length == 0) {
                res.status(204).json(rows); // Request processed but no data was found
                return;
            }

            res.status(200).json(rows); // OK. Posts found
            return;
        }
    );
});

// Create post
router.post("/posts", jsonParser, (req, res) => {
    let reqBody = req.body;

    db.run("INSERT INTO posts (user_id, date, title, body) VALUES (?, ?, ?, ?);",
        [reqBody.user_id, reqBody.date, reqBody.title, reqBody.body],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: err.message }) // Bad request error
                }

                return;
            }

            res.status(201).json({ message: "Post successfully created", userId: this.lastID }); // OK. Post created
            return;
        }
    );
});

// Get post of id
router.get("/posts/:id", (req, res) => {
    let postId = req.params.id;
    
    db.get(`SELECT * FROM posts WHERE id = ?;`,
        [postId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. Post found
            return;
        }
    );
});

// Update post
router.patch("/posts/:id", jsonParser, (req, res) => {
    let reqBody = req.body;
    let postId = req.params.id;

    db.run(`UPDATE posts SET title = ?, body = ?, date = ? WHERE id = ?;`,
        [reqBody.title, reqBody.body, reqBody.date, postId],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }
            res.status(200).json({ message: "Post successfully updated" }); // OK. Post updated
            return;
        }
    );
});

// Delete post of id
router.delete("/posts/:id", (req, res) => {
    let postId = req.params.id;
    
    db.run(`DELETE FROM posts WHERE id = ?;`,
        [postId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No post of that ID found" }) // No post found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "Post successfully deleted" }); // OK. Post deleted
            return;
        }
    );
});

// Get all comments of post of id
router.get("/posts/:id/comments", (req, res) => {
    let postId = req.params.id;
    
    db.all(`SELECT * FROM comments WHERE post_id = ?;`,
        [postId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. Comments found
            return;
        }
    );
});

// Delete all comments of post of id
router.delete("/posts/:id/comments", (req, res) => {
    let postId = req.params.id;
    
    db.run(`DELETE FROM comments WHERE post_id = ?;`,
        [postId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No post of that ID found" }) // No comments found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "Post successfully deleted" }); // OK. Comments deleted
            return;
        }
    );
});

/* Comment Routes */
// Get all comments
router.get("/comments", (req, res) => {
    db.all("SELECT * FROM comments;",
        [],
        (err, rows) => {
            if(err) {
                res.status(400).json({ "error": err.message }); // Bad request error
                return;
            }
            else if(rows.length == 0) {
                res.status(204).json(rows); // Request processed but no data was found
                return;
            }

            res.status(200).json(rows); // OK. Comments found
            return;
        }
    );
});

// Create comment
router.post("/comments", jsonParser, (req, res) => {
    let reqBody = req.body;

    db.run("INSERT INTO comments (post_id, user_id, date, body) VALUES (?, ?, ?, ?);",
        [reqBody.post_id, reqBody.user_id, reqBody.date, reqBody.body],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: err.message }) // Bad request error
                }

                return;
            }

            res.status(201).json({ message: "Comment successfully created" }); // OK. Comment created
            return;
        }
    );
});

// Get comment of id
router.get("/comments/:id", (req, res) => {
    let commentId = req.params.id;
    
    db.get(`SELECT * FROM comments WHERE id = ?;`,
        [commentId],
        function (err, row) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }

            if(row === undefined) {
                res.status(204).end(); // Request processed but no data was found
                return;
            }

            res.status(200).json(row); // OK. Comment found
            return;
        }
    );
});

// Updates comment
router.patch("/comments/:id", jsonParser, (req, res) => {
    let reqBody = req.body;
    let commentId = req.params.id;

    db.run(`UPDATE comments SET body = ?, date = ? WHERE id = ?;`,
        [reqBody.body, reqBody.date, commentId],
        function (err) {
            if(err) {
                if(err.errno == 19) {
                    res.status(422).json({ error: "Could not process object" }); // Proper JSON but bad request
                }
                else {
                    res.status(400).json({ error: res.message }) // Bad request error
                }

                return;
            }
            res.status(200).json({ message: "Comment successfully updated" }); // OK. Comment updated
            return;
        }
    );
});

// Deletes post of id
router.delete("/comments/:id", (req, res) => {
    let commentId = req.params.id;
    
    db.run(`DELETE FROM comments WHERE id = ?;`,
        [commentId],
        function (err) {
            if (err) {
                res.status(400).send({ error: res.message }); // Bad request error
                return;
            }
            else if(this.changes == 0) {
                res.status(404).send({ error: "No comment of that ID found" }) // No comment found. Nothing to delete
                return;
            }

            res.status(200).send({ message: "Comment successfully deleted" }); // OK. Comment deleted
            return;
        }
    );
});

module.exports = router;