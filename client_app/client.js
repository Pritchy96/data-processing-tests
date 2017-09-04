var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var when = require('when');
var moira = require("moira-network-interface");
var config = require("./config");

var app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
var router = express.Router();
var path = __dirname + '/views/';
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  var moiraQueryLatch = when.defer();

  var path = '/getNodeById?node_id=' + request.params.nodeID;

  moira.interface.request(path, 'GET', function(moiraReply) {
    moiraQueryLatch.resolve();
    params = { node : moiraReply };
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
  var moiraQueryLatch = when.defer();
  promises.push(moiraQueryLatch.promise);

  var path = '/getAllNodes';

  moira.interface.request(path, 'GET', function(moiraReply) {
    moiraQueryLatch.resolve();
    nodes = moiraReply;
  });

  //When this triggers, all promises from all nodes have been resolved.
  when.all(promises).then(function () {
    console.log("Nodes before rendering: ");
    console.log(nodes);
    response.render("addNode", {nodes: nodes});
  });
});

router.get('/checkMasterList', function(request, response) {
  console.log(moira.tag_types);
});

router.get('/testAddTag', function(request, response) {
  moira.tags.addTag({tag_type: moira.tags.tag_types.temperature, tag_name: "temp_test_3", tag_data: 49, node_ID: 1});
});

router.get("*", function(request, response) {
   //If the file path exists, serve the file, otherwise serve 404.
   var filePath = path + request.url;

   console.log("Path is: " + path);

   if(filePath.indexOf('.') == -1)  {
    //Period found.
    filePath += ".html"
   }

   if(fs.existsSync(filePath)) {
     response.sendFile(filePath);
   } else {
     response.render(path + "/404");
   }
});

//Save Node.
router.post('/saveNode', function(request, response) {
  console.log("Reached client program server side save method");
  var node = request.body.node;
  console.log(JSON.parse(node));

  //Now send this to the MOIRA server.
  var path = '/saveNode';

  moira.interface.request(path, 'POST', function(moiraReply) {
    console.log(moiraReply);
    console.log("redirecting");
    response.redirect("addNode");
  }, {node: JSON.parse(node)});
});

app.use("/",router);

app.listen(config.client.port, function () {
  console.log('Listening on port ' + config.client.port)
});
