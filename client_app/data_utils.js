var data_utils = {};

data_utils.moveTagsToSingleArray = function(node, callback) {
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

//Runs through an array of tags, and checks if node.node_ID == tag.nodeID.
data_utils.isNodeTaggedWith = function (tag) {
  //Scope is set by the second parameter that calls this function.
  //God knows why. In this case it will be a node that we're creating.
  return this.node_ID == tag.node_ID;
}

module.exports = data_utils;
