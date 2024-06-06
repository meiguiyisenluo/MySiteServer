const uuid = require("uuid");
const { createServer } = require("https");
const fs = require("fs");

const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const multer = require("multer"); // v1.0.5
const { doubleCsrf } = require("csrf-csrf");

const app = express();
const port = 3000;

app.set("trust proxy", true);

const {
  generateToken, // Use this in your routes to provide a CSRF hash + token cookie and token.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => "sdfjklasfdjlksadfj", // A function that optionally takes the request and returns a secret
  cookieName: "x-csrf-token", // The name of the cookie to be used, recommend using Host prefix.
  // cookieOptions: {},
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["HEAD", "OPTIONS"], // A list of request methods that will not be protected.
  getTokenFromRequest: (req) => req.headers["x-csrf-token"], // A function that returns the token from the request
});

const upload = multer(); // for parsing multipart/form-data
app.use(cookieParser());

const httpServer = createServer(
  {
    key: fs.readFileSync("/etc/ssl/luoyisen.com_nginx/luoyisen.com.key"),
    cert: fs.readFileSync(
      "/etc/ssl/luoyisen.com_nginx/luoyisen.com_bundle.crt"
    ),
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

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get("/", (req, res) => {
  res.send(
    "靓仔美女们别搞我，交个朋友：<a href='https://luoyisen.com'>YiSen's Blog</a>"
  );
});

app.get("/version", (req, res) => {
  res.send("V0.0.2");
});

app.get("/500test", (req, res) => {
  res.status(500).send('error');
});

app.get("/ipv4", (req, res) => {
  try {
    const xForwardedFor = req.headers["x-forwarded-for"];
    const clientIp = xForwardedFor
      ? xForwardedFor.split(",")[0]
      : req.connection.remoteAddress;

    res.json({ ip: req.ip, xForwardedFor });
  } catch (error) {
    console.log(error);
  }
});

app.get("/csrf-token", (req, res) => {
  const csrfToken = generateToken(req, res);
  // You could also pass the token into the context of a HTML response.
  res.json({ csrfToken });
});

app.use(doubleCsrfProtection);

app.get("/test", (req, res) => {
  res.send("test");
});

app.post("/test", upload.array(), (req, res) => {
  res.send("test");
});

const networkAbout = require("./controller/networkAbout/index");
app.use("/networkAbout", networkAbout);

const fanyi = require("./controller/fanyi/index");
app.use("/fanyi", fanyi);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
