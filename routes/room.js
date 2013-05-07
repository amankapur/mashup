var Room = require('../models/room');
var Video = require('../models/video');
var User = require('../models/user');
var request = require('request');
var googleimages = require('google-images');

exports.search = function(req, res){
  query = req.body.query;
  Room.find({}).populate('users').exec(function(err, docs){
    if (err) return console.log('DB error', err);

    len = docs.length;
    filtered = []
    queries = query.split(' ');
    lenq = queries.length;

    for (i =0; i< lenq; i++){
      for(j=0; j<len; j++){
        if (docs[j].name !== undefined){
          if (docs[j].name.indexOf(queries[i]) > -1) {
            if (filtered.indexOf(docs[j]) == -1) {
              filtered.push(docs[j])
            }
          }
        }
      }
    }
    user = req.session.user;
    res.render('room_list', {rooms: filtered, title: 'List of rooms', loggedIn: user});
  });
}
exports.list = function(req, res){
  Room.find({}).populate('users').exec(function (err, docs) {
    if (err) return console.log('DB error', err);
    user = req.session.user;
    // console.log("USER ##############################", user);
    console.log('ROOM LIST RENDERED')
    res.render('room_list', {rooms: docs, title: 'List of rooms', loggedIn : user});
  });
};

exports.show = function(req, res){
  
  Room.findOne({ _id : req.params.id })
    .populate('queue')
    .populate('users')
    .exec(function (err, docs) {
      if (err) return console.log('DB error', err);

      uid = req.user;
      req.facebook.api('/me', function(err, data){

        res.render('room_show', {curr_user: data, room: docs, title: docs.name});
      });
      
  });
};

exports.dequeueVideoAndRenderById = function(req, res) {
  Room.findOne({ _id : req.params.id })
  .populate('queue', 'ytID')
  .exec(function (err, docs) {
    var queue = docs.queue;
    console.log("Old queue: "+ docs.queue);
    if (queue[0].ytID == req.query.v) {
      // This is the first user who wants the id video.
      var newNowPlaying = { _id: queue[0]._id }; //dequeue the next video (with id req.query.v)
      var newQueue = [];
      for (var i = 1; i<queue.length; i++) {
        newQueue[i-1] = { _id: queue[i]._id}; // "un-populate" the queue
      }
      console.log("New queue: "+ newQueue);
      Room.findOneAndUpdate({ _id : req.params.id }, { $set: { queue: newQueue, timeVideoStarted: Date.now(), nowPlaying: newNowPlaying._id }})
      .exec(function (err, docs1) {
        console.log(docs1.queue)
        res.render('room_video', {id: req.query.v, startOffset: 0});
      });
    } else {
      // this client was later to the party.
      var offset = 1 + (Date.now() - docs.timeVideoStarted) / 1000;
      res.render('room_video', {id: req.query.v, startOffset: offset});
    }
  });
}

//this is called when a room is loaded.
exports.video = function(req,res) {
  Room.findOne({ _id : req.params.id })
  .populate('nowPlaying', 'ytID')
  .populate('queue', 'ytID')
  .exec(function (err,docs){
    if (!docs.nowPlaying) {
      //we just loaded a room page with no video playing.
      if (docs.queue.length != 0) {
        //there is stuff in the queue, though, for some reason
        //so do a similar thing to dequeueVideoAndRenderById, without the byId tho
        var newNowPlaying = { _id: docs.queue[0]._id }; //dequeue the next video (with id req.query.v)
        var v = docs.queue[0].ytID;
        var newQueue = [];
        for (var i = 1; i<docs.queue.length; i++) {
          newQueue[i-1] = { _id: docs.queue[i]._id}; // "un-populate" the queue
        }
        console.log(newQueue)
        Room.findOneAndUpdate({ _id : req.params.id }, { queue: newQueue, timeVideoStarted: Date.now(), nowPlaying: newNowPlaying._id })
        .exec(function (err, docs1) {
          //the video v is still present in the queue on the client.
          //but in theory, this is never used.
          res.render('room_video', {id: v, startOffset: 0});
        });
      } else {
        //nothing playing in the room, and nothing in the queue
        //TODO: come up with a video to play anyway based on room name.
        //Actually, I don't know if I want it to work that way.
        res.send("No video playing here. Add something to the queue!");
      }
    } else {
      //there is a video now playing in the room that we loaded.
      var offset = 1 + (Date.now() - docs.timeVideoStarted) / 1000;
      res.render('room_video', {id: docs.nowPlaying.ytID, startOffset: offset});
    }
  });
}

