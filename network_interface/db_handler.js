var mysql = require('mysql');
var fs = require('fs');
var config = require("./config.js");

//Create a connection to the db
var mysqlParams = {
  connectionLimit: 30,
  host: config.moira.db.host,
  user: config.moira.db.user,
  password: config.moira.db.password,
  database: config.moira.db.database
};

var pool = mysql.createPool(mysqlParams);

module.exports = {
  addNode: (callback) => {
    pool.query('INSERT INTO `nodes` VALUES ()',
     function (error, result, fields) {
      console.log("Added Node")
      if (error) return console.error(error);
      if (callback) callback(result.insertId);
    });
  },

  //TODO: Promisify?
  addTag: (nodeId, tagName, tagData, tagType, callback) => {
    pool.query('INSERT INTO `tags` SET ?',
      { tag_type_id: tagType.tagTypeId,
        node_id: nodeId,
        key: tagName,
      },
     function (error, result, fields) {
      if (error) return console.error(error);
      addToTagTypeTable(tagType.tagTableType, tagData, result.insertId, callback);
    });
  },

  deleteNode: (nodeId, resetDeleteDate = false, callback) => {
    if (!resetDeleteDate) {
      pool.query('SELECT deletion_date FROM nodes WHERE node_id = ?'), [nodeId], function(error, result) {
        if (result != NULL) return callback();
      }
    }

    pool.query('UPDATE nodes SET deletion_date = CURRENT_TIMESTAMP WHERE node_id = ?', [nodeId],
    function (error, result, fields) {
      if (error) return console.error(error);
    });
  }
}

function addToTagTypeTable(tagTableType, tagData, tagId, callback) {
  console.log("adding tag to type table..");

  pool.query('INSERT INTO ?? SET ?', [tagTableType,
    { value: tagData,
      tag_id: tagId
    }],
   function (error, result, fields) {
    //TODO: Drop tag entry here.
    if (error) return console.error(error);
    if (callback) callback();
  });
};
