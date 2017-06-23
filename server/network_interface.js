var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var fh = require("./filehandler.js");
var filehandler = new fh();
var when = require('when');

var app = express();
var router = express.Router();
var bodyParser = require('body-parser')  ;

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
  response.send('Welcome to MOIRA.')
});

router.get('/getNodeById', function(request, response) {
  //pool.query('select * from nodes', function(err, nodeRes) {
  //  pool.query('select * from tags', function(err, tagRes) {

  console.log(request.query.node_id);
  pool.query('SELECT * FROM nodes WHERE node_ID = ?', [request.query.node_id], function(err, nodeRes) {
    pool.query('SELECT * FROM tags WHERE node_ID = ?', [request.query.node_id], function(err, tagRes) {
      var promises = [], nodes = [];

      if (nodeRes[0]) { //Only bother if there are some nodes returned
        nodeRes.forEach(function(node) {

          //Latches, which are 'resolved' when the async method they are assigned to finish.
          //So we only save the node when the async stuff is finished.
          var fileloadLatch = when.defer();

          filehandler.loadFile(node, function(error, content) {
            if (error) console.error(error);

            node.content = content;
            console.log("node content (in callback): ");
            console.log(content);

            fileloadLatch.resolve();
          });

          promises.push(fileloadLatch.promise);

          var userTags = [], sysTags = [];

          if (tagRes[0]) {
            var nodeTags = tagRes.filter(isTagOfNode, node); //Run the isTagOfNode method on tagRes, setting 'this' within the method to
            //Split Node tags into User and System Tags
            for (var i in nodeTags) {
              if (nodeTags[i].key == "userDef") {
                userTags.push(nodeTags[i].value);
              } else {
                sysTags.push({key: nodeTags[i].key, value: nodeTags[i].value});
              }
            }
          }

          //When this triggers, all promises for the current node have been resolved.
          when.all(promises).then(function () {
            nodes.push({  //Push the current nodes content to the list of nodes
              nodeID: node.node_ID,
              revisionDate: node.revision_date.toISOString(),
              content: node.content,
              version: node.version,
              userTags: userTags,
              sysTags: sysTags
            });
          });
        });
      } else {
        nodes = [];
      }

      //When this triggers, all promises from all nodes have been resolved.
      when.all(promises).then(function () {
        response.send(JSON.stringify(nodes[0])); //Only one node should be returned.
      });
    });
  });
});

//This should be a temporary method, to be replaced with tag based searching, etc.
router.get('/getAllNodes', function(request, response) {
  pool.query('select * from nodes', function(err, nodeRes) {
    pool.query('select * from tags', function(err, tagRes) {

      var promises = [], nodes = [];

      if (nodeRes[0]) { //Only bother if there are some nodes returned
        nodeRes.forEach(function(node) {

          //Latches, which are 'resolved' when the async method they are assigned to finish.
          //So we only save the node when the async stuff is finished.
          var fileloadLatch = when.defer();

          filehandler.loadFile(node, function(error, content) {
            if (error) console.error(error);

            node.content = content;
            console.log("node content (in callback): ");
            console.log(content);

            fileloadLatch.resolve();
          });

          promises.push(fileloadLatch.promise);

          var userTags = [], sysTags = [];

          if (tagRes[0]) {
            var nodeTags = tagRes.filter(isTagOfNode, node); //Run the isTagOfNode method on tagRes, setting 'this' within the method to
            //Split Node tags into User and System Tags
            for (var i in nodeTags) {
              if (nodeTags[i].key == "userDef") {
                userTags.push(nodeTags[i].value);
              } else {
                sysTags.push({key: nodeTags[i].key, value: nodeTags[i].value});
              }
            }
          }

          //When this triggers, all promises for the current node have been resolved.
          when.all(promises).then(function () {
            nodes.push({  //Push the current nodes content to the list of nodes
              nodeID: node.node_ID,
              revisionDate: node.revision_date.toISOString(),
              content: node.content,
              version: node.version,
              userTags: userTags,
              sysTags: sysTags
            });
          });
        });
      } else {
        nodes = [];
      }

      //When this triggers, all promises from all nodes have been resolved.
      when.all(promises).then(function () {
        response.send(JSON.stringify(nodes));
      });
    });
  });
});

//Checks if node(this).node_ID == tag.nodeID. Used in getNodeById, returns a bool
function isTagOfNode(tag) {
  //'this' is set by the second parameter that calls this function.
  //God knows why. In this case it will be an node that we're creating.
  return this.node_ID == tag.node_ID;
}

//Router.get("*", function(request, response) {});

//Set the delete date on the node, starting its purge timer.
router.post('/deleteNode', function(request, response) {
  console.log(request.query.node_id);

    pool.query('UPDATE nodes SET delete_date = CURRENT_TIMESTAMP WHERE node_ID = ?', [node.nodeID],
     function (error, result, fields) {
       if (error) return console.error(error);
     });

  response.end();
});

//Remove the delete date from a node, restoring it.
router.post('/restoreNode', function(request, response) {
  console.log(request.query.node_id);

    pool.query('UPDATE nodes SET delete_date = NULL WHERE node_ID = ?', [node.nodeID],
     function (error, result, fields) {
       if (error) return console.error(error);
     });

  response.end();
});

router.post('/saveNode', function(request, response) {
  var node = JSON.parse(request.body.node);

  //Update version number.
  node.version = node.version + 1;

  console.log(node);

  if (node.version == 0) {  //New node.
    pool.query('INSERT INTO nodes SET ?', {version: node.version},
     function (error, result, fields) {
      if (error) return console.error(error);
      node.nodeID = result.insertId;
      console.log("Insert ID: " + node.nodeID);
      saveFile(node);
    });
  } else {  //Update existing node.
    pool.query('UPDATE nodes SET version = ? WHERE node_ID = ?', [node.version, node.nodeID],
     function (error, result, fields) {
       if (error) return console.error(error);
       saveFile(node);
     });
  }

  response.end();
});

//Saves file (and updates tags).
function saveFile(node) {
  var promises = [];

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  //So we only save the node when the async stuff is finished.
  var filesaveLatch = when.defer();
  var tagLatch = when.defer();  //Moves the sysTags and userTags to a single array for saving to db.

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
  //Update tags last, so that if the node updating fails we don't update these.
  when.all(promises).then(updateTags(tags, node.nodeID));
}

 //Moves the sysTags and userTags to a single array for saving to db.

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

//Adds any new tags in the list, and removes any tags that are not.
function updateTags (tags, nodeID) {
  console.log('Finished Promises, uploading node');

  //Insert array of tags into tags table all at once. (Ignore ignores duplicate inserts)
  pool.query("INSERT IGNORE INTO tags (node_ID, `key`, `value`) VALUES ?", [tags],
   function(error) {
    if (error) console.error(error);
  });

  //Delete tags that are in the database but no longer in the list to be saved (I.E the user has removed it)
  //Map isn't the greatest for compatability, so maybe need to implement a fallback method.
  //Here it gets column 3 from tags, so we're left with an array of just the tag values check against in the query.
  pool.query("DELETE FROM tags WHERE node_ID = ? AND `value` NOT IN ?", [nodeID, [tags.map(x=> x[2])]],
   function(error) {
    if (error) console.error(error);
  });
}

app.use("/",router);

app.listen(8080, function () {
  console.log('Listening on port 8080')
});