exports.queue = function(req, res){
  // GET endpoint to render the video queue
  Room.findOne({ _id : req.params.id })
    .populate('queue')
    .exec(function (err, docs) {
      if (err) return console.log('DB error', err);
      // Nested populate of Room.queue.added_by.photo and name
      var opts = { path: 'queue.added_by', select: 'photo name' };
      User.populate(docs, opts, function (err1, docs1) {
        if (err1) return console.log('DB error', err1);
        res.render('room_queue', {room: docs1});
      });
  });
};

exports.new = function(req, res){
  // GET endpoint for making a new room
  if (req.session.user) {
    user = req.session.user;
    res.render('room_new', {
      title: 'New room',
      loggedIn : user
    });
  } else {
    res.redirect('/login');
  }
};

exports.create = function(req, res){
  // POST endpoint for making a new room
  Room.findOne({ name : req.body.name }).exec(function (err, docs) {
    if (err) return console.log('DB error', err);
    if (docs) {
      // TODO: room with that name already exists.
    } else {

      var name = req.body.name;
      console.log("NAME ", req.body.name);
      console.log("UID ", req.body.uid);

      googleimages.search(name, function(err, images){
        url = images[0].url;

        var new_room = new Room({ name: req.body.name, users: [req.body.uid], imgurl: url});
        new_room.save(function (err) {
          if (err) return console.log("DB error", err);
          res.redirect('/rooms/room/'+new_room._id);
        });
      });

    }
  });
};

exports.enqueue = function(req, res){
  // POST endpoint for adding a video to a room's queue
  var user = req.session.user;

  console.log(req.body.roomid);
  Room.findOne({ _id: req.body.roomid }).exec(function(err, docs){
    if (err) return console.log('DB error');
    console.log(docs);
    // use request module to get information about the requested video
    request({url:'http://gdata.youtube.com/feeds/api/videos/'+req.body.video+'?v=2&alt=json', json:true}, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        var title = data.entry.title.$t;
        var ytID = data.entry.media$group.yt$videoid.$t;
        var thumbnail = data.entry.media$group.media$thumbnail[0].url;
        var length = data.entry.media$group.yt$duration.seconds;

        var new_QueueItem = new Video({ ytID: ytID, title: title, thumbnail: thumbnail, added_by: user._id, length: length });
        new_QueueItem.save(function(err) {
          if (err) return console.log("DB error", err);
          var updatedQueue = docs.queue;
          // a room's queue is an array of video objects.
          updatedQueue.push(new_QueueItem);
          Room.update({ _id: req.body.roomid }, { $set: { queue: updatedQueue }}).exec();
          res.redirect('/rooms/room/'+req.body.roomid);
        });
      } else {
        return console.log('YouTube request error');
      }
    });
  });
};

exports.delete_all = function(req, res){
  Room.remove({}, function(err) { 
    console.log('collection removed') 
  });
  res.send("deleted");
};

exports.show_all = function(req, res){
  Room.find({}, function(err, docs) { 
    res.render('all_rooms', {rooms: docs});
  });
};

exports.getTest = function(req, res){
  request({url:'http://gdata.youtube.com/feeds/api/videos/Dz50U_AYv3k?v=2&alt=json', json:true}, function (error, response, data) {
    if (!error && response.statusCode == 200) {
      var title = data.entry.title.$t;
      var ytID = data.entry.media$group.yt$videoid.$t;
      var thumbnail = data.entry.media$group.media$thumbnail[0].url;
      res.send(data.entry);
    }
  });
};