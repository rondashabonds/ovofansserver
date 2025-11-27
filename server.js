const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const albums = require("./data/albums");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const PROJECT_FILE = path.join(DATA_DIR, "projects.json");
let projects = [];

if (fs.existsSync(PROJECT_FILE)) {
  try {
    const raw = fs.readFileSync(PROJECT_FILE, "utf8");
    projects = JSON.parse(raw);
  } catch {
    projects = [];
  }
} else {
  fs.writeFileSync(PROJECT_FILE, "[]");
  projects = [];
}

function saveProjects() {
  try {
    fs.writeFileSync(PROJECT_FILE, JSON.stringify(projects, null, 2));
  } catch {}
}

const IMAGES_DIR = path.join(__dirname, "images");
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

app.use("/images", express.static(path.join(__dirname, "images")));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";


app.get("/api/projects", (req, res) => {
  res.json(projects);
});


app.post("/api/projects", upload.single("img"), (req, res) => {
  const { title, category, year, blurb } = req.body;

  if (!title || !category || !year || !blurb) {
    return res.status(400).json({ error: "Missing fields" });
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

app.put("/api/projects/:id", upload.single("img"), (req, res) => {
  const id = Number(req.params.id);

  const index = projects.findIndex((p) => p._id === id);
  if (index === -1) return res.status(404).json({ error: "Project not found" });

  const { title, category, year, blurb } = req.body;

  if (!title || !category || !year || !blurb) {
    return res.status(400).json({ error: "Missing fields" });
  }

  
  let imageUrl = projects[index].img;

  
  if (req.file) {
    imageUrl = `${BASE_URL}/images/${req.file.originalname}`;

    
    const oldFile = projects[index].img?.split("/images/")[1];
    if (oldFile) {
      const oldPath = path.join(IMAGES_DIR, oldFile);
      fs.unlink(oldPath, () => {});
    }
  }

  
  const updated = {
    ...projects[index],
    title,
    category,
    year,
    blurb,
    img: imageUrl,
  };

  projects[index] = updated;
  saveProjects();

  res.json(updated);
});


app.delete("/api/projects/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = projects.findIndex((p) => p._id === id);
  if (index === -1) return res.status(404).json({ error: "Not found" });

  const removed = projects.splice(index, 1)[0];
  saveProjects();

  if (removed.img) {
    const fileName = removed.img.split("/images/")[1];
    const filePath = path.join(IMAGES_DIR, fileName);
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
app.listen(PORT);
