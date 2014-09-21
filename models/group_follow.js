var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var GroupFollowSchema = new Schema({
  user_id: { type: ObjectId },
  group_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('GroupFollow', GroupFollowSchema);
