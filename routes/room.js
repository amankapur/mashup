var Room = require('../models/room');
var Video = require('../models/video');
var request = require('request');


exports.list = function(req, res){
  Room.find({}).populate('users').exec(function (err, docs) {
    if (err) return handleError(err);
    res.render('room_list', {rooms: docs, title: 'List of rooms'});
  });
};

exports.show = function(req, res){
  Room.findOne({ _id : req.params.id })
    .populate('users')
    .populate('queue')
    .populate('queue.added_by', 'name')
    // TODO: need queue.added_by
    .exec(function (err, docs) {
    res.render('room_show', {room: docs, title: docs.name});
  });
};

exports.video = function(req, res){
  Room.findOne({ _id : req.params.id })
    .populate('queue', 'ytID', {}, { limit: 1 })
    .exec(function (err, docs) {
      res.render('room_video', {id: docs.queue[0].ytID});
  });
};

exports.new = function(req, res){
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
  Room.findOne({ name : req.body.name }).exec(function (err, docs) {
    if (err) return console.log('error', err);
    if (docs) {
      // TODO: room with that name already exists.
    } else {
      var new_room = new Room({ name: req.body.name, users: [req.body.uid] });
      new_room.save(function (err) {
        if (err) return console.log("error", err);
        res.redirect('/rooms/room/'+new_room._id);
      });
    }
  });
};

exports.enqueue = function(req, res){
  var user = req.session.user;
  Room.findOne({ _id: req.body.roomid }).exec(function(err, docs){
    if (err) return console.log('error');
    request({url:'http://gdata.youtube.com/feeds/api/videos/'+req.body.video+'?v=2&alt=json', json:true}, function (error, response, data) {
      if (!error && response.statusCode == 200) {
        var title = data.entry.title.$t;
        var ytID = data.entry.media$group.yt$videoid.$t;
        var thumbnail = data.entry.media$group.media$thumbnail[0].url;

        var new_QueueItem = new Video({ ytID: ytID, title: title, thumbnail: thumbnail, added_by: user._id });
        new_QueueItem.save(function(err) {
          var updatedQueue = docs.queue;
          updatedQueue.push(new_QueueItem);
          Room.update({ _id: req.body.roomid }, { $set: { queue: updatedQueue }}).exec();
          res.redirect('/rooms/room/'+req.body.roomid);
        });
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
    res.send(docs);
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