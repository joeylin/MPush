/*!
 * nodeclub - controllers/topic.js
 */

/**
 * Module dependencies.
 */

var sanitize = require('validator').sanitize;

var at = require('../services/at');
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Tag = require('../proxy').Tag;
var TopicTag = require('../proxy').TopicTag;
var TopicCollect = require('../proxy').TopicCollect;
var Relation = require('../proxy').Relation;
var Like = require('../proxy').Like;
var Group = require('../proxy').Group;
var GroupFollow = require('../proxy').GroupFollow;
var EventProxy = require('eventproxy');
var Util = require('../libs/util');

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  var group_id = req.params.gid;
  if (group_id.length !== 24) {
    return res.render('notify/notify', {
      error: '此分组不存在。'
    });
  }

  var events = ['group', 'follow', 'most_active_users'];
  var ep = EventProxy.create(events, function (group, follow, most_active_users) {
    res.render('group/index', {
      group: group,
      follow: follow,
      users: most_active_users
    });
  });

  ep.fail(next);

  Group.getGroupById(group_id, function(err, group) {
    if (err || !group) {
      ep.unbind();
      return res.render('notify/notify', { error: err.msg });
    }

    group.friendly_create_at = Util.format_date(group.create_at, true);

    if (!req.session.user) {
      ep.emit('group', group);
      ep.emit('follow', false);
    } else {
      GroupFollow.getGroupFollow(req.session.user._id, group._id, ep.done(function (doc) {
        if (doc) {
          group.isFollowed = true;
        } else {
          group.isFollowed = false;
        }
        ep.emit('group', group);
      }));
      ep.emit('follow', true);
    }

    // most_active_users
    // var options = { limit: 5, sort: [
    //   [ 'last_reply_at', 'desc' ]
    // ]};
    // var query = { author_id: topic.author_id, _id: { '$nin': [ topic._id ] } };
    // User.getTopicsByQuery(query, options, ep.done('most_active_users'));
    ep.emit('most_active_users', []);
  });
};

exports.create = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }
  res.render('group/edit', {avatar:'http://valuenet.qiniudn.com/group-avatar.png'});
};

exports.put = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  // 显示出错或成功信息
  function showMessage(msg, data, isSuccess) {
    var data = data || req.body;
    var data2 = {
      name: data.name,
      desc: data.desc,
      tags: data.tags,
      avatar: data.avatar || 'http://valuenet.qiniudn.com/group-avatar.png'
    };
    if (isSuccess) {
      data2.success = msg;
    } else {
      data2.error = msg;
    }
    res.render('group/edit', data2);
  }

  // post
  var name = sanitize(req.body.name).trim();
  name = sanitize(name).xss();
  var tags = sanitize(req.body.tags).trim();
  tags = sanitize(tags).xss();
  var desc = sanitize(req.body.desc).trim();
  desc = sanitize(desc).xss();

  if (!name) {
    showMessage('分组名没有填写');
  }
  if (!tags) {
    showMessage('标签不能为空');
  }
  if (!desc) {
    showMessage('请填写描述');
  }
  console.log(Group);
  Group.newAndSave(name, desc, tags, function (err, group) {
    if (err) {
      return next(err);
    }
    res.redirect('/group/' + group._id);
  });
};

exports.ajax_avatar = function(req, res, next) {
  if (!req.session.user) {
    res.send({
      code: 404,
      info: '还未登录'
    });
    return;
  }
  var url = req.body.avatar;
  var group_id = req.body.group_id;
  Group.getGroupById(group_id, function(err, group) {
    if (err) {
      return next(err);
    }
    group.avatar = url;
    group.save(function(err) {
      res.send({
        code: 200,
        avatar: group.avatar
      });
    });
  });
};

exports.showEdit = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }

  var group_id = req.params.gid;
  if (group_id.length !== 24) {
    res.render('notify/notify', {error: '此分组不存在或已被删除。'});
    return;
  }
  Group.getGroupById(group_id, function (err, group) {
    if (!group) {
      res.render('notify/notify', {error: '此分组不存在或已被删除。'});
      return;
    }
    if (!req.session.user.is_admin) {
      res.render('group/edit', {action: 'edit', group_id: group._id, name: group.name, desc: group.desc, tags: group.tags, avatar: group.avatar});
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此话题。'});
    }
  });
};

