import AlaSQL from "alasql";
import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";

// Initialisation d'AlaSQL
const alasql = AlaSQL;
alasql(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTOINCREMENT PRIMARY KEY,
        title STRING,
        description STRING,
        status STRING
    )
`);
alasql(`
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTOINCREMENT PRIMARY KEY,
        username STRING UNIQUE,
        password STRING
    )
`);

const app = express();
const PORT = process.env.PORT || 5000;

// Version de l'application
const APP_VERSION = '1.0.0';

// Configuration CORS
const allowedOrigins = [
    'https://infinitix-task-manager.vercel.app',
    'https://infinitix-task-manager.onrender.com',
    'http://localhost:5173'
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'UPDATE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Endpoint pour obtenir la version de l'application
app.get('/api/version', (req, res) => {
    res.json({ version: APP_VERSION });
});

// Endpoint pour obtenir toutes les tâches
app.get("/api/tasks", (req, res) => {
    try {
        const tasks = alasql("SELECT * FROM tasks");
        res.json(tasks);
    } catch (error) {
        console.error("Erreur lors de la récupération des tâches:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des tâches" });
    }
});

// Endpoint d'inscription
app.post("/api/inscription", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        alasql("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
        res.status(201).json({ message: "Inscription réussie" });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ error: "Erreur lors de la création du compte" });
    }
});

// Endpoint de connexion
app.post("/api/connexion", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = alasql("SELECT * FROM users WHERE username = ?", [username])[0];
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
app.post("/api/tasks", (req, res) => {
    const { title, description, status } = req.body;

    try {
        alasql("INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)", [title, description, status]);
        res.status(201).json({ message: "Tâche créée" });
    } catch (error) {
        console.error("Erreur lors de la création de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la création de la tâche" });
    }
});

// Endpoint pour mettre à jour une tâche
app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    try {
        const result = alasql("UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?", [title, description, status, parseInt(id)]);
        if (result === 0) {
            return res.status(404).json({ error: "Tâche non trouvée" });
        }
        res.status(200).json({ message: "Tâche mise à jour" });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la mise à jour de la tâche" });
    }
});

// Endpoint pour supprimer une tâche
app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;

    try {
        alasql("DELETE FROM tasks WHERE id = ?", [parseInt(id)]);
        res.status(204).send();
    } catch (error) {
        console.error("Erreur lors de la suppression de la tâche:", error);
        res.status(500).json({ error: "Erreur lors de la suppression de la tâche" });
    }
});

//Port
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
