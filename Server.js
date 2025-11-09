// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const albums = require("./data/albums");

const app = express();

// ---- Middleware
app.use(cors());                     // allow client on a different origin
app.use(express.json());             // parse JSON bodies
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1d",                    // cache static assets for a day
    extensions: ["html"],            // / -> index.html
  })
);

// Simple health check for Render
app.get("/healthz", (req, res) => res.status(200).send("ok"));

// ---- Multer (uploads saved to public/images)
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, "public", "images")),
  filename: (_, file, cb) => cb(null, file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ---- API index (JSON)
app.get("/api", (req, res) => {
  res.json({
    name: "ovofansserver",
    description: "API serving a list of Drake albums for the ovoFans client",
    endpoints: [
      { path: "/api/albums", method: "GET", description: "Get all albums" },
      { path: "/api/albums/:id", method: "GET", description: "Get single album by id" },
      { path: "/api/upload", method: "POST", description: "Upload an image (multipart/form-data field 'image')" }
    ]
  });
});

// ---- Get all albums
// Optional query: ?q=care (case-insensitive title match)
app.get("/api/albums", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const result = q
    ? albums.filter(a => a.title.toLowerCase().includes(q))
    : albums;
  res.json(result);
});

// ---- Get one album by id
app.get("/api/albums/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid album id" });
  }
  const album = albums.find(a => a._id === id);
  if (!album) {
    return res.status(404).json({ error: "Album not found" });
  }
  res.json(album);
});

// Convenience: album cover redirect (/api/albums/3/cover -> /images/xxx.jpg)
app.get("/api/albums/:id/cover", (req, res) => {
  const id = Number(req.params.id);
  const album = albums.find(a => a._id === id);
  if (!album) return res.status(404).json({ error: "Album not found" });
  return res.redirect(album.cover);
});

// ---- Upload image endpoint (optional)
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ message: "Upload successful", path: `/images/${req.file.originalname}` });
});

// ---- API landing page (pretty docs in /public/index.html)
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- 404 (keep this AFTER all routes)
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  // For non-API paths, fall back to index.html so the docs always show.
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---- Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ovofansserver listening on port ${PORT}`));
