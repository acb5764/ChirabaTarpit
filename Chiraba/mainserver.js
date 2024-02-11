var http = require("http");
const url = require("url");
const { parse } = require("querystring");
const { spawn } = require("child_process");
const port = 8080;
const internal_net = "192.168.2."; // 192.168.2.
const passwurd = "mMwnvCLWUs{9S5HyUEFg";
const hostname = "0.0.0.0"
let c = 0;
let customList = []; // can be cleared
let iplog = []; // hold a list of IPs that make a req with no accepted params.
let blacklist = []; // ips who are repeat-offenders get added to a blacklist
let review = [];
let whitelist = ["192.168.2.221"];
let queryLog = [];

// load data
const { small, big, malcodeips, malcodedomains } = require("./data.json");

const server = http.createServer((req, res) => {
  let statCode = 200;
  let delay = 0;
  let request_body = null;
  let ip = req.socket.remoteAddress;
  try {
    const queryObject = url.parse(req.url, true).query;
    msg = "";
    let responseJson = "";
    // regardless of request method:
    c++;
    if (
      queryObject.size == null &&
      queryObject.delay == null &&
      queryObject.list == null &&
      queryObject.statCode == null &&
      req.url != "/favicon.ico" // some browsers automatically do this (chrome :barf: )
    ) {
      log_ip(ip, req);
      responseJson = "Repeated Unsolicited Requests will be blocked";
      setTimeout(() => respond(res, responseJson, statCode), 1000 * delay);
      return;
    }

    if (
      queryObject.statCode &&
      queryObject.statCode < 600 &&
      queryObject.statCode >= 100
    ) {
      statCode = queryObject.statCode;
    }

    if (queryObject.delay) {
      delay = Number(queryObject.delay);
    }

    switch (req.method) {
      case "POST":
        let body = [];
        req.on("data", (chunk) => body.push(chunk));
        req.on("end", () => {
          const request_body = Buffer.concat(body).toString();
          if (
            queryObject.size == "customList" ||
            queryObject.list == "customList"
          ) {
            customList.push(request_body);
            responseJson = request_body;
          } else {
            if (
              queryObject.list &&
              request_body.length > 6 && // top notch IP validation
              queryObject.pw == passwurd
            ) {
              if (
                ip.toString().startsWith(internal_net) // only authenticatated internal requests may post to whitelist
              ) {
                switch (queryObject.list) {
                  case "whitelist":
                    add_to_list(request_body, whitelist);
                    remove_from_list(request_body, review);
                    remove_from_list(request_body, blacklist);
                    remove_from_list(request_body, iplog);
                    responseJson = whitelist;
                    break;
                  case "review":
                    remove_from_list(request_body, blacklist);
                    if (whitelist.indexOf(request_body) == -1) {
                      add_to_list(request_body, review);
                      responseJson = review;
                    } else {
                      responseJson = "cant add IP to review";
                      statCode = 403;
                    }
                    break;
                  case "blacklist":
                    remove_from_list(request_body, review);
                    if (whitelist.indexOf(request_body) == -1) {
                      add_to_list(request_body, blacklist);
                      responseJson = blacklist;
                    } else {
                      responseJson = "cant add IP to blacklist";
                      statCode = 403;
                    }
                    break;
                  default:
                    responseJson = "Get LOST, Loser";
                    statCode = 401;
                }
              }
            } else {
              responseJson = "Go Away";
              statCode = 500;
            }
          }
        });
        break;

      case "GET":
        if (queryObject.size && queryObject.size.toString().length > 1) {
          switch (queryObject.size) {
            case "clear":
              customList = [];
              responseJson = "custom list cleared";
              break;
            case "customList" || "customlist":
              responseJson = customList;
              break;
            case "small":
              responseJson = small;
              break;
            case "big":
              responseJson = big;
              break;
            case "malcodeips":
              responseJson = malcodeips;
              break;
            case "malcodedomains":
              responseJson = malcodedomains;
              break;
            case "scrum":
              var pythonData;
              const python = spawn("python3", ["script.py"], {
                cwd: __dirname,
              });
              python.stdout.on("data", function (data) {
                pythonData = data.toString();
              });
              python.on("close", (code) => {
                res.end(pythonData);
              });
              responseJson = "made it to scrum" + pythonData;
              break;
            case "blacklist":
              responseJson = blacklist;
              break;
            case "review":
              responseJson = review;
              break;
            case "iplog":
              responseJson = iplog;
              break;
            case "queryLog":
              responseJson = queryLog;
              break;
            default:
              responseJson = "no such size";
              statCode = 404;
          }
        }
        if (queryObject.list && queryObject.list.toString().length > 1) {
          switch (queryObject.list) {
            case "blacklist":
              responseJson = blacklist;
              break;
            case "review":
              responseJson = review;
              break;
            case "whitelist":
              if (
                ip.toString().startsWith(internal_net) && // only authenticatated internal requests may post to whitelist
                queryObject.pw == passwurd
              ) {
                responseJson = whitelist;
              } else {
                responseJson = "Access Denied";
                statCode = 401;
              }
              break;
            default:
              responseJson = "list not found. Did you mean size?";
              statCode = 404;
          }
        }
        break;
      default:
        responseJson = "Invalid Method";
    }

    console.log(
      `Request ${c} was made from IP ${ip} with body: ${request_body} and url: ${req.url}`
    );

    if (statCode == 401) {
      responseJson = { message: "Invalid API Key" };
    }
    if (queryObject.size != "scrum") {
      // we already responded.
      setTimeout(() => respond(res, responseJson, statCode), 1000 * delay);
    }
  } catch (error) {
    console.error(error);
    respond(res, "Internal Server Error", 500);
  }
});

function log_ip(ip_addr, req) {
  body = [];
  let request_body = null;
  req.on("data", (chunk) => body.push(chunk));
  req.on("end", () => {
    request_body = Buffer.concat(body).toString();
    console.log("Req Made with no objective from IP: " + ip_addr + " " + request_body + " " + req.url);
    if (request_body != null || req.url != "/favicon.ico") {
      now = new Date();
      isoString = now.toISOString();
      queryLog.push(
        {
          ip: ip_addr,
          body: request_body,
          url: req.url,
          headers: req.headers,
          observed_at: isoString,
        }
      );
    }
});
  if (whitelist.indexOf(ip_addr) == -1) {
    add_to_list(ip_addr, iplog);
    add_to_list(ip_addr, review);
  }
}

function add_to_list(ip_addr, list_to_add) {
  if (list_to_add.indexOf(ip_addr) == -1) {
    // if it has not been added, add it. Only 1 entry per.
    list_to_add.push(ip_addr);
  }
}

function remove_from_list(ip_addr, list_to_remove) {
  var i = 0;
  while (i < list_to_remove.length) {
    if (list_to_remove[i] === ip_addr) {
      list_to_remove.splice(i, 1);
    } else {
      ++i;
    }
  }
}

function respond(res, response, statCode, content_type = "application/json") {
  res.statusCode = statCode;
  res.setHeader("Content-Type", content_type);
  res.end(JSON.stringify(response));
}

server.listen(port, hostname, (req) => {
  console.log(`server running at http://${hostname}:${port}`);
});
