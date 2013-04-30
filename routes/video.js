var Video = require('../models/video');

exports.video = function(req, res) {
  res.render('room_video', {id: req.params.ytid, startOffset: 0});
}

exports.delete_all = function(req, res){
  Video.remove({}, function(err) { 
    console.log('collection removed') 
  });
  res.send("deleted");
};

exports.show_all = function(req, res){
  Video.find({}, function(err, docs) { 
    res.send(docs);
  });
};