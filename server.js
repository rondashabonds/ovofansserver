require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Joi = require("joi");
const albums = require("./data/albums");

const app = express();

app.use(cors());
app.use(express.json());

// Serve React build + static files
app.use(express.static(path.join(__dirname, "public")));

// Connect database
console.log("MONGO_URI from Render:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI);

// -------------------------
// PROJECT MODEL + VALIDATION
// -------------------------
const projectSchema = new mongoose.Schema({
  title: String,
  category: String,
  year: String,
  blurb: String,
  img: String,
});

const Project = mongoose.model("Project", projectSchema);

const projectValidation = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().required(),
  year: Joi.string().required(),
  blurb: Joi.string().required(),
  img: Joi.string().allow(""),
});

// -------------------------
// IMAGE STORAGE (FIXED)
// -------------------------

// Correct folder where ALL images live
const IMAGES_DIR = path.join(__dirname, "public/images");
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Upload config → save to /public/images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Serve images from /public/images
app.use("/images", express.static(path.join(__dirname, "public/images")));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";

// -------------------------
// PROJECT ROUTES
// -------------------------

app.get("/api/projects", async (req, res) => {
  const list = await Project.find();
  res.json(list);
});

app.post("/api/projects", upload.single("img"), async (req, res) => {
  const data = req.body;

  if (req.file)
    data.img = `${BASE_URL}/images/${req.file.filename}`;

  const { error } = projectValidation.validate(data);
  if (error) return res.status(400).json({ error: error.message });

  const project = await Project.create(data);
  res.json(project);
});

app.put("/api/projects/:id", upload.single("img"), async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  if (req.file)
    data.img = `${BASE_URL}/images/${req.file.filename}`;

  const { error } = projectValidation.validate(data);
  if (error) return res.status(400).json({ error: error.message });

  const updated = await Project.findByIdAndUpdate(id, data, { new: true });
  res.json(updated);
});

app.delete("/api/projects/:id", async (req, res) => {
  const deleted = await Project.findByIdAndDelete(req.params.id);
  res.json(deleted);
});

// -------------------------
// ALBUM ROUTES
// -------------------------

app.get("/api/albums", (req, res) => {
  res.json(albums);
});

// -------------------------
// ALL IMAGES ENDPOINT (FIXED)
// -------------------------

app.get("/api/all-images", (req, res) => {
  fs.readdir(IMAGES_DIR, (err, files) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Unable to read images directory" });

    const urls = files.map((file) => `${BASE_URL}/images/${file}`);
    res.json(urls);
  });
});

// -------------------------
// FALLBACK → SERVE REACT APP
// -------------------------

app.get("/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------
// START SERVER
// -------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT);
console.log("Server running on port", PORT);
