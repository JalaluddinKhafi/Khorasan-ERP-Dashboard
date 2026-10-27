const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || process.cwd();
const port = Number(process.argv[3] || 8765);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);
    fs.readFile(filePath, (err, data) => {
      if (err) return res.writeHead(404).end("not found");
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(filePath).toLowerCase()] ||
          "application/octet-stream",
      });
      res.end(data);
    });
  })
  .listen(port, "127.0.0.1", () => console.log("up on " + port));
