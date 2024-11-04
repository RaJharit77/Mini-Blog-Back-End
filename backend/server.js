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
        "CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, title TEXT, description TEXT, status TEXT)"
    );
    await db.exec(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)"
    );
})();

// Endpoint pour obtenir toutes les tâches
app.get("/api/tasks", async (req, res) => {
    try {
        const tasks = await db.all("SELECT * FROM tasks");
        res.json(tasks);
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des tâches" });
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

// Endpoint pour créer une nouvelle tâche
app.post("/api/tasks", async (req, res) => {
    const { title, description, status } = req.body;
    try {
        const result = await db.run(
            "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
            title, description, status
        );
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la création de la tâche" });
    }
});

// Endpoint pour mettre à jour une tâche
app.put("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;
    try {
        await db.run(
            "UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?",
            title, description, status, id
        );
        res.status(200).json({ message: "Tâche mise à jour" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour de la tâche" });
    }
});

// Endpoint pour supprimer une tâche
app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.run("DELETE FROM tasks WHERE id = ?", id);
        res.status(204).send();
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la suppression de la tâche" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
