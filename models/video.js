var mongoose = require('mongoose');

var schema = mongoose.Schema({
  ytID: String,
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  thumbnail: String,
  length: Number
});
var Video = mongoose.model('Video', schema);

module.exports = Video;