exports.update = function (req, res, next) {
  if (!req.session.user) {
    res.redirect('/');
    return;
  }
  var group_id = req.params.tid;
  if (group_id.length !== 24) {
    res.render('notify/notify', {error: '此话题不存在或已被删除。'});
    return;
  }

  Topic.getTopicById(group_id, function (err, topic, tags) {
    if (!topic) {
      res.render('notify/notify', {error: '此话题不存在或已被删除。'});
      return;
    }

    if (String(topic.author_id) === req.session.user._id || req.session.user.is_admin) {
      var title = sanitize(req.body.title).trim();
      title = sanitize(title).xss();
      var content = req.body.t_content;
      var isPublic = !!parseInt(req.body.isPublic);
      var topic_tags = [];
      if (req.body.topic_tags !== '') {
        topic_tags = req.body.topic_tags.split(',');
      }

      if (title === '' || topic_tags.length === 0) {
        Tag.getAllTags(function (err, all_tags) {
          if (err) {
            return next(err);
          }
          for (var i = 0; i < topic_tags.length; i++) {
            for (var j = 0; j < all_tags.length; j++) {
              if (topic_tags[i] === all_tags[j]._id) {
                all_tags[j].is_selected = true;
              }
            }
          }
          res.render('topic/edit', {action: 'edit', edit_error: '标题不能是空的。', group_id: topic._id, content: content, tags: topic.tags, isPublic: topic.isPublic});
        });
      } else {
        //保存话题
        //删除topic_tag，标签topic_count减1
        //保存新topic_tag
        topic.title = title;
        topic.content = content;
        topic.isPublic = isPublic;
        topic.tags = req.body.topic_tags;
        topic.update_at = new Date();
        topic.save(function (err) {
          if (err) {
            return next(err);
          }

          // 标签处理，暂时还没做。

          var proxy = new EventProxy();
          var render = function () {
            res.redirect('/topic/' + topic._id);
          };
          proxy.assign('tags_removed_done', 'tags_saved_done', render);
          proxy.fail(next);

          // 删除topic_tag
          var tags_removed_done = function () {
            proxy.emit('tags_removed_done');
          };
          TopicTag.getTopicTagByTopicId(topic._id, function (err, docs) {
            if (docs.length === 0) {
              proxy.emit('tags_removed_done');
            } else {
              proxy.after('tag_removed', docs.length, tags_removed_done);
              // delete topic tags
              docs.forEach(function (doc) {
                doc.remove(proxy.done(function () {
                  Tag.getTagById(doc.tag_id, proxy.done(function (tag) {
                    proxy.emit('tag_removed');
                    tag.topic_count -= 1;
                    tag.save();
                  }));
                }));
              });
            }
          });
          // 保存topic_tag
          var tags_saved_done = function () {
            proxy.emit('tags_saved_done');
          };
          // 话题可以没有标签
          if (topic_tags.length === 0) {
            proxy.emit('tags_saved_done');
          } else {
            proxy.after('tag_saved', topic_tags.length, tags_saved_done);
            //save topic tags
            topic_tags.forEach(function (tag) {
              TopicTag.newAndSave(topic._id, tag, proxy.done('tag_saved'));
              Tag.getTagById(tag, proxy.done(function (tag) {
                tag.topic_count += 1;
                tag.save();
              }));
            });
          }
          //发送at消息
          at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
        });
      }
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此话题。'});
    }
  });
};

exports.delete = function (req, res, next) {
  //删除话题, 话题作者topic_count减1
  //删除回复，回复作者reply_count减1
  //删除topic_tag，标签topic_count减1
  //删除topic_collect，用户collect_topic_count减1
  if (!req.session.user || !req.session.user.is_admin) {
    return res.send({success: false, message: '无权限'});
  }
  var group_id = req.params.tid;
  if (group_id.length !== 24) {
    return res.send({ success: false, error: '此话题不存在或已被删除。' });
  }
  Topic.getTopic(group_id, function (err, topic) {
    if (err) {
      return res.send({ success: false, message: err.message });
    }
    if (!topic) {
      return res.send({ success: false, message: '此话题不存在或已被删除。' });
    }
    topic.remove(function (err) {
      if (err) {
        return res.send({ success: false, message: err.message });
      }
      res.send({ success: true, message: '话题已被删除。' });
    });
  });
};

exports.follow = function (req, res, next) {
  var group_id = req.body.group_id;
  Topic.getTopic(group_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({status: 'failed'});
    }

    TopicCollect.getTopicCollect(req.session.user._id, topic._id, function (err, doc) {
      if (err) {
        return next(err);
      }
      if (doc) {
        res.json({status: 'success'});
        return;
      }

      TopicCollect.newAndSave(req.session.user._id, topic._id, function (err) {
        if (err) {
          return next(err);
        }
        res.json({status: 'success'});
      });
      User.getUserById(req.session.user._id, function (err, user) {
        if (err) {
          return next(err);
        }
        user.collect_topic_count += 1;
        user.save();
      });

      req.session.user.collect_topic_count += 1;
      topic.collect_count += 1;
      topic.save();
    });
  });
};

exports.unfollow = function (req, res, next) {
  var group_id = req.body.group_id;
  Topic.getTopic(group_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.json({status: 'failed'});
    }
    TopicCollect.remove(req.session.user._id, topic._id, function (err) {
      if (err) {
        return next(err);
      }
      res.json({status: 'success'});
    });

    User.getUserById(req.session.user._id, function (err, user) {
      if (err) {
        return next(err);
      }
      user.collect_topic_count -= 1;
      user.save();
    });

    topic.collect_count -= 1;
    topic.save();

    req.session.user.collect_topic_count -= 1;
  });
};


