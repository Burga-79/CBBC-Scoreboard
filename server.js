// At the top of server.js
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Ensure folders exist (adjust paths to match your structure)
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const publicDir = path.join(__dirname, "public");
const logoDir = path.join(publicDir, "images", "logo");
const sponsorDir = path.join(publicDir, "images", "sponsors");
const backgroundDir = path.join(publicDir, "images", "backgrounds");

ensureDir(logoDir);
ensureDir(sponsorDir);
ensureDir(backgroundDir);

// Multer storage factory
function makeStorage(targetDir) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, targetDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      const safeBase = base.replace(/[^a-z0-9_\-]/gi, "_");
      const stamp = Date.now();
      cb(null, `${safeBase}_${stamp}${ext}`);
    },
  });
}

const uploadLogo = multer({ storage: makeStorage(logoDir) });
const uploadSponsor = multer({ storage: makeStorage(sponsorDir) });
const uploadBackground = multer({ storage: makeStorage(backgroundDir) });

// Make sure Express serves /public
// app.use(express.static(path.join(__dirname, "public")));

// LOGO UPLOAD
app.post("/upload/logo", uploadLogo.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const relPath = `/images/logo/${req.file.filename}`;
  res.json({
    filename: req.file.filename,
    url: relPath,
  });
});

// SPONSOR UPLOAD
app.post("/upload/sponsor", uploadSponsor.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const relPath = `/images/sponsors/${req.file.filename}`;
  res.json({
    filename: req.file.filename,
    url: relPath,
  });
});

// BACKGROUND UPLOAD
app.post("/upload/background", uploadBackground.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const relPath = `/images/backgrounds/${req.file.filename}`;
  res.json({
    filename: req.file.filename,
    url: relPath,
  });
});
