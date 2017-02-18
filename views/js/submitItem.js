//Triggers on clicking 'save' button, pushes content of item back to server.js where it is caught with a POST reqeust.
$(document).ready(function(){
  var title, tags, content;
  $("#button-save-item").click(function(){
    title=$("#itemTitle").val();
    tags=$("#itemTags").val();
    content=$("#itemContent").val();

    $.post("http://http://52.39.116.224:8080/addItem", {itemTitle: title, itemTags: tags, itemContent: content}, function(data){
      if(data==='done')
        {
          alert("login success");
        }
    });
  });
});
