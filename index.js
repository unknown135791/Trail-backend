import express from "express";
import pkg from "pg";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   Middleware
======================= */
app.use(cors());
app.use(express.json());

/* =======================
   Database connection
======================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* =======================
   Init DB (auto-create table)
======================= */
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ users table ready");
  } catch (err) {
    console.error("❌ DB init error", err);
  }
}

pool.connect()
  .then(() => {
    console.log("✅ Database connected");
    initDB();
  })
  .catch(err => console.error("❌ DB connection error", err));

/* =======================
   Root route
======================= */
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

/* =======================
   SIGNUP
======================= */
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id,name,email,created_at",
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Signup successful",
      user: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User already exists or DB error" });
  }
});

/* =======================
   LOGIN
======================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   ADMIN: VIEW ALL USERS
   (TEMPORARY – remove later)
======================= */
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* =======================
   Start server
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});