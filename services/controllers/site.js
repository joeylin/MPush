/*!
 * nodeclub - site index controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
var Like = require('../proxy').Like;
var config = require('../config').config;
var EventProxy = require('eventproxy');
var mcache = require('memory-cache');

// 主页的缓存工作
// setInterval(function () {
//   var limit = config.list_topic_count;
//   // 只缓存第一页, page = 1
//   var options = { skip: (1 - 1) * limit, limit: limit, sort: [
//     ['top', 'desc' ],
//     [ 'last_reply_at', 'desc' ]
//   ] };
//   var optionsStr = JSON.stringify(options);
//   Topic.getTopicsByQuery({}, options, function (err, topics) {
//     mcache.put(optionsStr, topics);
//     return topics;
//   });
// }, 1000 * 5); // 五秒更新一次
// END 主页的缓存工作

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('topics', 'no_reply_topics', 'pages',
    function (topics, no_reply_topics, pages) {
      res.render('index', {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        no_reply_topics: no_reply_topics,
        pages: pages,
        site_links: config.site_links,
      });
    });
  proxy.fail(next);

  // 取主题
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  Topic.getTopicsByQuery({}, options, function(err, topics) {
    var ep = new EventProxy();
    ep.after('like_ready', topics.length, function(topics) {
      var ep1 = new EventProxy();
      ep1.after('collect_ready', topics.length, function(topics) {
        proxy.emit('topics', topics);
      });
      topics.map(function(topic, key) {
        TopicCollect.getTopicCollect(req.session.user._id, topic._id, ep.done(function (doc) {
          topic.in_collection = !!doc;
          ep1.emit('collect_ready', topic);
        }));
      });
    });
    topics.map(function(topic, key) {
      Like.getLike(req.session.user._id, topic._id, function(err, like) {
        if (like) {
          topic.hasLiked = true;
        } else {
          topic.hasLiked = false;
        }
        ep.emit('like_ready', topic);
      });
    });      
  });

  // 取0回复的主题
  Topic.getTopicsByQuery(
    { reply_count: 0 },
    { limit: 5, sort: [
      [ 'create_at', 'desc' ]
    ] },
    proxy.done('no_reply_topics', function (no_reply_topics) {
      return no_reply_topics;
  }));

  // 取分页数据
  Topic.getCountByQuery({}, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};
