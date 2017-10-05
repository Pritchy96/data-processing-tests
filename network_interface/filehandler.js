var fs = require('fs');
var root = __dirname + '/filestore';

var filehandler = function (){
   this.saveFile = function (node, callback){

      if (!fs.existsSync(root)){
          fs.mkdirSync(root);
      }

      //Path is the unique ID of the node in the databse.

      var nodeFolder = root + "/" + node.nodeId;
      if (!fs.existsSync(nodeFolder)){
          fs.mkdirSync(nodeFolder);
      }

      //Handle file extensions here?
      fs.writeFile(nodeFolder + "/" + node.version, node.content, function(err) {
         if(err) {
             return console.log(err);
             //If there is an error here, we're in trouble, as the files data will
             //already have been written to the database. Need some way to do tis synchronously,
             //Or remove the node from database and present error here.
         }

         console.log("File saved.");
         callback(null, node);
     });
   };

   //Loads the content of an node from the filestore, given the nodes database entry.
   this.loadFile = function (node, callback) {

     if (node.nodeId == null || node.version == null) {
       return console.error("node does not have id or version, cannot load")
     }

      var nodeLocation = root + "/" + node.nodeId + "/" + node.version;

      //Specify an encoding to return a string, or not to return an ASCII buffer.
      fs.readFile( nodeLocation, { encoding: 'utf8' }, function (error, content) {
        if (error) return console.error(error);
        callback(null, content);
      });
   };
};

module.exports = filehandler;
