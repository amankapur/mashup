
exports.login = function(req, res) {
	res.render('loginpage', {title: 'Turntube'});
}

exports.done = function(req, res){
  console.log("USER LOGGED IN BITCHES!!!!");
  console.log(req.body.userdata);
  req.session.user = req.body.userdata;
  res.redirect('/');
}