const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const albums = require("./data/albums");

const app = express();

// -------------------- PROJECT STORAGE --------------------
const PROJECT_FILE = path.join(__dirname, "data", "projects.json");

let projects = [];
try {
  if (fs.existsSync(PROJECT_FILE)) {
    const raw = fs.readFileSync(PROJECT_FILE, "utf8");
    projects = JSON.parse(raw);
  }
} catch (err) {
    console.log("Error loading projects file:", err);
}

function saveProjects() {
  fs.writeFileSync(PROJECT_FILE, JSON.stringify(projects, null, 2));
}
// ----------------------------------------------------------

// GLOBAL SETTINGS
app.use(cors());
app.use(express.json());

// STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, "public", "images")),
  filename: (_req, file, cb) =>
    cb(null, file.originalname),
});
const upload = multer({ storage });
// -----------------------------

// ---------- PROJECT ROUTES ----------

app.get("/api/projects", (req, res) => {
  res.json(projects);
});

app.post("/api/projects", upload.single("img"), (req, res) => {
  const { title, category, year, blurb } = req.body;

  if (!title || !category || !year || !blurb) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const imageUrl = req.file
    ? `${BASE_URL}/images/${req.file.originalname}`
    : null;

  const newProject = {
    _id: Date.now(),
    title,
    category,
    year,
    blurb,
    img: imageUrl,
  };

  projects.push(newProject);
  saveProjects(); 

  res.json(newProject);
});

// DELETE PROJECT
app.delete("/api/projects/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = projects.findIndex((p) => p._id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  const removed = projects.splice(index, 1)[0];
  saveProjects();

  // Delete image file too
  if (removed.img) {
    const fileName = removed.img.split("/images/")[1];
    const filePath = path.join(__dirname, "public", "images", fileName);
    fs.unlink(filePath, () => {});
  }

  res.json({ removed });
});

// -------------- ALBUM ROUTES --------------
app.get("/api/albums", (req, res) => {
  res.json(albums);
});

// -------------- FRONTEND FALLBACK --------------
app.get("/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
