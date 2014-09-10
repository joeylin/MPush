/**
 * Module dependencies.
 */

var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var message = require('./controllers/message');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');
var rss = require('./controllers/rss');
var assets = require('./controllers/static');
var tools = require('./controllers/tools');
var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
var status = require('./controllers/status');
var github = require('./controllers/github');
var search = require('./controllers/search');
var passport = require('passport');
var configMiddleware = require('./middlewares/conf');
var config = require('./config');

var getUploadToken = function(req, res) {
    var qiniu = require('qiniu');
    qiniu.conf.ACCESS_KEY = config.qiniu.accessKey;
    qiniu.conf.SECRET_KEY = config.qiniu.secretKey;
    var putPolicy = new qiniu.rs.PutPolicy(config.qiniu.bucket);
    var result = {
        token: putPolicy.token(),
        host: config.qiniu.bucketHost
    };
    res.json(result);
};

module.exports = function (app) {
	app.post('/api/topic/update', auth.signinRequired, topic.ajax_update);
	app.post('/api/topic/create', auth.signinRequired, limit.postInterval, topic.pagePut);
	app.post('/api/topic/like', auth.signinRequired, topic.like);
	app.post('/api/topic/unlike', auth.signinRequired, topic.un_like);
	app.post('/api/topic/forward', auth.signinRequired, topic.forward);
	app.get('/api/topic/repliesLimit', auth.signinRequired, reply.getPageTopicRepliesLimit);
	app.get('/api/topic/replies', auth.signinRequired, reply.getPageTopicReplies);

	app.post('/api/topic/:topic_id/ajaxReply', auth.userRequired, limit.postInterval, reply.ajax_add);
	app.post('/api/topic/:topic_id/ajaxReply2', auth.userRequired, limit.postInterval, reply.ajax_add_reply2);
	app.post('/api/setting/avatar', auth.userRequired, user.ajax_avatar);

	// token
	app.post('/api/token.json', auth.userRequired, getUploadToken);
}