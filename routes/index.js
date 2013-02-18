var User = require('../models/user');

exports.index = function(req, res){
  if (req.session.user){
    res.redirect('/rooms/list');
  } else {
    req.facebook.api('/me', function(err, data){
      var fbid = data.id;
      var name = data.name;
      var photo = "https://graph.facebook.com/"+data.id+"/picture?type=square"
      User.findOne({ fbid : fbid }).exec(function (err, docs) {
        if (err) return console.log('error', err);
        if (docs) {
          req.session.user = docs;
          res.redirect('/rooms/list');
        } else {
          var new_user = new User({ fbid: fbid, name:name, photo:photo });
          new_user.save(function (err) {
            if (err) return console.log("error", err);
            req.session.user = new_user;
            console.log("new user saved");
            res.redirect('/rooms/list');
          });
        }
      });
    });
  }
};