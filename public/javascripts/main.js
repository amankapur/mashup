$(function () {


  window.pathArray = document.URL.split( '/' );
  host = pathArray[0] + '//' + pathArray[2]
  console.log(host);
  var socket = io.connect(host);
  
  // console.log(socket);
  socket.on('roomcreate', function (data) {

    console.log('ROOM CREATE RECEIVED');
    if (typeof(data.url) !== "undefined")
    {
      redirect(data.url);
    }
    else {
    	getRooms();
    }
  });


  var getRooms = function(){
  	$.get('/rooms/show_all', function(data){
  		console.log(data);
  		$("#roomlist").html(data);
  		
  	});
  }

  $("body").on('click', '#newRoomForm', function(e){
    event.preventDefault();

    data_name = $("#nameinput").val();
    data_uid = $("#uid").val();
    $.post('/rooms/create', {name: data_name, uid: data_uid}, function(data){
      if (data.indexOf('div') > -1){
        $("#createform").prepend(data);
      }
      if (data.indexOf('/room') > -1){
        socket.emit('roomcreate', {url: host + data});
        
        // redirect(host + data);
      }
    
  });

});

});

function redirect(url){
  window.location = url;
}