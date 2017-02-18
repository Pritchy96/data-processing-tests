//Triggers on clicking 'save' button, pushes content of item back to server.js
$(document).ready(function(){
  var title, tags, content;
  $("#button-save-item").click(function(){
    title=$("#itemTitle").val();
    tags=$("#itemTags").val();
    content=$("#itemContent").val();

    $.post("http://localhost:8080/addItem", {itemTitle: title, itemTags: tags, itemContent: content}, function(data){
      if(data==='done')
        {
          alert("login success");
        }
    });
  });
});
