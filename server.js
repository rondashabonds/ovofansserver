const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const albums = require("./data/albums");

const app = express();

// -------------- PROJECT PERSISTENCE --------------
const PROJECT_FILE = path.join(__dirname, "data", "projects.json");

let projects = [];
try {
  if (fs.existsSync(PROJECT_FILE)) {
    const raw = fs.readFileSync(PROJECT_FILE, "utf8");
    projects = JSON.parse(raw);
  }
} catch (err) {
  console.log("Error reading project file:", err);
  projects = [];
}

function saveProjects() {
  fs.writeFileSync(PROJECT_FILE, JSON.stringify(projects, null, 2));
}
// -------------------------------------------------

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1d",
    extensions: ["html"],
  })
);

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) =>
    cb(null, path.join(__dirname, "public", "images")),
  filename: (_req, file, cb) =>
    cb(null, file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";

// -------------------- PROJECT ROUTES --------------------

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
  saveProjects(); // 🔥 Save to file

  res.status(200).json(newProject);
});

app.delete("/api/projects/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = projects.findIndex((p) => p._id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Project not found" });
  }

  const removed = projects.splice(index, 1)[0];
  saveProjects(); // 🔥 Save to file

  if (removed.img) {
    const fileName = removed.img.split("/images/")[1];
    const imgPath = path.join(__dirname, "public", "images", fileName);

    fs.unlink(imgPath, (err) => {
      if (err) console.log("Image delete error:", err);
    });
  }

  res.json({ message: "Project deleted", removed });
});

// -------------------- ALBUM ROUTES --------------------

app.get("/api/albums", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const result = q
    ? albums.filter((a) => a.title.toLowerCase().includes(q))
    : albums;
  res.json(result);
});

app.get("/api/albums/:id", (req, res) => {
  const id = Number(req.params.id);
  const album = albums.find((a) => a._id === id);
  if (!album) return res.status(404).json({ error: "Album not found" });
  res.json(album);
});

// -------------------- IMAGE LIST --------------------
app.get("/api/all-images", (_req, res) => {
  const imagesPath = path.join(__dirname, "public", "images");
  fs.readdir(imagesPath, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not load images" });
    res.json(files.map((file) => `/images/${file}`));
  });
});

// -------------------- UPLOAD ROUTE --------------------
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No file uploaded" });

  res.json({
    message: "Upload successful",
    path: `${BASE_URL}/images/${req.file.originalname}`,
  });
});

// -------------------- FRONTEND FALLBACK --------------------
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
