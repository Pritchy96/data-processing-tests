var moira = require("./moiraInterface");

function submitNode(nodeObj){
  console.log("submitting node to server side of client:")
  console.log(nodeObj);

  $.post("http://localhost:8080/saveNode", {'node' : JSON.stringify(nodeObj)}, function(data){
  });
}

//Triggers on clicking 'save' button, pushes content of node back to server.js where it is caught with a POST reqeust.
$(document).ready(function() {
  $("#button-save-node").click(function(){
    var node, sysTags = [], userTags = [], content;

    content = $("#nodeContent").val();

    sysTags.push({key: "title", value: $("#nodeTitle").val().trim()});

    userTags = $("#nodeTags").val().split(",");

    //Strip out any whitepace, null etc strings in the array.
    userTags = userTags.filter(function(entry) { return entry.trim() != ''; });

    var promises = [];

    //Latches, which are 'resolved' when the async method they are assigned to finish.
    //So we only save the node when the async stuff is finished.
    var tagLatch = when.defer();  //Moves the sysTags and userTags to a single array for saving to db.

    tags = [];

    moira.data_utils.moveTagsToSingleArray(node, function(error, tagArray) {
      if (error) return console.error(error);
      tags = tagArray;
      console.log("resolving Tag latch");
      tagLatch.resolve();
    });

    promises.push(tagLatch.promise);

    //When this triggers, all promises have been resolved.
    //Update tags last, so that if the node updating fails we don't update these.
    when.all(promises).then(
      updateTags(tags, node.nodeID)

      node = {
        content: content,
        tags: tags,
        version: -1
      };

      if (loadedNode) {
        node.nodeID = loadedNode.nodeID;
        node.version = loadedNode.version;
      }

      submitNode(node);
    );
  });
});
