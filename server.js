var http = require('http');
var mysql = require("mysql");
var express = require('express');
var fs = require('fs');

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
  next(); //Allow the necreationdatext router to be executed.
});

router.get('/', function(request, response) {
  response.send('Root page, /addData to add data')
});

router.get('/viewItem/:itemID', function(req, res) {
  pool.query('select * from items where item_ID = ?', [req.params.itemID], function(err, rows) {
    pool.query('select * from tags where item_ID = ?', [req.params.itemID], function(err, tags) {
      var params = {};
      if (rows[0]) {
         params = {
          item: {
            itemID: req.params.itemID,
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
      res.render("viewItem", params);
    });
  });
});

router.get('/addItem', function(req, res) {
  pool.query('select * from items', function(err, itemRes) {
    pool.query('select * from tags', function(err, tagRes) {

      var items = [];

      if (itemRes[0]) { //Only bother if theres some items returned.
         var time;
         itemRes.forEach(function(item) {
           var userTags = [], sysTags = [];

           if (tagRes[0]) {
             var itemTags = tagRes.filter(tagsItem, item); //Run the tagsItem method on  tagRes, setting 'this' within the method to
             //Split Item tags into User and System Tags
             for (var i in itemTags) {
                if (itemTags[i].key == "userDef") {
                  userTags.push(itemTags[i].value);
                } else {
                  sysTags.push({key: itemTags[i].key, value: itemTags[i].value});
                }
             }
           }

          items.push({
            itemID: item.item_ID,
            revisionDate: item.revision_date,
            filePointer: item.file_pointer,
            userTags: userTags,
            sysTags: sysTags
          });
        });
      } else {
        items = [];
      }
      res.render("addItem", {items: items});
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
router.post('/addItem', function(req,res){

  var item=JSON.parse(req.body.item);
  console.log(item);
  var itemID;

  pool.query('INSERT INTO items SET ?', {version: 0, file_pointer: item.filePointer},
   function (error, result, fields) {
    if (error) throw error;
    itemID = result.insertId;
    console.log("Insert ID: " + result.insertId);

    var tags = [];

    //Add tags to single formatted array for pushing to database.
    for (var i in item.userTags) {
      tags.push([itemID, "userDef", item.userTags[i].trim()]);
    }

    for (var i in item.sysTags) {
      tags.push([itemID, item.sysTags[i].key, item.sysTags[i].value.trim()]);
    }

    console.log("\nTags are: " + tags);

    //Insert array of tags into tags table all at once.
    pool.query("INSERT INTO tags (item_ID, `key`, `value`) VALUES ?", [tags],
     function(error) {
      if (error) throw error;
    });
  });

  res.end("yes");
});

app.use("/",router);

app.listen(8080, function () {
  console.log('Listening on port 8080')
});
