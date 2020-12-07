"use strict";

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // Database is initialized in memory. Will not persist

// Initialize tables. Serialized to ensure proper foreign key constraints
db.serialize(function() {
    // Allow foreign_keys in SQLite
    db.run(`PRAGMA foreign_keys = ON;`);
    // Initialize users table
    db.run(`
        CREATE TABLE users ( 
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            username NVARCHAR(32) UNIQUE NOT NULL,
            first_name NVARCHAR(32) NOT NULL,
            last_name NVARCHAR(32) NOT NULL
    );`);
    // Initializes posts table. If a user is deleted, their posts will be too
    db.run(`
        CREATE TABLE posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            title NVARCHAR(255) NOT NULL,
            body NVARCHAR(255) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE CASCADE
    );`);
    // Initializes comments table. If a user or post associated with the comment is deleted, the comment will be too
    db.run(`
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            body NVARCHAR(256) NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id)
                ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
                ON DELETE CASCADE
    );`);
});

module.exports = db;