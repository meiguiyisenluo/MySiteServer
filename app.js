const { execSync } = require("child_process");
const express = require("express");
const app = express();
const port = 15002;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/webhook", (req, res) => {
  console.log(req);
  execSync("/root/buildMission/YiSen.sh");
  res.send(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
