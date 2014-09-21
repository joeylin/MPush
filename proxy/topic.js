var EventProxy = require('eventproxy');

var models = require('../models');
var Topic = models.Topic;
var UserModel = models.User;
var User = require('./user');
var Like = require('./like');
var Reply = require('./reply');
var Util = require('../libs/util');

/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - topic, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author'];
  proxy.assign(events, function (topic, author, last_reply) {
    return callback(null, topic, author, last_reply);
  }).fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('author', null);
      return;
    }
    if (topic.isForward) {
      Topic.findOne({_id: topic.source_id}, function(err, s_topic) {
        if (!s_topic) {
          proxy.emit('topic', null);
          proxy.emit('author', null); 
          return;
        }
        UserModel.findOne({_id: s_topic.author_id}, function(err, user) {
          if (!user) {
            proxy.emit('topic', null);
            proxy.emit('author', null);    
            return;
          }
          s_topic.source_user = user;
          s_topic.author_id = topic.author_id;
          s_topic.isForward = true;
          s_topic.real_id = topic._id;
          s_topic.create_at = topic.create_at;
          proxy.emit('topic', s_topic);
        });
      });
    } else {
      proxy.emit('topic', topic);
    }
    
    User.getUserById(topic.author_id, proxy.done('author'));
  }));
};

/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
  Topic.count(query, callback);
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getTopicsByQuery = function (query, opt, callback) {
  Topic.find(query, ['_id'], opt, function (err, docs) {
    if (err) {
      return callback(err);
    }
    if (docs.length === 0) {
      return callback(null, []);
    }

    var topics_id = [];
    for (var i = 0; i < docs.length; i++) {
      topics_id.push(docs[i]._id);
    }

    var proxy = new EventProxy();
    proxy.after('topic_ready', topics_id.length, function (topics) {
      // 过滤掉空值
      var filtered = topics.filter(function (item) {
        return !!item;
      });
      return callback(null, filtered);
    });
    proxy.fail(callback);

    topics_id.forEach(function (id, i) {
      exports.getTopicById(id, proxy.group('topic_ready', function (topic, author) {
        // 当id查询出来之后，进一步查询列表时，文章可能已经被删除了
        // 所以这里有可能是null
        if (topic) {
          topic.author = author;
          topic.friendly_create_at = Util.format_date(topic.create_at, true);
          
          if (topic.content.length > 140) {
            topic.hasLeft = true;
            topic.intro = topic.content.slice(0, 140);
          } else {
            topic.intro = topic.content;
            topic.hasLeft = false;
          }

        }
        return topic;
      }));
    });
  });
};

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - topic, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullTopic = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'replies', 'like_count'];
  proxy
    .assign(events, function (topic, author, replies, like_count) {
      callback(null, '', topic, author, replies, like_count);
    })
    .fail(callback);

  Topic.findOne({_id: id}, proxy.done(function (topic) {
    if (!topic) {
      proxy.unbind();
      return callback(null, '此话题不存在或已被删除。');
    }
    if (topic.isForward) {
      Topic.findOne({_id: topic.source_id}, function(err, s_topic) {
        topic.source = s_topic;
        User.findOne({_id: topic.source.author_id}, function(err, user) {
          topic.source.author = user;
          proxy.emit('topic', topic);
        });
      });
    } else {
      proxy.emit('topic', topic);
    }
    

    User.getUserById(topic.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));

    Reply.getTpiocFlatReplies(topic._id, proxy.done('replies'));
    Like.getLikesByTopic(topic._id, proxy.done('like_count'));
  }));
};

/**
 * 更新主题的最后回复信息
 * @param {String} topicId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (topicId, replyId, callback) {
  Topic.findOne({_id: topicId}, function (err, topic) {
    if (err || !topic) {
      return callback(err);
    }
    topic.last_reply = replyId;
    topic.last_reply_at = new Date();
    topic.reply_count += 1;
    topic.save(callback);
  });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopic = function (id, callback) {
  Topic.findOne({_id: id}, callback);
};

/**
 * 将当前主题的回复计数减1，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
  Topic.findOne({_id: id}, function (err, topic) {
    if (err) {
      return callback(err);
    }

    if (!topic) {
      return callback(new Error('该主题不存在'));
    }

    topic.reply_count -= 1;
    topic.save(callback);
  });
};

/**
 * 将当前主题的被赞计数减1，取消赞时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceLike = function (id, callback) {
  Topic.findOne({_id: id}, function (err, topic) {
    if (err) {
      return callback(err);
    }

    if (!topic) {
      return callback(new Error('该主题不存在'));
    }

    topic.like_count -= 1;
    topic.save(callback);
  });
};

exports.newAndSave = function (title, tags, isPublic, content, authorId, callback) {
  var topic = new Topic();
  topic.title = title;
  topic.content = content;
  topic.tags = tags;
  topic.isPublic = isPublic;
  topic.author_id = authorId;
  topic.save(callback);
};

exports.forward = function(user_id, topic_id, callback) {
  Topic.findOne({_id: topic_id}, function(err, topic) {
    if (err) {
      callback(err, topic);
    }
    if (!topic) {
      callback('发生错误', null);
    }
    var t = new Topic();
    t.author_id = user_id;
    t.isPublic = true;
    if (topic.isForward) {
      t.source_id = topic.source_id;
    } else {
      t.source_id = topic_id;
    }
    t.isForward = true;
    t.save(callback);
  });
      
};
