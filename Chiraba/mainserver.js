const http = require('http');
const https = require('https')
const fs = require('fs');

const options = {
  key: fs.readFileSync('./myserver.key'),
  cert: fs.readFileSync('./myserver.crt')
};

const url = require("url");
const port = 8080;
const hostname = "0.0.0.0"
let iplog = []; // hold a list of IPs that make a req with no accepted params.
let queryLog = [];

const server = http.createServer((req, res) => server_instance(req, res));
const https_server = https.createServer(options, (req, res) => server_instance(req, res))

function server_instance(req, res){
  let ip = req.socket.remoteAddress;
  try {
    const queryObject = url.parse(req.url, true).query;
    msg = "";
    let responseJson = "";
    // regardless of request method:
    if (
      req.url != "/favicon.ico" &&
      queryObject.qlist == null
    ) {
      log_ip(ip, req);
      responseJson = "Welcome to Chiraba!";
      respond(res, responseJson, 200)
      return;
    }

    switch (req.method) {
      case "GET":
        if (queryObject.qlist && queryObject.qlist.toString().length > 1) {
          switch (queryObject.qlist) {
            case "iplog":
              responseJson = iplog;
              break;
            case "queryLog":
              responseJson = queryLog;
              break;
          }
        }
        if (queryObject.qlist && queryObject.qlist.toString().length > 1) {
          switch (queryObject.qlist) {
            default:
              responseJson = "list not found.";
              statCode = 404;
          }
        }
        break;
      default:
        responseJson = "Invalid Method";
    }
  } catch (error) {
    console.error(error);
    respond(res, "Internal Server Error", 500);
  }
}

function log_ip(ip_addr, req) {
  body = [];
  let request_body = null;
  let log_object = {};
  req.on("data", (chunk) => body.push(chunk));
  req.on("end", () => {
    request_body = Buffer.concat(body).toString();
    now = new Date();
    isoString = now.toISOString();
    log_object = {
      ip: ip_addr,
      body: request_body,
      url: req.url,
      headers: req.headers,
      method: req.method,
      observed_at: isoString
    }
    console.log(log_object);
    queryLog.push(log_object);
});
}

function respond(res, response, statCode, content_type = "application/json") {
  res.statusCode = statCode;
  res.setHeader("Content-Type", content_type);
  res.end(JSON.stringify(response));
}

server.listen(port, hostname, (req) => {
  console.log(`server running at http://${hostname}:${port}`);
});

https_server.listen(443, hostname, (req) => {
  console.log(`server running at https://${hostname}:443`);
});
