var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var when = require('when');

var config = require("./config.js");
var fh = require("./filehandler.js");

var dbHandler = require(`./db_handler`);

var filehandler = new fh();
var router = express.Router();
var bodyParser = require('body-parser')
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mysqlParams = {
  connectionLimit: 30,
  host: config.moira.db.host,
  user: config.moira.db.user,
  password: config.moira.db.password,
  database: config.moira.db.database
};

var pool = mysql.createPool(mysqlParams);

router.use(function (request, response, next) {
  console.log("/" + request.method);  //Always print request to server console.
  console.log("requesting " + request.url);  //Always print request to server console.
  next(); //Allow the router addto be executed.
});

router.get('/', function(request, response) {
  response.send('Welcome to MOIRA.')
});

//Deprecated: Rewrite
router.get('/getNodeById', function(request, response) {

  console.log(request.query.node_id);
  pool.query('SELECT * FROM nodes WHERE node_ID = ?', [request.query.node_id], function(err, nodeRes) {
    pool.query('SELECT * FROM tags WHERE node_ID = ?', [request.query.node_id], function(err, tagRes) {
      var promises = [], nodes = [];

      if (nodeRes[0]) { //Only bother if there are some nodes returned
        nodeRes.forEach(function(node) {

          var tags = [];

          if (tagRes[0]) {
            var nodeTags = tagRes.filter(isTagOfNode, node); //Run the isTagOfNode method on tagRes, setting 'this' within the method to
            //Split Node tags into User and System Tags
            for (var i in nodeTags) {
                tags.push({key: nodeTags[i].key, value: nodeTags[i].value});
            }
          }

          //When this triggers, all promises for the current node have been resolved.
          when.all(promises).then(function () {
            nodes.push({  //Push the current nodes content to the list of nodes
              nodeID: node.node_ID,
              addDate: node.content,
              deleteDate: node.version,
              tags: tags
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

//Deprecated: Rewrite
//This should be a temporary method, to be replaced with tag based searching, etc.
router.get('/getAllNodes', function(request, response) {
  pool.query('SELECT * FROM nodes', function(err, nodeRes) {
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

          var tags = [];

          if (tagRes[0]) {
            var nodeTags = tagRes.filter(isTagOfNode, node); //Run the isTagOfNode method on tagRes, setting 'this' within the method to
            //Split Node tags into User and System Tags
            for (var i in nodeTags) {
                tags.push({key: nodeTags[i].key, value: nodeTags[i].value});
            }
          }

          //When this triggers, all promises for the current node have been resolved.
          when.all(promises).then(function () {
            nodes.push({  //Push the current nodes content to the list of nodes
              nodeID: node.node_ID,
              revisionDate: node.revision_date.toISOString(),
              content: node.content,
              version: node.version,
              tags: tags
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

router.get('/getMasterList', function(request, response) {
    pool.query('SELECT * FROM tag_types', function (err, tag_types) {
      console.log(tag_types);
      response.send(tag_types);
    });
});

//Checks if node(this).node_ID == tag.nodeID. Used in getNodeById, returns a bool
function isTagOfNode(tag) {
  //'this' is set by the second parameter that calls this function.
  //God knows why. In this case it will be an node that we're creating.
  return this.node_ID == tag.node_ID;
}

router.post('/addTag', function(request, response) {
  dbHandler.addTag( request.body.node_ID, request.body.tag_name, request.body.tag_data, request.body.tag_type)
});

  
//Set the delete date on the node, starting its purge timer.
router.post('/deleteNode', function(request, response) {
  console.log(request.query.node_id);
  dbHandler.deleteNode(request.resetDeleteDate == true ? true : false, function(request, response) {
    response.end();  
  });
});

//Remove the delete date from a node, restoring it.
router.post('/restoreNode', function(request, response) {
  console.log(request.query.node_id);

    pool.query('UPDATE nodes SET deletion_date = NULL WHERE node_ID = ?', [node.nodeID],
     function (error, result, fields) {
       if (error) return console.error(error);
     });

  response.end();
});

//Deprecated
router.post('/saveNode', function(request, response) {
  console.log("Reached MOIRA saveNode");
  console.log(request.body.node);
  var node = request.body.node;

  //Update version number.
  node.version = node.version + 1;

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
       response.write(JSON.stringify("Upload Complete")); //This should really go in saveFile callback.
       response.end();
     });
  }
});

router.post('/addNode', function(request, response) {
  console.log("Reached MOIRA addNode");
  var tag = request.body.tag;

  dbHandler.addNode((node_ID) => {
    if (tag) {
      console.log(`tag_type: ${tag.tag_type}`);
      dbHandler.addTag(node_ID, tag.tag_name, tag.tag_data, tag.tag_type, undefined);
    }
  });
});

//Deprecated
//Saves file (and updates tags).
function saveFile(node) {
  var promises = [];

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  //So we only save the node when the async stuff is finished.
  var filesaveLatch = when.defer();

  //Save the file with the nodeID.
  filehandler.saveFile(node, function(error, node) {
    if (error) return console.error(error);
    console.log("resolving file save latch");
    filesaveLatch.resolve();
  });
  promises.push(filesaveLatch.promise);

  //When this triggers, all promises have been resolved.
  //Update tags last, so that if the node updating fails we don't update these.
  when.all(promises).then(updateTags(node.tags, node.nodeID));
}

//Deprecated
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

app.listen(config.moira.ni.port, function () {
  console.log('Listening on port ' + config.moira.ni.port);
});
