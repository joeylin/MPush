var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var GroupSchema = new Schema({
  name: { type: String },
  tags: [String],
  avatar: { type: String },
  follow_count: { type: Number, default: 0 },
  des: { type: String },
  create_at: { type: Date, default: Date.now }
});

mongoose.model('Group', GroupSchema);
