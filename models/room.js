var mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: String,
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  queue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
});
var Room = mongoose.model('Room', schema);

module.exports = Room;