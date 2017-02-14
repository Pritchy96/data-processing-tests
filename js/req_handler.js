var http = require('http');
var mysql = require("mysql");
var express = require('express')

var server = express()

//Routing pagess
var addDataPage = require('./addData')

server.get('/', function (request, response) {
  response.send('Root page, /addData to add data')
})

server.get('/addData', function (request, response) {

  response.write('Entering addData \n');

	//Content to be added to DB.
	//var temp = request.query.temp; // Get temp from request.
	//var ID = request.query.ID; // Get deviceID from request.

	//var entry = { tempC: temp, deviceID: ID };

	// First you need to create a connection to the db
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "server",
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
	});

	con.end(function(err) {
		//End transmission after query is finished.
		response.end("End of transmission");
	  // The connection is terminated gracefully
	  // Ensures all previously enqueued queries are still
	  // before sending a COM_QUIT packet to the MySQL server.
	});
})

server.get('/getData', function (request, response) {

	// First you need to create a connection to the db
	var con = mysql.createConnection({
	  host: "localhost",
	  user: "server",
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


	//con.query('SELECT * FROM temp',function(err,rows){
	  //if(err) throw err;

    /*
	  console.log('Data received from Db:\n');
	  console.log(rows);

	  for (var i = 0; i < rows.length; i++) {
			response.write(rows[i].entryID
				+ " " + rows[i].tempC
				+ "\n");
	  }
	});
  */

	con.end(function(err) {
		//End transmission after query is finished.
		response.end();
	  // The connection is terminated gracefully
	  // Ensures all previously enqueued queries are still
	  // before sending a COM_QUIT packet to the MySQL server.
	});
})

server.listen(2000, function () {
  console.log('Listening on port 2000')
})
