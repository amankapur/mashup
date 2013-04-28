$(function () {

  
  var socket = io.connect('http://localhost:3000');
  
  socket.on('updatequeue', function (data) {
    // console.log('updatequeue');
    // console.log('data', data.room_id);
    // console.log('get', getRoomID());
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


  $("#chat_submit").on('click', function(){
    sendChat();
  });

  $("#chat_message").keypress(function(e){
    if(e.which == 13){
      sendChat();
    }
  });

  $("#ytsubmit").on('click', function(){
    ytSearch();
  });

  $("#ytsearch").keypress(function(e){
    if(e.which == 13){
      ytSearch();
    }
  }); 

  $("body").on('click', '.addtoq', function(){
    id = $(this).attr('id');

    room_id = getRoomID();
    
    $.post("/rooms/enqueue", {'video': id, 'roomid': room_id}, function(data){
      socket.emit('updatequeue', {'room_id': room_id});
      // getQueue();
    });
  });

  var ytSearch = function(){
    query = $("#ytsearch").val();
    console.log(query);

    $.post('/getytvids', {'query': query}, function(data){
      $("#ytlist").html(data);
    });

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
      // console.log(data);
      $('#queueView').html(data);
    });
  };

  var getVideo = function(){
    $.get(window.location.pathname+'/video', function(data) {
      $('#videoView').html(data);
    });
  };

  //**********************
  // needed to handle youtube state transitions, taken from stack overflow
  //**********************
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

  // ****************

  getQueue();
  getVideo();

  $('#enqueueForm').on('submit', function () {
    // TODO: video submission form needs some serious validation - right now it only works if you paste in the ytID
    $.post("/rooms/enqueue", $('#enqueueForm').serialize());
    
    // ajax-ly put the new video into the queue on the page. maybe a transition would be cool.
    getQueue();
    return false;
  });

  YT_ready(function(){
    var frameID = getFrameID("ytplayer");
    if (frameID) { //If the frame exists
        player = new YT.Player(frameID, {
            events: {
                // this is where we define what happens when the video changes state (i.e. is done playing)
                "onStateChange": stopCycle
            }
        });
    }
});
})