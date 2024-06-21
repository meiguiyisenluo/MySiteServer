const axios = require("axios");
const express = require("express");
var router = express.Router();

// @see: https://mymemory.translated.net/doc/spec.php
router.get("/translate", (req, res) => {
  if (!req.query.text) return res.status(400).send("参数错误");
  const params = {
    q: req.query.text,
    langpair: req.query.langpair,
    key: "698e0dc81e14e74533fb",
  };
  axios({
    method: "get",
    url: "https://api.mymemory.translated.net/get",
    params,
  })
    .then((response) => {
      console.log("then", response.data);
      res.json(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("服务器内部错误");
    });
});

module.exports = router;
