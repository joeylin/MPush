var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var GroupSchema = new Schema({
  name: { type: String },
  tags: [String],
  avatar: { type: String, default: 'http://valuenet.qiniudn.com/group-avatar.png' },
  follow_count: { type: Number, default: 0 },
  desc: { type: String },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('Group', GroupSchema);
