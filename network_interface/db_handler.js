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
  addTag: (node_id, tag_name, tag_data, tag_type, callback) => {
    pool.query('INSERT INTO `tags` SET ?',
      { tag_type_ID: tag_type.tag_type_ID,
        node_id: node_id,
        key: tag_name,
      },
     function (error, result, fields) {
      if (error) return console.error(error);
      addToTagTypeTable(tag_type.tag_table_type, tag_data, result.insertId, callback);
    });
  },

  deleteNode: (node_id, resetDeleteDate = false, callback) => {

    if (!resetDeleteDate) {
      pool.query('SELECT deletion_date FROM nodes WHERE node_ID = ?'), [node_id], function(error, result) {
        if (result != NULL) return callback(); 
      }
    }

    pool.query('UPDATE nodes SET deletion_date = CURRENT_TIMESTAMP WHERE node_ID = ?', [node_id],
    function (error, result, fields) {
      if (error) return console.error(error);
    });
  }
}

function addToTagTypeTable(tag_table_type, tag_data, tag_id, callback) {
  console.log("adding tag to type table..");

  pool.query('INSERT INTO ?? SET ?', [tag_table_type,
    { value: tag_data,
      tag_ID: tag_id
    }],
   function (error, result, fields) {
    //TODO: Drop tag entry here.
    if (error) return console.error(error);
    if (callback) callback();
  });
};
