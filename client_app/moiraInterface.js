var http = require('http');

var config = require("./config.js");
var data_utils = require("./data_utils.js");

//path is the path to the request from root, including query string
//Method is the HTTP request type: GET, POST, etc
//Callback is a method which is called with the response data after all data has been recieveed.
exports.request = function(path, method, callback, postData) {

  var connectionOptions = {
    hostname: config.moira.ni.hostname,
    port: config.moira.ni.port,
    path: path,
    method: method
  };

  var jsonNode = JSON.stringify(postData);

  console.log("OPTION TYPE IS: " + connectionOptions.method);
  if (connectionOptions.method == 'POST') {
    console.log("Setting up POST request");
    console.log(postData);
    connectionOptions.headers = {
        "Content-Type": "application/json",
        'Content-Length': Buffer.byteLength(jsonNode)
    }
  } else {
    connectionOptions.headers = {}
  }

  console.log("connectionOptions: ")
  console.log(connectionOptions);

  var req = http.request(connectionOptions, function(res) {
    console.log('callback for server interaction');
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
       var reply = JSON.parse(bodyChunks);
       console.log("json'd reply: ");
       console.log(reply);
       callback(reply);
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
    //TODO: Error handling.
  });

  if (connectionOptions.method == 'POST') {
    req.write(jsonNode);
  }

  req.end();
}
