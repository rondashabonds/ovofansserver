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
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI);

const projectSchema = new mongoose.Schema({
  title: String,
  category: String,
  year: String,
  blurb: String,
  img: String
});
const Project = mongoose.model("Project", projectSchema);

const projectValidation = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().required(),
  year: Joi.string().required(),
  blurb: Joi.string().required(),
  img: Joi.string().allow("")
});

const IMAGES_DIR = path.join(__dirname, "images");
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

app.use("/images", express.static(path.join(__dirname, "images")));

const BASE_URL =
  process.env.RENDER_EXTERNAL_URL ||
  process.env.BASE_URL ||
  "";

app.get("/api/projects", async (req, res) => {
  const list = await Project.find();
  res.json(list);
});

app.post("/api/projects", upload.single("img"), async (req, res) => {
  const data = req.body;
  if (req.file) data.img = `${BASE_URL}/images/${req.file.filename}`;

  const { error } = projectValidation.validate(data);
  if (error) return res.status(400).json({ error: error.message });

  const project = await Project.create(data);
  res.json(project);
});

app.put("/api/projects/:id", upload.single("img"), async (req, res) => {
  const data = req.body;
  const id = req.params.id;

  if (req.file) data.img = `${BASE_URL}/images/${req.file.filename}`;

  const { error } = projectValidation.validate(data);
  if (error) return res.status(400).json({ error: error.message });

  const updated = await Project.findByIdAndUpdate(id, data, { new: true });
  res.json(updated);
});

app.delete("/api/projects/:id", async (req, res) => {
  const id = req.params.id;
  const deleted = await Project.findByIdAndDelete(id);
  res.json(deleted);
});

app.get("/api/albums", (req, res) => {
  res.json(albums);
});

app.get("/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT);
