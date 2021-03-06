var sanitize = require('validator').sanitize;

var at = require('../services/at');
var message = require('../services/message');

var EventProxy = require('eventproxy');
var Util = require('../libs/util');

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Reply = require('../proxy').Reply;

/**
 * 添加一级回复
 */
exports.add = function (req, res, next) {
  var content = req.body.r_content;
  var topic_id = req.params.topic_id;

  var str = sanitize(content).trim();
  if (str === '') {
    res.render('notify/notify', {error: '回复内容不能为空！'});
    return;
  }

  var ep = EventProxy.create();
  ep.fail(next);

  Topic.getTopic(topic_id, ep.doneLater(function (topic) {
    if (!topic) {
      ep.unbind();
      // just 404 page
      return next();
    }
    ep.emit('topic', topic);
  }));

  ep.on('topic', function (topic) {
    Reply.newAndSave(content, topic_id, req.session.user._id, ep.done(function (reply) {
      Topic.updateLastReply(topic_id, reply._id, ep.done(function () {
        ep.emit('reply_saved', reply);
        //发送at消息
        at.sendMessageToMentionUsers(content, topic_id, req.session.user._id, reply._id);
      }));
    }));

    User.getUserById(req.session.user._id, ep.done(function (user) {
      user.score += 5;
      user.reply_count += 1;
      user.save();
      req.session.user = user;
      ep.emit('score_saved');
    }));
  });

  ep.all('reply_saved', 'topic', function (reply, topic) {
    if (topic.author_id.toString() !== req.session.user._id.toString()) {
      message.sendReplyMessage(topic.author_id, req.session.user._id, topic._id, reply._id);
    }
    ep.emit('message_saved');
  });

  ep.all('reply_saved', 'message_saved', 'score_saved', function (reply) {
    res.redirect('/topic/' + topic_id + '#' + reply._id);
  });
};

exports.ajax_add = function(req, res, next) {
  var content = req.body.r_content;
  var topic_id = req.params.topic_id;

  var str = sanitize(content).trim();
  if (str === '') {
    return res.send({
      code: 404,
      info: '内容不能为空'
    });
  }

  var ep = EventProxy.create();
  ep.fail(next);

  Topic.getTopic(topic_id, ep.doneLater(function (topic) {
    if (!topic) {
      ep.unbind();
      // just 404 page
      return res.send({
        code: 404,
        info: '没有找到主题'
      });
    }
    ep.emit('topic', topic);
  }));

  ep.on('topic', function (topic) {
    Reply.newAndSave(content, topic_id, req.session.user._id, ep.done(function (reply) {
      Topic.updateLastReply(topic_id, reply._id, ep.done(function () {
        ep.emit('reply_saved', reply);
        //发送at消息
        at.sendMessageToMentionUsers(content, topic_id, req.session.user._id, reply._id);
      }));
    }));

    User.getUserById(req.session.user._id, ep.done(function (user) {
      user.score += 5;
      user.reply_count += 1;
      user.save();
      req.session.user = user;
      ep.emit('score_saved');
    }));
  });

  ep.all('reply_saved', 'topic', function (reply, topic) {
    if (topic.author_id.toString() !== req.session.user._id.toString()) {
      message.sendReplyMessage(topic.author_id, req.session.user._id, topic._id, reply._id);
    }
    ep.emit('message_saved');
  });

  ep.all('reply_saved', 'message_saved', 'score_saved', function (reply) {
    res.send({
      code: 200,
      replyId: reply._id,
      content: reply.content,
      friendly_create_at: Util.format_date(reply.create_at, true)
    });
  });
};

/**
 * 添加二级回复
 */
exports.add_reply2 = function (req, res, next) {
  var topic_id = req.params.topic_id;
  var reply_id = req.body.reply_id;
  var content = req.body.r2_content;

  var str = sanitize(content).trim();
  if (str === '') {
    res.send({
      code: 404,
      info: '内容不能为空'
    });
    return;
  }

  var proxy = new EventProxy();
  proxy.assign('reply_saved', function (reply) {
    Reply.getReplyById(reply._id, function (err, reply) {
      res.redirect('/topic/' + topic_id + '#' + reply._id);
      // res.partial('reply/reply2', {object: reply, as: 'reply'});
    });
  });

  // 创建一条回复，并保存
  Reply.newAndSave(content, topic_id, req.session.user._id, reply_id, function (err, reply) {
    if (err) {
      return next(err);
    }
    // 更新主题的最后回复信息
    Topic.updateLastReply(topic_id, reply._id, function (err) {
      if (err) {
        return next(err);
      }
      proxy.emit('reply_saved', reply);
      //发送at消息
      at.sendMessageToMentionUsers(content, topic_id, req.session.user._id, reply._id);
    });
  });
};

exports.ajax_add_reply2 = function(req, res, next) {
  var topic_id = req.params.topic_id;
  var reply_id = req.body.reply_id;
  var content = req.body.r2_content;

  var str = sanitize(content).trim();
  if (str === '') {
    res.send({
      code: 404,
      info: '内容不能为空'
    });
    return;
  }

  var proxy = new EventProxy();
  proxy.assign('reply_saved', function (reply) {
    Reply.getReplyById(reply._id, function (err, reply) {
      console.log(err, reply);
      res.send({
        code: 200,
        replyId: reply._id,
        content: reply.content,
        friendly_create_at: Util.format_date(reply.create_at, true)
      });
    });
  });

  // 创建一条回复，并保存
  Reply.newAndSave(content, topic_id, req.session.user._id, reply_id, function (err, reply) {
    if (err) {
      return next(err);
    }
    // 更新主题的最后回复信息
    Topic.updateLastReply(topic_id, reply._id, function (err) {
      if (err) {
        return next(err);
      }
      proxy.emit('reply_saved', reply);
      //发送at消息
      at.sendMessageToMentionUsers(content, topic_id, req.session.user._id, reply._id);
    });
  });
};

