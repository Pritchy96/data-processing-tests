//Loads 'item' to the main window for editing.

var loadedItem = null;

//Returns the system tag that has the key 'Title'
function getTitle(tag) {
  return tag.key == "title";
}

function loadItem(item){


  //DEBUG
  console.log(item);

  //TODO :save old item if loadedItem is not null first?
  //if (loadedItem) {
  //  submitItem(loadedItem);
  //}

  loadedItem = item;

  if (!loadedItem.version) {

  }

  var itemContent = document.getElementById('itemContent');
  itemContent.value = item.content;

  var itemTitle = document.getElementById('itemTitle');
  itemTitle.value = item.sysTags.find(getTitle).value;

  var tagString = "";

  for (var userTag in item.userTags){
    tagString += item.userTags[userTag] + ", ";
  }

  var itemTags = document.getElementById('itemTags');
  itemTags.value = tagString;
}
