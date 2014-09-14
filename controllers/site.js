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
var Tag = require('../proxy').Tag;
var TagModel = require('../models').Tag;
var Relation = require('../proxy').Relation;
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
        home: true
      });
    });
  proxy.fail(next);

  // 取主题
  var ep_follow = new EventProxy();
  ep_follow.on('following', function(following) {
    var query = {
      // isPublic: true,
      // is_delete: false
    };
    if (following.length > 0) {
      query.author_id = {
        $in: following
      };
    }
    var options = { skip: (page - 1) * limit, limit: limit, sort: [
      ['create_at', 'desc']
    ]};
    Topic.getTopicsByQuery(query, options, function(err, topics) {
      var ep = new EventProxy();
      ep.after('like_ready', topics.length, function() {
        var ep1 = new EventProxy();
        ep1.after('collect_ready', topics.length, function() {
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

    // 取分页数据
    Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  });
  Relation.getFollowings(req.session.user._id, function(err, relations) {
    if (err) {
      next(err);
    }
    if (!relations) {
      relations = [];
    }
    var following = [];
    relations.map(function(item, key) {
      following.push(item.follow_id.toString());
    });
    ep_follow.emit('following', following);
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
};

exports.topics = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('tags', 'topics', 'no_reply_topics', 'pages',
    function (tags, topics, no_reply_topics, pages) {
      res.render('topics', {
        tags: tags,
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        no_reply_topics: no_reply_topics,
        pages: pages,
        site_links: config.site_links,
        home: true
      });
    });
  proxy.fail(next);

  // 取标签
  TagModel.find({}, [], {limit: 20, sort: [
    ['topic_count', 'desc']
  ], field: 'name topic_count'}, proxy.done('tags', function(tags) {
    return tags;
  }));

  // 取主题
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  Topic.getTopicsByQuery({}, options, function(err, topics) {
    var ep = new EventProxy();
    ep.after('like_ready', topics.length, function() {
      var ep1 = new EventProxy();
      ep1.after('collect_ready', topics.length, function() {
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

exports.search = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  var keyword = req.query.keyword;
  var type = req.query.type || 'topic';
  page = page > 0 ? page : 1;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('type', 'results', 'no_reply_topics', 'pages',
    function (type, results, no_reply_topics, pages) {
      res.render('search', {
        type: type,
        keyword: keyword,
        results: results,
        current_page: page,
        list_topic_count: limit,
        pages: pages,
        site_links: config.site_links
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {};
  if(keyword && type === 'topic') {
    query['$or'] = [
      { title: new RegExp(keyword) },
      { content: new RegExp(keyword) }
    ];//模糊查询参数
  }
  if (keyword && type === 'people') {
    query['name'] = new RegExp(keyword)
  }

  if (type === 'topic') {
    var options = { skip: (page - 1) * limit, limit: limit, sort: [
      ['create_at', 'desc' ]
    ] };
    Topic.getTopicsByQuery(query, options, function(err, topics) {
      var ep = new EventProxy();
      ep.after('like_ready', topics.length, function() {
        var ep1 = new EventProxy();
        ep1.after('collect_ready', topics.length, function() {
          proxy.emit('results', topics);
          proxy.emit('type', 'topic');
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

    // 取分页数据
    Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  } else {
    var options = { skip: (page - 1) * limit, limit: limit, sort: [
      ['create_at', 'desc' ]
    ] };
    User.getUsersByQuery(query, options, function(err, users) {
      var ep = new EventProxy();
      ep.after('follow_ready', users.length, function() {
        proxy.emit('results', users);
        proxy.emit('type', 'people');
      });
      users.map(function(user, key) {
        Relation.getRelation(req.session.user._id, user._id, function(err, relation) {
          if (relation) {
            user.followed = true;
          } else {
            user.followed = false;
          }
          ep.emit('follow_ready', user);
        });
      });      
    });

    // 取分页数据
    User.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  }
    

  // 取0回复的主题
  Topic.getTopicsByQuery(
    { reply_count: 0 },
    { limit: 5, sort: [
      [ 'create_at', 'desc' ]
    ] },
    proxy.done('no_reply_topics', function (no_reply_topics) {
      return no_reply_topics;
  }));   
};

exports.tags = function (req, res, next) {
  var user = req.session.user;
  var proxy = EventProxy.create('tags', 'no_reply_topics',
    function (tags, no_reply_topics, pages) {
      res.render('tags', {
        tags: tags,
        site_links: config.site_links
      });
    });
  proxy.fail(next);

  // 取标签
  TagModel.find({}, [], {sort: [
    ['topic_count', 'desc']
  ], field: 'name topic_count'}, proxy.done('tags', function(tags) {
    return tags;
  }));

  // 取0回复的主题
  Topic.getTopicsByQuery(
    { reply_count: 0 },
    { limit: 5, sort: [
      [ 'create_at', 'desc' ]
    ] },
    proxy.done('no_reply_topics', function (no_reply_topics) {
      return no_reply_topics;
  }));
};

exports.tag = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  var tag = req.params.tag;
  page = page > 0 ? page : 1;
  var user = req.session.user;
  var limit = config.list_topic_count;

  var proxy = EventProxy.create('topics', 'no_reply_topics', 'pages',
    function (topics, no_reply_topics, pages) {
      res.render('tag', {
        tag: tag,
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        pages: pages,
        site_links: config.site_links
      });
    });
  proxy.fail(next);

  // 取主题
  var query = {};
  if(tag) {
    query['tags'] = new RegExp(tag);//模糊查询参数
  } 
  var options = { skip: (page - 1) * limit, limit: limit, sort: [
    ['create_at', 'desc' ]
  ] };
  Topic.getTopicsByQuery(query, options, function(err, topics) {
    var ep = new EventProxy();
    ep.after('like_ready', topics.length, function() {
      var ep1 = new EventProxy();
      ep1.after('collect_ready', topics.length, function() {
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
  Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
    var pages = Math.ceil(all_topics_count / limit);
    proxy.emit('pages', pages);
  }));
};
