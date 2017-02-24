var loadedItem = null;


 function loadItem(item){
    //TODO: save old item if loadedItem is not null first.
    //loadedItem = itemlist[0];
    console.log(item);


    var textarea = document.getElementById('itemContent');
    textarea.value = item.filePointer;
 }
