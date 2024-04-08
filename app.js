const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
const app = express();
const port = 15002;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.all("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/test", upload.array(), (req, res) => {
  console.log(req.body.test);
  res.send("Hello World!");
});

app.post("/webhook", upload.array(),(req, res) => {
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