/**
 * 删除回复信息
 */
exports.delete = function (req, res, next) {
  var reply_id = req.body.reply_id;
  Reply.getReplyById(reply_id, function (err, reply) {
    if (err) {
      return next(err);
    }

    if (!reply) {
      res.json({status: 'failed'});
      return;
    }
    if (reply.author_id.toString() === req.session.user._id.toString()) {
      reply.remove();
      res.json({status: 'success'});

      if (!reply.reply_id) {
        reply.author.score -= 5;
        reply.author.reply_count -= 1;
        reply.author.save();
      }
    } else {
      res.json({status: 'failed'});
      return;
    }

    Topic.reduceCount(reply.topic_id, function () {
    });
  });
};
/*
 打开回复编辑器
 */
exports.showEdit = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  var reply_id = req.params.reply_id;
  if (reply_id.length !== 24) {
    res.render('notify/notify', {error: '此话题不存在或已被删除。'});
    return;
  }
  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      res.render('notify/notify', {error: '此回复不存在或已被删除。'});
      return;
    }
    if (String(reply.author_id) === req.session.user._id || req.session.user.is_admin) {
      res.render('reply/edit', {
        reply_id: reply._id,
        content: reply.content
      });
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此回复。'});
    }
  });
};
/*
 提交编辑回复
 */
exports.update = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }
  var reply_id = req.params.reply_id;
  if (reply_id.length !== 24) {
    res.render('notify/notify', {error: '此回复不存在或已被删除。'});
    return;
  }

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      res.render('notify/notify', {error: '此回复不存在或已被删除。'});
      return;
    }

    if (String(reply.author_id) === req.session.user._id || req.session.user.is_admin) {
      var content = req.body.t_content;

      reply.content = content.trim();
      if (content.length > 0) {
        reply.save(function (err) {
          if (err) {
            return next(err);
          }
          res.redirect('/topic/' + reply.topic_id + '/#' + reply._id);
        });
      } else {
        res.render('notify/notify', {error: '回复的字数太少。'});
      }
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此回复。'});
    }
  });
};

/*
 异步加载主题的前六个回复
 */
exports.getPageTopicRepliesLimit = function (req, res, next) {
  var topic_id = req.query.topic_id;
  console.log(topic_id);
  Reply.getTpiocFlatRepliesLimit(topic_id, 6, function(err, replies, hasLeft) {
    if (err) {
      return res.send({
        code: 404,
      });
    }

    if (req.session.user) {
      var ep = new EventProxy();
      ep.after('up_ready', replies.length, function() {
        res.send({
          code: 200,
          replies: replies,
          hasLeft: hasLeft
        });
      });

      for (var j = 0; j < replies.length; j++) {
        (function (i) {
          replies[i].isUped = isUped(req.session.user, replies[i]);
          replies[i].like_count = replies[i].ups ? replies[i].ups.length : 0;
          ep.emit('up_ready', replies[i]);
        })(j);
      }
    } else {
      res.send({
        code: 200,
        replies: replies,
        hasLeft: hasLeft
      });
    }
    function isUped(user, reply) {
      if (!reply.ups) {
        return false;
      }
      var ups = [];
      reply.ups.map(function(up, key) {
        ups.push(up.toString());
      });
      return ups.indexOf(user._id) !== -1;
    }
      
  });
};

/*
 异步加载主题的所有回复
 */
exports.getPageTopicReplies = function(req, res, next) {
  var topic_id = req.query.topic_id;
  Reply.getTpiocFlatReplies(topic_id, function(err, replies) {
    if (err) {
      return res.send({
        code: 404
      });
    }
    if (req.session.user) {
      var ep = new EventProxy();
      ep.after('up_ready', replies.length, function() {
        res.send({
          code: 200,
          replies: replies
        });
      });

      for (var j = 0; j < replies.length; j++) {
        (function (i) {
          replies[i].isUped = isUped(req.session.user, replies[i]);
          ep.emit('up_ready', replies[i]);
        })(j);
      }
    } else {
      res.send({
        code: 200,
        replies: replies
      });
    }
    function isUped(user, reply) {
      if (!reply.ups) {
        return false;
      }
      var ups = [];
      reply.ups.map(function(up, key) {
        ups.push(up.toString());
      });
      return ups.indexOf(user._id) !== -1;
    }
  });
};

/*
 回复点赞功能
 */
exports.up = function (req, res, next) {
  var replyId = req.params.reply_id;
  var userId = req.session.user._id;
  Reply.getReplyById(replyId, function (err, reply) {
    if (err) {
      return next(err);
    }
    var success = false;
    reply.ups = reply.ups || [];
    if (reply.ups.indexOf(userId) === -1) {
      reply.ups.push(userId);
      success = true;
    }
    reply.save(function () {
      res.send({
        success: success
      });
    });
  });
};


