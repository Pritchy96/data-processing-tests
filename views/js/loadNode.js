//Loads 'node' to the main window for editing.

var loadedNode = null;

//Returns the system tag that has the key 'Title'
function getTitle(tag) {
  return tag.key == "title";
}

function loadNode(node){
  //DEBUG
  console.log(node);

  //TODO :save old node if loadedNode is not null first?
  //if (loadedNode) {
  //  submitNode(loadedNode);
  //}

  loadedNode = node;

  if (!loadedNode.version) {

  }

  var nodeContent = document.getElementById('nodeContent');
  nodeContent.value = node.content;

  var nodeTitle = document.getElementById('nodeTitle');
  nodeTitle.value = node.sysTags.find(getTitle).value;

  var tagString = "";

  for (var userTag in node.userTags){
    tagString += node.userTags[userTag] + ", ";
  }

  var nodeTags = document.getElementById('nodeTags');
  nodeTags.value = tagString;
}
