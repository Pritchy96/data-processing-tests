var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var server = require("./serverQueries.js");
var when = require('when');

var app = express();
app.set('view engine', 'ejs');
var router = express.Router();
var path = __dirname + '/views/';
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// First you need to create a connection to the db
var mysqlParams = {
  connectionLimit: 30,
  host: "localhost",
  user: "server",
  password: "ayylmao",
  database: "data"
};

var pool = mysql.createPool(mysqlParams);

router.use(function (request, response, next) {
  console.log("/" + request.method);  //Always print request to server console.
  console.log("requesting " + request.url);  //Always print request to server console.
  next(); //Allow the router to be executed.
});

router.get('/', function(request, response) {
  response.send('Root page, /addNode to add data');
});

router.get('/viewNode/:nodeID', function(request, response) {
  var promises = [];
  var params;

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  var serverQueryLatch = when.defer();

  var path = '/getNodeById?node_id=' + request.params.nodeID;

  server.request(path, 'GET', function(serverReply) {
    serverQueryLatch.resolve();
    params = { node : serverReply };
  });

  when.all(promises).then(function() {
    console.log("addNode promises satisfied!");
    response.render("viewNode", params);
  });
});

router.get('/addNode', function(request, response) {
  var promises = [];
  var nodes;

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  var serverQueryLatch = when.defer();
  promises.push(serverQueryLatch.promise);

  var path = '/getAllNodes';

  server.request(path, 'GET', function(serverReply) {
    serverQueryLatch.resolve();
    nodes = serverReply;
  });

  //When this triggers, all promises from all nodes have been resolved.
  when.all(promises).then(function () {
    console.log("Nodes before rendering: ");
    console.log(nodes);
    response.render("addNode", {nodes: nodes});
  });
});

//Runs through an array of tags, and checks if node.node_ID == tag.nodeID.
function tagsNode(tag) {
  //This is set by the second parameter that calls this function.
  //God knows why. In this case it will be an node that we're creating.
  return this.node_ID == tag.node_ID;
}

router.get("*", function(request, response) {
   //If the file path exists, serve the html file, otherwise serve 404.
   var filePath = path + request.url;

   if(filePath.indexOf('.') == -1)
   {
    //Period found.
    filePath += ".html"
   }

   if(fs.existsSync(filePath)) {
     response.sendFile(filePath);
   } else {
     response.render("404");
   }
});

//Save Node.
router.post('/saveNode', function(request, response) {
  console.log("Reached client program server side save method");
  var node = request.body.node;
  console.log(JSON.parse(node));

  //Now send this to the MOIRA server.
  var path = '/saveNode';

  server.request(path, 'POST', function(serverReply) {
    console.log(serverReply);
    response.redirect(request.originalUrl)
    response.end();
  }, JSON.parse(node));
});

function moveTagsToSingleArray(node, callback) {
  var tags = [];

  //Add tags to single formatted array for pushing to database.
  for (var i in node.userTags) {
    tags.push([node.nodeID, "userDef", node.userTags[i].trim()]);
  }

  for (var i in node.sysTags) {
    tags.push([node.nodeID, node.sysTags[i].key, node.sysTags[i].value.trim()]);
  }

  console.log(tags);

  callback(null, tags);
}

app.use("/",router);

app.listen(8080, function () {
  console.log('Listening on port 8080')
});
