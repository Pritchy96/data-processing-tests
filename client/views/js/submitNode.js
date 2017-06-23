function submitNode(nodeObj){
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

    node = {
      content: content,
      userTags: userTags,
      sysTags: sysTags,
      version: -1
    };

    if (loadedNode) {
      node.nodeID = loadedNode.nodeID;
      node.version = loadedNode.version;
    }

    submitNode(node);
  });
});
