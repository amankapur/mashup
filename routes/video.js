var Video = require('../models/video');

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