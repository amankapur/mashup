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
  	});
  }

  $("body").on('click', '#newRoomForm', function(){
      
    data_name = $("#nameinput").val();
    data_uid = $("#uid").val();
    $.post('/rooms/create', {name: data_name, uid: data_uid}, function(data){
      if (data.indexOf('div') > -1){
        $("#createform").prepend(data);
      }
      if (data.indexOf('/room') > -1){
        window.location = host + data;
      }
    }); 
    socket.emit('roomcreate', {});
});

});