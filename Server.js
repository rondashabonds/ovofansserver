// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

// Multer setup for image uploads (saved to public/images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public", "images"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Sample Drake albums dataset
let albums = [
  {
    _id: 1,
    title: "Thank Me Later",
    year: 2010,
    type: "Album",
    cover: "/images/thank-me-later.jpg",
    short: "Debut studio album from Drake",
    tracks: [
      "Fireworks",
      "Over",
      "Shot for Me",
      "Find Your Love",
      "Fancy"
    ]
  },
  {
    _id: 2,
    title: "Take Care",
    year: 2011,
    type: "Album",
    cover: "/images/take-care.jpg",
    short: "Breakout sophomore album with emotional production",
    tracks: [
      "Over My Dead Body",
      "Marvins Room",
      "Take Care",
      "Headlines",
      "Crew Love"
    ]
  },
  {
    _id: 3,
    title: "Nothing Was the Same",
    year: 2013,
    type: "Album",
    cover: "/images/nothing-was-the-same.jpg",
    short: "Cohesive LP with sharp production and visuals",
    tracks: [
      "Tuscan Leather",
      "Started From the Bottom",
      "Hold On, We're Going Home",
      "Too Much",
      "From Time"
    ]
  },
  {
    _id: 4,
    title: "Views",
    year: 2016,
    type: "Album",
    cover: "/images/views.jpg",
    short: "Major mainstream hit featuring Toronto vibes",
    tracks: [
      "Keep the Family Close",
      "Controlla",
      "One Dance",
      "Too Good",
      "Hotline Bling"
    ]
  },
  {
    _id: 5,
    title: "Scorpion",
    year: 2018,
    type: "Double Album",
    cover: "/images/scorpion.jpg",
    short: "Double album split between rap and R&B sides",
    tracks: [
      "Nonstop",
      "God's Plan",
      "Nice for What",
      "In My Feelings",
      "Emotionless"
    ]
  },
  {
    _id: 6,
    title: "Certified Lover Boy",
    year: 2021,
    type: "Album",
    cover: "/images/certified-lover-boy.jpg",
    short: "Star-studded album with pop & rap crossovers",
    tracks: [
      "Champagne Poetry",
      "Way 2 Sexy",
      "Girls Want Girls",
      "Knife Talk",
      "Fair Trade"
    ]
  },
  {
    _id: 7,
    title: "Honestly, Nevermind",
    year: 2022,
    type: "Album",
    cover: "/images/honestly-nevermind.jpg",
    short: "Dance & house-influenced surprise release",
    tracks: [
      "Intro",
      "Falling Back",
      "Texts Go Green",
      "Massive",
      "Sticky"
    ]
  },
  {
    _id: 8,
    title: "For All the Dogs",
    year: 2023,
    type: "Album",
    cover: "/images/for-all-the-dogs.jpg",
    short: "Latest studio album (2023)",
    tracks: [
      "Virginia Beach",
      "First Person Shooter",
      "Waiting For You",
      "8am in Charlotte",
      "Forever & Ever"
    ]
  }
];

// API endpoints
app.get("/api", (req, res) => {
  res.json({
    name: "ovofans-albums-api",
    description: "Simple API serving a list of Drake albums",
    endpoints: [
      { path: "/api/albums", method: "GET", description: "Get all albums" },
      { path: "/api/albums/:id", method: "GET", description: "Get album by id" },
      { path: "/api/upload", method: "POST", description: "Upload an image (multipart/form-data)" }
    ]
  });
});

// Get all albums
app.get("/api/albums", (req, res) => {
  res.json(albums);
});

// Get album by id
app.get("/api/albums/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const album = albums.find(a => a._id === id);
  if (!album) return res.status(404).json({ error: "Album not found" });
  res.json(album);
});

// Upload cover image (multipart/form-data field name: "image")
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // Return public path to uploaded image
  const publicPath = `/images/${req.file.originalname}`;
  res.json({ message: "Upload successful", path: publicPath });
});

// Simple 404
app.use((req, res) => {
  res.status(404).send("Not found");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Albums API listening on port ${PORT}`);
});
