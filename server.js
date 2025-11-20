const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const albums = require("./data/albums");

const app = express();

const PUBLIC_DIR = path.join(__dirname, "public");
const IMAGES_DIR = path.join(PUBLIC_DIR, "images");

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR);
}

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const PROJECT_FILE = path.join(DATA_DIR, "projects.json");

let projects = [];
try {
  if (fs.existsSync(PROJECT_FILE)) {
    projects = JSON.parse(fs.readFileSync(PROJECT_FILE, "utf8"));
  } else {
    fs.writeFileSync(PROJECT_FILE, "[]");
    projects = [];
  }
} catch {
  projects = [];
}

function saveProjects() {
  try {
    fs.writeFileSync(PROJECT_FILE, JSON.stringify(projects, null, 2));
  } catch {}
}

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  "https://ovofansserver.onrender.com";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => cb(null, file.originalname),
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

  if (removed.img) {
    const filename = removed.img.split("/images/")[1];
    const filepath = path.join(IMAGES_DIR, filename);
    fs.unlink(filepath, () => {});
  }

  res.json({ removed });
});

app.get("/api/albums", (req, res) => {
  res.json(albums);
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
