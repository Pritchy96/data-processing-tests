function submitItem(itemObj){
  console.log(itemObj);

  $.post("http://localhost:8080/addItem", {item : JSON.stringify(itemObj)}, function(data){
  });
}

//Triggers on clicking 'save' button, pushes content of item back to server.js where it is caught with a POST reqeust.
$(document).ready(function() {
  $("#button-save-item").click(function(){
    var item, sysTags = [], userTags = [], content;

    content = $("#itemContent").val();

    sysTags.push({key: "title", value: $("#itemTitle").val().trim()});

    userTags = $("#itemTags").val().split(",");

    //Strip out any whitepace, null etc strings in the array.
    userTags = userTags.filter(function(entry) { return entry.trim() != ''; });

    item = {
      content: content,
      userTags: userTags,
      sysTags: sysTags,
      version: -1
    };

    if (loadedItem) {
      item.itemID = loadedItem.itemID;
      item.version = loadedItem.version;
    }

    submitItem(item);
  });
});
