const express = require("express");
const dns = require("dns");
var router = express.Router();

router.post("/ipv4", (req, res) => {
  res.json({ ip: req.ip });
});

router.post("/dns-resolve", (req, res) => {
  const hostname = req.body.hostname;
  if (!hostname) {
    return res
      .status(400)
      .json({ error: "Hostname body parameter is required" });
  }

  dns.resolve4(hostname, (err, addresses) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ addresses });
  });
});

module.exports = router;
