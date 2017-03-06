var http = require('http');
var mysql = require('mysql');
var express = require('express');
var fs = require('fs');
var fh = require("./filehandler.js");
var filehandler = new fh();
var when = require('when');

var app = express();
app.set('view engine', 'ejs');
var router = express.Router();
var path = __dirname + '/views/';
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
  next(); //Allow the necreationdatext router to be executed.
});

router.get('/', function(request, response) {
  response.send('Root page, /addData to add data')
});

router.get('/viewItem/:itemID', function(request, response) {
  pool.query('select * from items where item_ID = ?', [request.params.itemID], function(err, rows) {
    pool.query('select * from tags where item_ID = ?', [request.params.itemID], function(err, tags) {
      var params = {};
      if (rows[0]) {
         params = {
          item: {
            itemID: request.params.itemID,
            version: rows[0].version,
            filePointer: rows[0].file_pointer,
            creationDate: rows[0].creation_date,
            revisionDate: rows[0].revision_date,
            tags: []
          }
        };
        tags.forEach(function(tag) {
          params.item.tags.push({
            tagID: tag.tag_ID,
            itemID: tag.item_ID,
            key: tag.key,
            value: tag.value
          });
        });
      } else {
      params = { item : null };
      }
      response.render("viewItem", params);
    });
  });
});

router.get('/addItem', function(request, response) {
  pool.query('select * from items', function(err, itemRes) {
    pool.query('select * from tags', function(err, tagRes) {

      var promises = [], items = [];

      if (itemRes[0]) { //Only bother if there are some items returned
        itemRes.forEach(function(item) {

          //Latches, which are 'resolved' when the async method they are assigned to finish.
          //So we only save the item when the async stuff is finished.
          var fileloadLatch = when.defer();


          filehandler.loadFile(item, function(error, content) {
            if (error) console.error(error);

            item.content = content;
            console.log("item content (in callback): ");
            console.log(content);

            fileloadLatch.resolve();
          });

          promises.push(fileloadLatch.promise);

          var userTags = [], sysTags = [];

          if (tagRes[0]) {
            var itemTags = tagRes.filter(tagsItem, item); //Run the tagsItem method on tagRes, setting 'this' within the method to
            //Split Item tags into User and System Tags
            for (var i in itemTags) {
              if (itemTags[i].key == "userDef") {
                userTags.push(itemTags[i].value);
              } else {
                sysTags.push({key: itemTags[i].key, value: itemTags[i].value});
              }
            }
          }

          //When this triggers, all promises for the current item have been resolved.
          when.all(promises).then(function () {
            items.push({  //Push the current items content to the list of items
              itemID: item.item_ID,
              revisionDate: item.revision_date,
              content: item.content,
              version: item.version,
              userTags: userTags,
              sysTags: sysTags
            });
          });
        });
      } else {
        items = [];
      }

      //When this triggers, all promises from all items have been resolved.
      when.all(promises).then(function () {
        response.render("addItem", {items: items});
      });
    });
  });
});

//Runs through an array of tags, and checks if item.item_ID == tag.itemID.
function tagsItem(tag) {
  //This is set by the second parameter that calls this function.
  //God knows why. In this case it will be an item that we're creating.
  return this.item_ID == tag.item_ID;
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
     response.sendFile(path + "404.html");
   }
});

//Save Item.
router.post('/addItem', function(request, response){
  var item=JSON.parse(request.body.item);

  //Update version number.
  item.version = item.version + 1;

  console.log(item);

  if (item.version == 0) {  //New item.
    pool.query('INSERT INTO items SET ?', {version: item.version},
     function (error, result, fields) {
      if (error) throw error;
      item.itemID = result.insertId;
      console.log("Insert ID: " + item.itemID);
      saveFile(item);
    });
  } else {  //Update existing item.
    pool.query('UPDATE items SET version = ? WHERE item_ID = ?', [item.version, item.itemID],
     function (error, result, fields) {
       if (error) throw error;
       saveFile(item);
     });
  }

  response.end("yes");
});

function saveFile(item) {
  var promises = [];

  //Latches, which are 'resolved' when the async method they are assigned to finish.
  //So we only save the item when the async stuff is finished.
  var filesaveLatch = when.defer();
  var tagLatch = when.defer();

  //Save the file with the itemID.
  filehandler.saveFile(item, function(error, item) {
    if (error) return console.error(error);
    console.log("resolving file save latch");
    filesaveLatch.resolve();
  });
  promises.push(filesaveLatch.promise);

  tags = [];

  addTags(item, function(error, tagArray) {
    if (error) return console.error(error);
    tags = tagArray;
    console.log("resolving Tag latch");
    tagLatch.resolve();
  });
  promises.push(tagLatch.promise);


  //When this triggers, all promises have been resolved.
  when.all(promises).then(function () {
    console.log('Finished Promises, uploading item');

    //Insert array of tags into tags table all at once.
    pool.query("INSERT INTO tags (item_ID, `key`, `value`) VALUES ?", [tags],
     function(error) {
      if (error) throw error;
    });
  });
}

function addTags(item, callback) {
  var tags = [];

  //Add tags to single formatted array for pushing to database.
  for (var i in item.userTags) {
    tags.push([item.itemID, "userDef", item.userTags[i].trim()]);
  }

  for (var i in item.sysTags) {
    tags.push([item.itemID, item.sysTags[i].key, item.sysTags[i].value.trim()]);
  }

  console.log(tags);

  callback(null, tags);
}

app.use("/",router);

app.listen(8080, function () {
  console.log('Listening on port 8080')
});
