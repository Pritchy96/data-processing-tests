var fs = require('fs');

var filehandler = function (){
   this.saveFile = function (item, callback){
     var root = 'filestore';

      if (!fs.existsSync(root)){
          fs.mkdirSync(root);
      }

      //Path is the unique ID of the item in the databse.
      var itemFolder = root + "/" + item.itemID;

      if (!fs.existsSync(itemFolder)){
          fs.mkdirSync(itemFolder);
      }

      //Handle file extensions here?
      fs.writeFile(itemFolder + "/" + item.version, item.content, function(err) {
         if(err) {
             return console.log(err);
             //If there is an error here, we're in trouble, as the files data will
             //already have been written to the database. Need some way to do tis synchronously,
             //Or remove the item from database and present error here.
         }

         console.log("File saved.");
         callback(null, item);
     });
   };

   //Loads the content of an item from the filestore, given the items database entry.
   this.loadFile = function (item, callback) {

     if (item.item_ID == null || item.version == null) {
       return console.error("item does not have id or version, cannot load")
     }

      var itemLocation = "filestore/" + item.item_ID + "/" + item.version;

      //Specify an encoding to return a string, or not to return an ASCII buffer.
      fs.readFile( itemLocation, { encoding: 'utf8' }, function (err, content) {
        if (err) {
          throw err;
        }

        callback(null, content);
      });
   };
};

module.exports = filehandler;
