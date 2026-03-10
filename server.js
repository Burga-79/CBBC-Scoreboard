const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;
const root = __dirname;

app.use("/admin", express.static(path.join(root, "admin")));
app.use("/display", express.static(path.join(root, "display")));
app.use("/images", express.static(path.join(root, "images")));

app.listen(PORT, () => {
  console.log(`Scoreboard server running at http://localhost:${PORT}`);
});
