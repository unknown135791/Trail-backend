const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.post("/signup", (req, res) => {
  const { name } = req.body;
  res.json({
    success: true,
    message: `Welcome ${name}`
  });
});

app.post("/login", (req, res) => {
  res.json({
    success: true,
    message: "Login successful"
  });
});

app.listen(PORT, () => {
  console.log("Backend running");
});