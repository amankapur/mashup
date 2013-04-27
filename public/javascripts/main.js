$(function () {

	var socket = io.connect('http://localhost:3000');
  
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