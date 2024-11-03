import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use('/uploads', express.static('uploads'));

let db;
(async () => {
    db = await open({
        filename: "./blog.db",
        driver: sqlite3.Database,
    });

    await db.exec(
        "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, author TEXT, subject TEXT)"
    );
    await db.exec(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)"
    );
})();

// Endpoint existant pour obtenir tous les posts
app.get("/api/consultationDesBlogs", async (req, res) => {
    try {
        const blogs = await db.all("SELECT *, datetime('now') AS createdAt FROM posts");
        res.json(blogs);
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({ error: "Failed to fetch blogs" });
    }
});

// Endpoint d'inscription
app.post("/api/inscription", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hachage du mot de passe

    try {
        const result = await db.run(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            username, hashedPassword
        );
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ error: "Erreur lors de la création du compte" });
    }
});

// Endpoint de connexion
app.post("/api/connexion", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await db.get("SELECT * FROM users WHERE username = ?", username);
        if (user && await bcrypt.compare(password, user.password)) {
            res.status(200).json({ message: "Connexion réussie" });
        } else {
            res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect" });
        }
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ error: "Erreur lors de la connexion" });
    }
});

// Endpoint pour créer
app.post("/api/creationDePublication", async (req, res) => {
    const { title, content, author, subject } = req.body;

    try {
        const result = await db.run(
            "INSERT INTO posts (title, content, author, subject) VALUES (?, ?, ?, ?)",
            title, content, author, subject
        );
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error("Erreur lors de la création de la publication:", error);
        res.status(500).json({ error: "Erreur lors de la création de la publication" });
    }
});

// Endpoint pour supprimer
app.delete("/api/consultationDesBlogs/:id", async (req, res) => {
    const { id } = req.params;
    await db.run("DELETE FROM posts WHERE id = ?", id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
