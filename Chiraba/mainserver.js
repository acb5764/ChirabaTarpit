const http = require('http');
const https = require('https')
const fs = require('fs');

// const options = {
//   key: fs.readFileSync('./myserver.key'),
//   cert: fs.readFileSync('./myserver.crt')
// };

const url = require("url");
const port = 8080;
const hostname = "0.0.0.0"
let customList = [];
let queryLog = [];

const server = http.createServer((req, res) => server_instance(req, res));
// const https_server = https.createServer(options, (req, res) => server_instance(req, res))

function server_instance(req, res){
  let ip = req.socket.remoteAddress;
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
    respond(res, responseJson, 200);
    return;
  }
  try{
    let statCode = 400;
    switch (req.method) {
      case "GET":
        if (queryObject.qlist && queryObject.qlist.toString().length > 1) {
          switch (queryObject.qlist) {
            case "clear":
              customList = [];
              responseJson = "customList cleared";
              statCode = 200;
              break;
            case "customList" || "customlist":
              responseJson = customList;
              statCode = 200;
              break;
            case "queryLog":
              responseJson = queryLog;
              statCode = 200;
              break;
            case "querySince":
              responseJson = find_since(queryObject.since);
              statCode = 200;
          }
        }
        respond(res, responseJson, statCode);
        return;
      case "POST":
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => {
          const request_body = Buffer.concat(body).toString();
          if (
            queryObject.qlist == "customList" ||
            queryObject.qlist == "customList"
          ) {
            customList.push(request_body);
            responseJson = request_body;
            statCode = 200;
            respond(res, responseJson, statCode);
          }
        });
        return;
      default:
        responseJson = "Method not allowed";
        statCode = 405;
        respond(res, responseJson, statCode);
        return;
    }
  } catch (error) {
    console.error(error);
    respond(res, "Internal Server Error", 500);
  }
}

function find_since(since_timestamp){
  // Add searching here
}


function log_ip(ip_addr, req) {
  body = [];
  let request_body = "";
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
  return;
}

server.listen(port, hostname, (req) => {
  console.log(`server running at http://${hostname}:${port}`);
});

// https_server.listen(443, hostname, (req) => {
//   console.log(`server running at https://${hostname}:443`);
// });
