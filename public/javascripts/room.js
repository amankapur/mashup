 /******************/

function getFrameID(id){
    var elem = document.getElementById(id);
    if (elem) {
        if(/^iframe$/i.test(elem.tagName)) return id; //Frame, OK
        // else: Look for frame
        var elems = elem.getElementsByTagName("iframe");
        if (!elems.length) return null; //No iframe found, FAILURE
        for (var i=0; i<elems.length; i++) {
           if (/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com(\/|$)/i.test(elems[i].src)) break;
        }
        elem = elems[i]; //The only, or the best iFrame
        if (elem.id) return elem.id; //Existing ID, return it
        // else: Create a new ID
        do { //Keep postfixing `-frame` until the ID is unique
            id += "-frame";
        } while (document.getElementById(id));
        elem.id = id;
        return id;
    }
    // If no element, return null.
    return null;
}

// Define YT_ready function.
var YT_ready = (function() {
    var onReady_funcs = [], api_isReady = false;
    /* @param func function     Function to execute on ready
     * @param func Boolean      If true, all qeued functions are executed
     * @param b_before Boolean  If true, the func will added to the first
                                 position in the queue*/
    return function(func, b_before) {
        if (func === true) {
            api_isReady = true;
            while (onReady_funcs.length) {
                // Removes the first func from the array, and execute func
                onReady_funcs.shift()();
            }
        } else if (typeof func == "function") {
            if (api_isReady) func();
            else onReady_funcs[b_before?"unshift":"push"](func); 
        }
    }
})();
// This function will be called when the API is fully loaded
function onYouTubePlayerAPIReady() {YT_ready(true)}

// Load YouTube Frame API
(function() { // Closure, to not leak to the scope
  var s = document.createElement("script");
  s.src = (location.protocol == 'https:' ? 'https' : 'http') + "://www.youtube.com/player_api";
  var before = document.getElementsByTagName("script")[0];
  before.parentNode.insertBefore(s, before);
})();
var player; //Define a player object, to enable later function calls, without
            // having to create a new class instance again.

// Add function to execute when the API is ready
YT_ready(function(){
    var frameID = getFrameID("ytplayer");
    if (frameID) { //If the frame exists
        player = new YT.Player(frameID, {
            events: {
                "onStateChange": stateChange
            }
        });
    }
});

// bound to onStateChange
function stateChange(event) {
  console.log(event.data);
  switch (event.data) {
  case 2: //paused
    player.playVideo()
    break;
  case 0: //end of video
    nextVideo();
    break;
  }
}

function nextVideo() {
  if ($("div#queueView span").length < 1) {
    return
  }
  var nextYtid = $("div#queueView span:first-child img:first-child").attr("id");
  console.log(nextYtid);
  $.get(window.location.pathname+'/videoById?v=' + nextYtid, function(data) {
    $('#ytplayer').html(data);
    var frameID = getFrameID("ytplayer");
        if (frameID) { //If the frame exists
            player = new YT.Player(frameID, {
                events: {
                    "onStateChange": stateChange
                }
            });
        }
    $("div#queueView span:first-child").remove();
  });
}




$(function () {

  
  window.pathArray = document.URL.split( '/' );
  host = pathArray[0] + '//' + pathArray[2]
  console.log(host);
  var socket = io.connect(host);
  
  socket.on('updatequeue', function (data) {
    console.log('updatequeue');
    console.log('data', data.room_id);
    console.log('get', getRoomID());
    if (data.room_id == getRoomID()){
      getQueue();
      
    }
  });

  socket.on('chatupdate', function(data){
    console.log('chat BROADCAST RECEIVED');

    if (data.room_id == getRoomID()){
      $("#chatarea").append("<p> <b>" + data.from + ": </b>" +  data.message + "</p>");
    }
  });

  /* I don't think we need this one.
  socket.on('nextvideo', function (data) {
    console.log('nextvideo message received');
    console.log('data', data.room_id);
    console.log('get', getRoomID());
    if (data.room_id == getRoomID()){
      nextVideo();
    }
  });
  */


  $("#chat_submit").on('click', function(){
    sendChat();
  });

  $("#chat_message").keypress(function(e){
    if(e.which == 13){
      sendChat();
    }
  });

  $("#ytsubmit").on('click', function(){
    // ytsearch();
    $.post('/getytvids', {'query': $("#ytsearch").val()}, function(data){
      $("#ytlist").html(data);
    });
  });

  $("#ytsearch").keypress(function(e){
    if(e.which == 13){
      $.post('/getytvids', {'query': $("#ytsearch").val()}, function(data){
        $("#ytlist").html(data);
      });
    }
  });

  $("body").on('click', '.addtoq', function(){
    id = $(this).attr('id');

    room_id = getRoomID();

    $.post("/rooms/enqueue", {'video': id, 'roomid': room_id}, function(data){
      socket.emit('updatequeue', {'room_id': room_id});
      var queueLength = $("div#queueView span").length;
      if ($("#ytplayer").text() == "No video playing here. Add something to the queue!" || queueLength < 1 ) {
        console.log(id);
        $.get(window.location.pathname+'/videoById?v=' + id, function(data) {
          $('#ytplayer').html(data);
          var frameID = getFrameID("ytplayer");
            if (frameID) { //If the frame exists
              player = new YT.Player(frameID, {
                events: {
                  "onStateChange": stateChange
                }
              });
            }
          if ($("div#queueView span:first-child img:first-child").attr("id") == id) {
            $("div#queueView span:first-child").remove();
          }
        });
      }
    });
  });

  var topQueue = function(){
    topnode = $("#queueView").find('img')[0];
    topid = "";
    if (topnode !== undefined){
      topid = topnode.id;
    }

    return topid;

  }
  var sendChat = function(){
    message = $("#chat_message").val();
    curr_user = $(".username").attr('id');
    socket.emit('chatupdate', { 'from' : curr_user, 'message': message, 'room_id': getRoomID()});
    $("#chat_message").val('');
  }

  var getRoomID = function(){
    url = document.URL;
    a = url.split('/');
    last = a[a.length-1].split('#');
    room_id = last[0];
    return room_id;
  }
  var getQueue = function(){
    // Make a GET request for the queue view and 
    $.get(window.location.pathname+'/queue', function(data) {
      console.log(data);
      $('#queueView').html(data);
    });
  };

  var getVideo = function(){
    $.get(window.location.pathname+'/video', function(data) {
      $('#videoView').html(data);
    });
  };

  var ytSearch = function(){
    query = $("#ytsearch").val();
    console.log(query);

    $.post('/getytvids', {'query': query}, function(data){
      $("#ytlist").html(data);
    });

  }

  getQueue();

  //SETUP video for the first time
  // just like nextVideo() but that doesn't work.

  $.get(window.location.pathname+'/video', function(data) {
      $('#ytplayer').html(data);
      YT_ready(function(){
        var frameID = getFrameID("ytplayer");
        if (frameID) { //If the frame exists
          player = new YT.Player(frameID, {
            events: {
              "onStateChange": stateChange
            }
          });
        }
      });
    });

});
