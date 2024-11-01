import cors from "cors";
import express from "express";
import multer from "multer";
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
        "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, author TEXT, image TEXT)"
    );
})();

// Endpoint existant pour obtenir tous les posts
app.get("/api/consultationDesBlogs", async (req, res) => {
    try {
        const blogs = await db.all("SELECT * FROM posts");
        res.json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Failed to fetch blogs" });
    }
});

const upload = multer({ dest: "uploads/" });

app.post("/api/creationDePublication", upload.single("image"), async (req, res) => {
    const { title, content, author } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const result = await db.run(
        "INSERT INTO posts (title, content, author, image) VALUES (?, ?, ?, ?)",
        title, content, author, imagePath
    );
    res.json({ id: result.lastID });
});

app.delete("/api/consultationDesBlogs/:id", async (req, res) => {
    const { id } = req.params;
    await db.run("DELETE FROM posts WHERE id = ?", id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
