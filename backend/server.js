import cors from "cors";
import express from "express";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const app = express();
const PORT = 5000;

const allowedOrigins = ['http://localhost:5173'];
const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

let db;
(async () => {
    db = await open({
        filename: "./blog.db",
        driver: sqlite3.Database,
    });
    await db.exec(
        "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, author TEXT)"
    );
})();

app.get("/api/posts", async (req, res) => {
    const posts = await db.all("SELECT * FROM posts");
    res.json(posts);
});

app.post("/api/posts", async (req, res) => {
    const { title, content, author } = req.body;
    const result = await db.run(
        "INSERT INTO posts (title, content, author) VALUES (?, ?, ?)",
        title, content, author
    );
    res.json({ id: result.lastID });
});

app.delete("/api/posts/:id", async (req, res) => {
    const { id } = req.params;
    await db.run("DELETE FROM posts WHERE id = ?", id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
