const { exec } = require("child_process");
const express = require("express");
const app = express();
const port = 15002;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/webhook", (req, res) => {
  console.log(req);
  exec("/root/buildMission/YiSen.sh", {}, () => {});
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
