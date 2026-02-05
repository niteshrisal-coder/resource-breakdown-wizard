import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Test server is working!");
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Test server running on http://127.0.0.1:${port}`);
});
