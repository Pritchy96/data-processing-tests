var http = require('http');

//path is the path to the request from root, including query string
//Method is the HTTP request type: GET, POST, etc
//Callback is a method which is called with the response data after all data has been recieveed.
exports.request = function(path, method, callback, postData) {

  var options = {
    hostname: '34.212.2.169',
    port: 8080,
    path: path,
    method: method
  };

  if (options.method == 'POST') {
    options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
  } else {
    options.headers = {}
  }


  var req = http.request(options, function(res) {
    console.log('callback for server interaction');
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));

    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
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

  if (options.method == 'POST') {
    req.write(JSON.stringify(postData));
  }
  req.end();
}
