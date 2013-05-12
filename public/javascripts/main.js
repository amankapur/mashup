$(function () {


  window.pathArray = document.URL.split( '/' );
  host = pathArray[0] + '//' + pathArray[2]

  var socket = io.connect(host);
  
  socket.on('roomcreate', function (data) {

  	getRooms();
    
  });


  var getRooms = function(){
  	$.get('/rooms/show_all', function(data){
  		
  		$("#roomlist").html(data);
  		// console.log(data);
  	})
  }
  $("#newRoomForm").submit(function(){

    
  	socket.emit('roomcreate', {});

  });


});