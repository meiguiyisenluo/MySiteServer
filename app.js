const uuid = require("uuid");
const { exec } = require("child_process");
const { createServer } = require("https");
const fs = require("fs");
const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer"); // v1.0.5
const upload = multer(); // for parsing multipart/form-data

const app = express();
const port = 3000;

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

const OmgTVNsp = io.of("/OmgTV").on("connection", function (socket) {
  const _this = this;
  // update user count
  OmgTVNsp.emit("userCount", _this.sockets.size);

  // update
  socket.on("setUserData", (data) => {
    for (const key in data) {
      socket.data[key] = data[key];
    }
  });

  socket.on("match", async () => {
    if (socket.rooms.size > 1) return;
    const targets = [];
    _this.sockets.forEach((socket) => {
      if (socket.data.matching && socket.rooms.size <= 1) targets.push(socket);
    });
    if (targets.length) {
      const socket2 = targets[0];
      const roomId = uuid.v4();
      socket.data.matching = false;
      socket2.data.matching = false;
      socket.join(roomId);
      socket2.join(roomId);
      socket.emit("match success", roomId, true);
      socket2.emit("match success", roomId);
    } else {
      socket.data.matching = true;
      socket.emit("match waiting");
    }
  });

  const leaveRoomHandler = async () => {
    let roomId = "";
    socket.rooms.forEach((id) => {
      if (id !== socket.id) roomId = id;
    });
    if (!roomId) return;
    const sockets = await _this.in(roomId).fetchSockets();
    sockets.forEach((socket) => {
      socket.leave(roomId);
      socket.emit("leaveRoom");
    });
  };

  socket.on("leaveRoom", leaveRoomHandler);
  socket.on("disconnecting", leaveRoomHandler);
  socket.on("disconnect", () => {
    OmgTVNsp.emit("userCount", _this.sockets.size);
  });

  socket.on("webrtc signaling", (data) => {
    let roomId = "";
    socket.rooms.forEach((id) => {
      if (id !== socket.id) roomId = id;
    });
    if (!roomId) return;
    socket.to(roomId).emit("webrtc signaling", data);
  });
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

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
