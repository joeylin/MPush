var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var TopicSchema = new Schema({
  title: { type: String },
  content: { type: String },
  intro: { type: String },    // 生成记录的简介
  author_id: { type: ObjectId },
  isPublic: { type: Boolean, default: true },   // 是否公开记录 
  isForward: { type: Boolean, default: false }, // 是否转载其他人的
  source_id: { type: ObjectId },
  top: { type: Boolean, default: false },
  like_count: { type: Number, default: 0 },     // 统计赞次数的计数器
  reply_count: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  collect_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  last_reply: { type: ObjectId },
  last_reply_at: { type: Date, default: Date.now },
  content_is_html: { type: Boolean }
});

TopicSchema.index({create_at: -1});
TopicSchema.index({top: -1, last_reply_at: -1});
TopicSchema.index({last_reply_at: -1});
TopicSchema.index({author_id: 1, create_at: -1});

mongoose.model('Topic', TopicSchema);
