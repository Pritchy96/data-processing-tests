var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var fh = require("./filehandler.js");
var server = require("./serverQueries.js");
var filehandler = new fh();
var when = require('when');

var app = express();
app.set('view engine', 'ejs');
var router = express.Router();
var path = __dirname + '/views/';
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
  promises.push(serverQueryLatch.promise);

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
router.post('/addNode', function(request, response) {
  var node = JSON.parse(request.body.node);

  //Update version number.
  node.version = node.version + 1;

  console.log(node);

  if (node.version == 0) {  //New node.
    console.log("this is a new node");
    pool.query('INSERT INTO nodes SET ?', {version: node.version},
     function (error, result, fields) {
      if (error) return console.error(error);
      node.nodeID = result.insertId;
      console.log("Insert ID: " + node.nodeID);
      saveFile(node);
    });
  } else {  //Update existing node.
    console.log("this is an existing node");

    pool.query('UPDATE nodes SET version = ? WHERE node_ID = ?', [node.version, node.nodeID],
     function (error, result, fields) {
       if (error) return console.error(error);
       saveFile(node);
     });
  }

  response.end();
});

function saveFile(node) {
  var promises = [];

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  //So we only save the node when the async stuff is finished.
  var filesaveLatch = when.defer();
  var tagLatch = when.defer();

  //Save the file with the nodeID.
  filehandler.saveFile(node, function(error, node) {
    if (error) return console.error(error);
    console.log("resolving file save latch");
    filesaveLatch.resolve();
  });
  promises.push(filesaveLatch.promise);

  tags = [];

  moveTagsToSingleArray(node, function(error, tagArray) {
    if (error) return console.error(error);
    tags = tagArray;
    console.log("resolving Tag latch");
    tagLatch.resolve();
  });
  promises.push(tagLatch.promise);

  //When this triggers, all promises have been resolved.
  when.all(promises).then(updateTags(tags, node.nodeID));
}

//Adds any new tags in the list, and removes any tags that are not.
function updateTags (tags, nodeID) {
  console.log('Finished Promises, uploading node');
  console.log(tags);

  //Insert array of tags into tags table all at once. (Ignore ignores duplicate inserts)
  pool.query("INSERT IGNORE INTO tags (node_ID, `key`, `value`) VALUES ?", [tags],
   function(error) {
    if (error) {  throw error;  }
  });

  //Delete tags that are in the database but no longer in the list to be saved (I.E the user has removed it)
  //Map isn't the greatest for compatability, so maybe need to implement a fallback method.
  //Here it gets column 3 from tags, so we're left with an array of just the tag values check against in the query.
  pool.query("DELETE FROM tags WHERE node_ID = ? AND `value` NOT IN ?", [nodeID, [tags.map(x=> x[2])]],
   function(error) {
    if (error) {  throw error;  }
  });
}

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
