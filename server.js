
// Simple Online Learning Platform Backend (Node + Express + File Storage)
// Run: npm install && node server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const JWT_SECRET = "super_secret_key_change_me";

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DB_PATH)) {
  const seed = {
    users: [],
    courses: [
      {
        id: "c1",
        title: "Intro to Web Development",
        description: "HTML, CSS, and basic JS fundamentals.",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
        quiz: [
          { id: "q1", q: "HTML stands for?", options: ["HyperText Markup Language", "HighText Markdown Language"], answer: 0 },
          { id: "q2", q: "CSS is used for?", options: ["Styling pages", "Storing data"], answer: 0 }
        ]
      },
      {
        id: "c2",
        title: "JavaScript Basics",
        description: "Variables, functions, and DOM.",
        videoUrl: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
        quiz: [
          { id: "q1", q: "let is used to declare?", options: ["Variables", "HTML tags"], answer: 0 },
          { id: "q2", q: "DOM stands for?", options: ["Document Object Model", "Data Object Map"], answer: 0 }
        ]
      }
    ],
    progress: {} // keyed by userId: { [courseId]: { completed: bool, score: number } }
  };
  fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Auth middleware
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Register
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  const db = readDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already registered" });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: "u" + (db.users.length + 1), name, email, password: hashed };
  db.users.push(user);
  writeDB(db);
  res.json({ message: "Registered successfully" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: "User not found" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid password" });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, name: user.name });
});

// Get courses
app.get("/api/courses", (req, res) => {
  const db = readDB();
  const publicCourses = db.courses.map(c => ({
    id: c.id, title: c.title, description: c.description, videoUrl: c.videoUrl
  }));
  res.json(publicCourses);
});

// Get quiz for a course
app.get("/api/courses/:id/quiz", auth, (req, res) => {
  const db = readDB();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  // Do not expose correct answer index
  res.json(course.quiz.map(q => ({ id: q.id, q: q.q, options: q.options })));
});

// Submit quiz
app.post("/api/courses/:id/quiz", auth, (req, res) => {
  const answers = req.body.answers; // array of selected option indices
  const db = readDB();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  let score = 0;
  course.quiz.forEach((q, i) => { if (answers && answers[i] === q.answer) score++; });
  const total = course.quiz.length;
  // save progress
  if (!db.progress[req.user.id]) db.progress[req.user.id] = {};
  db.progress[req.user.id][course.id] = { completed: true, score, total };
  writeDB(db);
  res.json({ score, total });
});

// Get progress for logged in user
app.get("/api/progress", auth, (req, res) => {
  const db = readDB();
  res.json(db.progress[req.user.id] || {});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
