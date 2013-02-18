var mongoose = require('mongoose');

var schema = mongoose.Schema({
  fbid: Number,
  name: String,
  photo: String
});
var User = mongoose.model('User', schema);

module.exports = User;