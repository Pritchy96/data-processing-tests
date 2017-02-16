var http = require('http');
var mysql = require("mysql");
var express = require('express');
var fs = require('fs');

var app = express();
app.set('view engine', 'ejs');
var router = express.Router();
var path = __dirname + '/views/';

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
  next(); //Allow the next router to be executed.
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
            filepointer: rows[0].file_pointer,
            creationdate: rows[0].creation_date,
            revisiondate: rows[0].revision_date,
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


router.get("*", function(request, response) {
   //If the file path exists, serve the html file, otherwise serve 404.
   var filePath = path + request.url;

   if(filePath.indexOf('.') == -1)
  {
    //Period found.
    filePath += ".html"
  }

   console.log(filePath);

   if(fs.existsSync(filePath)) {
     response.sendFile(filePath);
   } else {
     response.sendFile(path + "404.html");
   }
});


app.use("/",router);


app.listen(8080, function () {
  console.log('Listening on port 8080')
});


/*

app.get('/addData', function (request, response) {

  response.write('Entering addData \n');

	//Content to be added to DB.
	//var temp = request.query.temp; // Get temp from request.
	//var ID = request.query.ID; // Get deviceID from request.

	//var entry = { tempC: temp, deviceID: ID };

	// First you need to create a connection to the db
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "app",
	  password: "ayylmao",
	  database: "data"
	});

	con.connect(function(err){
	  if(err){
	    console.log('Error connecting to Db');
	    return;
	  }
	  console.log('Connection established');
		response.write('Connection established \n');

	});

	//con.query('INSERT INTO temp SET ?', entry, function(err,res){
	  //if(err) throw err;

	  //console.log('Last insert deviceID:', res.deviceID);
	//});

	con.end(function(err) {
		//End transmission after query is finished.
		response.end("End of transmission");
	  // The connection is terminated gracefully
	  // Ensures all previously enqueued queries are still
	  // before sending a COM_QUIT packet to the MySQL app.
	});
})

app.get('/getData', function (request, response) {

	// First you need to create a connection to the db
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "app",
	  password: "ayylmao",
	  database: "data"
	});

	con.connect(function(err){
	  if(err){
	    console.log('Error connecting to Db');
	    return;
	  }
	  console.log('Connection established');

	});


	con.query('SELECT * FROM items',function(err,rows){
	  if(err) throw err;


	  console.log('Data received from Db:\n');
	  console.log(rows);

	  for (var i = 0; i < rows.length; i++) {
			response.write(rows[i].item_ID
				+ " " + rows[i].creation_date
        + " " + rows[i].revision_date
				+ "\n");
	  }
	});

	con.end(function(err) {
		//End transmission after query is finished.
		response.end();
	  // The connection is terminated gracefully
	  // Ensures all previously enqueued queries are still
	  // before sending a COM_QUIT packet to the MySQL app.
	});
})
*/
