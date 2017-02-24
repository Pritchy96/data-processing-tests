var loadedItem = null;

//Returns the system tag that has the key 'Title'
function getTitle(tag) {
  return tag.key == "title";
}

function loadItem(item){
  //TODO: save old item if loadedItem is not null first.
  //loadedItem = itemlist[0];
  console.log(item);

  if (loadedItem) {
    submitItem(item);
  }

  var itemContent = document.getElementById('itemContent');
  itemContent.value = item.filePointer;

  var itemTitle = document.getElementById('itemTitle');
  itemTitle.value = item.sysTags.find(getTitle).value;

  var tagString = "";

  for (var userTag in item.userTags){
    tagString += item.userTags[userTag] + ", ";
  }

  var itemTags = document.getElementById('itemTags');
  itemTags.value = tagString;
}
