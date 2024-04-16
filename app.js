const { exec } = require("child_process");
const { createServer } = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // v1.0.5
const upload = multer(); // for parsing multipart/form-data

const OmgTV = require("./routers/OmgTV.js");

const app = express();
const port = 15002;

const httpServer = createServer(
  {
    key: fs.readFileSync("./ssl/luoyisen.com_nginx/luoyisen.com.key"),
    cert: fs.readFileSync("./ssl/luoyisen.com_nginx/luoyisen.com_bundle.crt"),
  },
  app
);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id);
});

// 设置 GIT_SSH_COMMAND 环境变量
process.env["GIT_SSH_COMMAND"] = "ssh -i /root/.ssh/lys_github_rsa";

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

app.post("/webhook", upload.array(), (req, res) => {
  const event = req.headers["x-github-event"];
  const deliveryId = req.headers["x-github-delivery"];
  const payload = JSON.parse(req.body.payload);
  const repository = payload.repository;
  const repoName = repository.name;
  const branch = payload.ref.split("/").pop();

  console.log(`Received ${event} event with delivery id ${deliveryId}`);
  console.log(`From repository ${repoName} and branch ${branch}`);

  exec(`/root/buildMission/${repoName}.sh`, {}, (error, stdout, stderr) => {
    if (error) {
      console.error("error:", error);
      return;
    }
    console.log("stdout: " + stdout);
    console.log("stderr: " + stderr);
  });
  res.sendStatus(200);
});

// OmgTV
app.use("/OmgTV", OmgTV);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
