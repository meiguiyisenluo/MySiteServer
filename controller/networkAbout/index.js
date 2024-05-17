const express = require("express");
const { Resolver } = require("node:dns").promises;
var router = express.Router();

const dnsServers = [
  {
    dnsName: "百度DNS",
    ip: ["180.76.76.76"],
    officialWebsite: "http://dudns.baidu.com/",
    remark: "百度旗下",
  },
  {
    dnsName: "阿里DNS",
    ip: ["223.5.5.5", "223.6.6.6"],
    officialWebsite: "http://www.alidns.com/",
    remark: "阿里巴巴旗下",
  },
  {
    dnsName: "DNSPod",
    ip: ["119.29.29.29"],
    officialWebsite: "https://www.dnspod.cn/Products/Public.DNS",
    remark: "腾讯旗下",
  },
  {
    dnsName: "114 DNS",
    ip: ["114.114.114.114", "114.114.115.115"],
    officialWebsite: "http://www.114dns.com/",
    remark: "电信合作商",
  },
  {
    dnsName: "Google DNS",
    ip: ["8.8.8.8", "8.8.4.4"],
    officialWebsite: "https://developers.google.com/speed/public-dns/",
    remark: "纯净无污染，注意墙",
  },
  {
    dnsName: "SDNS",
    ip: ["1.2.4.8", "210.2.4.8"],
    officialWebsite: "http://www.sdns.cn/",
    remark: "中国互联网络信息中心提供",
  },
  {
    dnsName: "OpenDNS",
    ip: ["208.67.220.220", "208.67.222.222"],
    officialWebsite: "http://www.opendns.com/",
    remark: "资深、专业的公众DNS",
  },
];

router.post("/ipv4", (req, res) => {
  res.json({ ip: req.ip });
});

router.post("/dns-resolve", async (req, res) => {
  const hostname = req.body.hostname;
  if (!hostname) {
    return res
      .status(400)
      .json({ error: "Hostname body parameter is required" });
  }
  const resolver = new Resolver({
    timeout: 5000,
  });

  const result = [];

  for (const dnsServer of dnsServers) {
    resolver.setServers(dnsServer.ip);
    await resolver
      .resolve(hostname, "A")
      .then((addresses) => {
        result.push({
          ...dnsServer,
          status: 200,
          addresses,
        });
      })
      .catch((err) => {
        result.push({
          ...dnsServer,
          status: 500,
          error: err.message,
        });
      });
  }

  res.json(result);
});

module.exports = router;
