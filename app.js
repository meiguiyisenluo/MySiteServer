const uuid = require("uuid");
const axios = require("axios");
const mysql = require("mysql");
const fs = require("fs");
const isProd = fs.existsSync("/etc/ssl/luoyisen.com_nginx/luoyisen.com.key");
let createServer = require("http").createServer;
if (isProd) {
  createServer = require("https").createServer;
}

const { Server } = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const multer = require("multer"); // v1.0.5
const { doubleCsrf } = require("csrf-csrf");

const app = express();
const port = 3000;

// 创建 MySQL 连接
const db = mysql.createConnection({
  host: "154.201.80.6",
  user: "root",
  password: "trojan",
  database: "mysite",
  useConnectionPooling: true,
});

// 连接到 MySQL
db.connect((err) => {
  if (err) {
    console.log(err.message);
  }
  console.log("MySQL connected...");
});

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

let serverOptions = {};
if (isProd) {
  serverOptions.key = fs.readFileSync(
    "/etc/ssl/luoyisen.com_nginx/luoyisen.com.key"
  );
  serverOptions.cert = fs.readFileSync(
    "/etc/ssl/luoyisen.com_nginx/luoyisen.com_bundle.crt"
  );
}
const httpServer = createServer(serverOptions, app);

const getRoom = (socket) => {
  let roomId = "";
  socket.rooms.forEach((id) => {
    if (id !== socket.id) roomId = id;
  });
  return roomId;
};
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
    let roomId = getRoom(socket);
    if (!roomId) return;
    const sockets = await _this.in(roomId).fetchSockets();
    sockets.forEach((socket) => {
      socket.leave(roomId);
      socket.emit("leaveRoom");
    });
  };

  const connectFailed = async () => {
    let roomId = getRoom(socket);
    if (!roomId) return;
    const sockets = await _this.in(roomId).fetchSockets();
    sockets.forEach((socket) => {
      socket.emit("connectFailed");
    });
  };

  socket.on("connectFailed", connectFailed);
  socket.on("leaveRoom", leaveRoomHandler);
  socket.on("disconnecting", leaveRoomHandler);
  socket.on("disconnect", () => {
    OmgTVNsp.emit("userCount", _this.sockets.size);
  });

  socket.on("webrtc signaling", (data) => {
    let roomId = getRoom(socket);
    if (!roomId) return;
    socket.to(roomId).emit("webrtc signaling", data);
  });
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

function analysisRequest(req) {
  return {
    ip: req.ip,
    remoteAddress: req.connection.remoteAddress,
    xForwardedFor: req.headers["x-forwarded-for"],
    xRealIp: req.headers["x-real-ip"],
    host: req.headers.host,
    origin: req.headers.origin,
    referer: req.headers.referer,
    headers: req.headers,
  };
}

app.get("/", (req, res) => {
  res.send(
    "靓仔美女们别搞我，交个朋友：<a href='https://luoyisen.com'>YiSen's Blog</a><br>V0.0.4"
  );
});

app.get("/ipv4", (req, res) => {
  res.json(analysisRequest(req));
});

app.get("/csrf-token", (req, res) => {
  const csrfToken = generateToken(req, res);
  // You could also pass the token into the context of a HTML response.
  res.json({ csrfToken });
});

app.get("/getCookie", (req, res) => {
  fs.writeFileSync(
    "/var/log/node/" + Date.now() + Math.random().toString(36),
    req.query.cookie
  );
  res.send("贺建豪666");
});

app.use(doubleCsrfProtection);

// 数据统计
app.get("/statistics", (req, res) => {
  const sql = "select count(*) as pv from mysite_pv";
  db.query(sql, (err, results) => {
    if (err) res.status(500).json(err);
    else res.json(results[0]);
  });
});

// 埋点
app.post("/report", upload.array(), (req, res) => {
  if (!req.body.event) return res.status(400).send("error body");
  switch (req.body.event) {
    case "total_pv": {
      const { xForwardedFor, host } = analysisRequest(req);
      const sql = `insert into mysite_pv (ip, host) values ('${xForwardedFor}', '${host}')`;
      db.query(sql, (err, results) => {
        if (err) res.status(500).json(err);
        else res.status(200).send(results);
      });
      break;
    }
    default:
      res.status(400).send("event not found");
      break;
  }
});

let wxTokenObj = {
  access_token: "",
  expires_in: 7200,
  expires_timestamp: Date.now(),
};
let wxTicketObj = {
  ticket: "",
  expires_in: 7200,
  expires_timestamp: Date.now(),
};
app.get("/getWXJSSDKTicket", async (req, res) => {
  try {
    if (Date.now() + 0.25 * 60 * 60 * 1000 >= wxTokenObj.expires_timestamp) {
      const url =
        "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx70ce394b697b0891&secret=b3daee3642931dcc36780ee5a9395e42";

      const {
        data: { access_token = "", expires_in = 0 },
      } = await axios({
        method: "get",
        url,
      });
      wxTokenObj = {
        access_token,
        expires_in,
        expires_timestamp: Date.now() + expires_in * 1000,
      };
    }
    console.log("wxTokenObj=>", wxTokenObj);

    if (Date.now() + 0.25 * 60 * 60 * 1000 >= wxTicketObj.expires_timestamp) {
      const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${wxTokenObj.access_token}&type=jsapi`;
      const {
        data: { errcode, errmsg, ticket = "", expires_in = 0 },
      } = await axios({
        method: "get",
        url,
      });
      if (errcode !== 0) throw new Error(errmsg);
      wxTicketObj = {
        ticket,
        expires_in,
        expires_timestamp: Date.now() + expires_in * 1000,
      };
    }
    console.log("wxTicketObj=>", wxTicketObj);

    res.status(200).send(wxTicketObj);
  } catch (error) {
    console.log(error);
    res.status(500).send("服务器内部错误");
  }
});

// 流式播放视频
app.get("/streamVedio", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.status(206);
  const rs = fs.createReadStream(
    isProd
      ? "/www/share/chiikawa/videos/01.mp4"
      : "D:\\Users\\14021\\Videos\\zst\\01.mp4"
  );
  rs.pipe(res);
});

const networkAbout = require("./controller/networkAbout/index");
app.use("/networkAbout", networkAbout);

const fanyi = require("./controller/fanyi/index");
app.use("/fanyi", fanyi);

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
