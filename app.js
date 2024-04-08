const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 15002;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/webhook", (req, res) => {
  // const event = req.headers["x-github-event"];
  // const deliveryId = req.headers["x-github-delivery"];
  // const repository = req.body.repository;
  // const branch = req.body.ref.split("/").pop();

  // console.log(`Received ${event} event with delivery id ${deliveryId}`);
  // console.log(`From repository ${repository.full_name} and branch ${branch}`);
  console.log(req.headers);
  console.log("");
  console.log(req.body);

  // exec("/root/buildMission/YiSen.sh", {}, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error("error:", error);
  //     return;
  //   }
  //   console.log("stdout: " + stdout);
  //   console.log("stderr: " + stderr);
  // });
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
