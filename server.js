const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const albums = require("./data/albums");

const app = express();


const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const PROJECT_FILE = path.join(DATA_DIR, "projects.json");

// Load saved projects from JSON
let projects = [];
try {
  if (fs.existsSync(PROJECT_FILE)) {
    const raw = fs.readFileSync(PROJECT_FILE, "utf8");
    projects = JSON.parse(raw);
  } else {
    fs.writeFileSync(PROJECT_FILE, "[]");
    projects = [];
  }
} catch (err) {
  console.error("Error loading projects:", err);
  projects = [];
}

// Save to JSON file
function saveProjects() {
  try {
    fs.writeFileSync(PROJECT_FILE, JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error("Error saving projects:", err);
  }
}
// ----------------------------------------------------

// CORS
app.use(cors());
app.use(express.json());

// Static public folder
app.use(express.static(path.join(__dirname, "public")));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";


const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, "public", "images")),
  filename: (_req, file, cb) =>
    cb(null, file.originalname),
});

const upload = multer({ storage });

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

app.delete("/api/projects/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = projects.findIndex((p) => p._id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  const removed = projects.splice(index, 1)[0];
  saveProjects();

  // delete image
  if (removed.img) {
    const fileName = removed.img.split("/images/")[1];
    const filePath = path.join(__dirname, "public", "images", fileName);
    fs.unlink(filePath, () => {});
  }

  res.json({ removed });
});

app.get("/api/albums", (req, res) => {
  res.json(albums);
});

app.get("/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
