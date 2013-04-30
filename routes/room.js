var Room = require('../models/room');
var Video = require('../models/video');
var request = require('request');


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
    // TODO: need queue.added_by
    .exec(function (err, docs) {
      if (err) return console.log('DB error', err);

      uid = req.user;
      req.facebook.api('/me', function(err, data){

        res.render('room_show', {curr_user: data, room: docs, title: docs.name});
      });
      
  });
};

exports.videoByIdAndRemoveOne = function(req, res) {
  Room.findOne({ _id : req.params.id }).exec(function(err, docs) {
    var newQueue = docs.queue
    newQueue.splice(0,1);
    Room.findOneAndUpdate({ _id : req.params.id }, { $set: { queue: newQueue }})
    .exec(function (err, docs1) {
      res.render('room_video', {id: req.query.v, startOffset: 0});
    });
  });
}

exports.video = function(req, res){
  // TODO: Starting new video vs. joining new room. This starts the new one.
  Room.findOne({ _id : req.params.id })
    .populate('queue', 'ytID', {}, { limit: 1 })
    .exec(function(err,docs){
      if (err) return console.log('DB error', err);
      if (docs.queue.length != 0){
        // If there is a video in the queue...
        if (!docs.timeVideoStarted){
          // ...and if it hasn't been started yet...
          // TODO: this whole logic breaks down after the first video has completed playing.
          Room.findOneAndUpdate({ _id : req.params.id }, { $set: { timeVideoStarted: Date.now() }})
            .populate('queue', 'ytID', {}, { limit: 1 })
            .exec(function (err, dogs) {
              // this DB query bothers me (it's basically the same as the initial one..., also "dogs" should be thrown away? '_')
              if (err) return console.log('DB error', err);
              if (dogs.queue.length != 0) {
                res.render('room_video', {id: dogs.queue[0].ytID, startOffset: 0});
              } else {
                res.send("No video playing here.");
              }
          });
        } else {
          // Offset is measured in seconds, Date.now() gives milliseconds
          var offset = 1 + (Date.now() - docs.timeVideoStarted) / 1000;
          res.render('room_video', {id: docs.queue[0].ytID, startOffset: offset});
        }
      } else {
        res.send("No video playing here.");
      }
  });
};

exports.queue = function(req, res){
  // GET endpoint to render the video queue
  Room.findOne({ _id : req.params.id })
    .populate('queue')
    // TODO: need queue.added_by
    .exec(function (err, docs) {
      if (err) return console.log('DB error', err);
      res.render('room_queue', {room: docs});
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

      console.log("NAME ", req.body.name);
      console.log("UID ", req.body.uid);

      var new_room = new Room({ name: req.body.name, users: [req.body.uid] });
      new_room.save(function (err) {
        if (err) return console.log("DB error", err);
        res.redirect('/rooms/room/'+new_room._id);
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