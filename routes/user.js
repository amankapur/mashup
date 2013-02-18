var User = require('../models/user');

exports.list = function(req, res){
  var query = User.find({});
  query.exec(function (err, docs) {
    if (err)
      return console.log("error", err);
    res.render('user_list', {users: docs, title: 'List of users'});
  });
};

exports.delete_all = function(req, res){
  User.remove({}, function(err) { 
    console.log('collection removed') 
  });
  res.send("deleted");
};