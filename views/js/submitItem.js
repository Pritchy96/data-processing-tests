function submitItem(itemObj){
  console.log(itemObj);

  $.post("http://52.39.116.224:8080/addItem", {item : JSON.stringify(itemObj)}, function(data){
  });
}

//Triggers on clicking 'save' button, pushes content of item back to server.js where it is caught with a POST reqeust.
$(document).ready(function(){
  $("#button-save-item").click(function(){
    var item, sysTags = [], userTags = [], filePointer;

    sysTags.push({key: "title", value: $("#itemTitle").val().trim()});

    //Todo: .trim each tag.
    var userTags = $("#itemTags").val().split(",");

    filePointer = $("#itemContent").val();

    item = {
      filePointer: filePointer,
      userTags: userTags,
      sysTags: sysTags
    };

    submitItem(item);
  });
});
