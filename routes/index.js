var User = require('../models/user');

exports.index = function(req, res){
  // if (req.session.user){
  //   res.redirect('/rooms/list');
  // } else {
    // req.facebook.api('/me', function(err, data){
    //   if (err) return console.log('Facebook error', err);
      console.log(" SESSION ######", req.session.user);
      data = req.session.user;  // contains data from fb login call on the client side
      var fbid = data.id;
      var name = data.name;
      var photo = "https://graph.facebook.com/"+data.id+"/picture?type=square"
      User.findOne({ fbid : fbid }).exec(function (err, docs) {
        if (err) return console.log('DB error', err);
        if (docs) {
          // If this user is already in the database, just take us to the room list
          console.log('user already exists');
          req.session.user = docs;
          res.redirect('/rooms/list');
        } else {
          // Else create a new user and take us to the room list.
          // Maybe a weird place to do this (routes/index), but this is what /login redirects to so...
          var new_user = new User({ fbid: fbid, name:name, photo:photo });
          new_user.save(function (err) {
            if (err) return console.log("Saving error", err);
            req.session.user = new_user;

            console.log("new user saved");
            res.redirect('/rooms/list');
          });
        }
      });
  //   });
  // }
};

exports.about = function(req, res){
  res.render('about')
};