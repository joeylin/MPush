/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var group = require('./controllers/group');
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


module.exports = function (app) {
  // home page
  app.get('/', auth.signinRequired, site.index);
  app.get('/home', auth.signinRequired, site.index);
  app.get('/topics', auth.signinRequired, site.topics);

  // sign up, login, logout
  if (config.allow_sign_up) {
    app.get('/signup', sign.showSignup);  // 跳转到注册页面
    app.post('/signup', sign.signup);  // 提交注册信息
  } else {
    app.get('/signup', configMiddleware.github, passport.authenticate('github'));  // 进行github验证
  }
  app.post('/signout', sign.signout);  // 登出
  app.get('/signin', sign.showLogin);  // 进入登录页面
  app.post('/signin', sign.login);  // 登录校验
  app.get('/active_account', sign.active_account);  //帐号激活

  // password
  app.get('/search_pass', sign.showSearchPass);  // 找回密码页面
  app.post('/search_pass', sign.updateSearchPass);  // 更新密码
  app.get('/reset_pass', sign.reset_pass);  // 进入重置密码页面
  app.post('/reset_pass', sign.update_pass);  // 更新密码

  // user
  app.get('/user/:name', auth.signinRequired, user.index); // 用户个人主页
  app.get('/profile', auth.signinRequired, user.profile); // 用户个人主页
  app.get('/setting', auth.signinRequired, user.showSetting); // 用户个人设置页
  app.post('/setting', auth.signinRequired, user.setting); // 提交个人信息设置
  app.get('/stars', auth.signinRequired, user.show_stars); // 显示所有达人列表页
  app.get('/users/top100', auth.signinRequired, user.top100);  // 显示积分前一百用户页
  // app.get('/user/:name/collections', auth.signinRequired, user.get_collect_topics);  // 用户收藏的所有话题页
  app.get('/my/messages', auth.signinRequired, message.index); // 用户个人的所有消息页
  app.get('/my/topics', auth.signinRequired, user.records); // 用户个人的记录本
  app.get('/my/collections', auth.signinRequired, user.collections); // 用户个人的收藏本
  app.get('/user/:name/follower', auth.signinRequired, user.get_followers);  // 用户的粉丝页
  app.get('/user/:name/following', auth.signinRequired, auth.signinRequired, user.get_followings);  // 用户关注的对象页
  app.get('/user/:name/topics', auth.signinRequired, user.list_topics);  // 用户发布的所有话题页
  app.get('/user/:name/replies', auth.signinRequired, user.list_replies);  // 用户参与的所有回复页
  app.post('/user/follow', auth.userRequired, user.follow); // 关注某用户
  app.post('/user/un_follow', user.un_follow);  // 取消关注某用户
  app.post('/user/set_star', user.toggle_star); // 把某用户设为达人
  app.post('/user/cancel_star', user.toggle_star);  // 取消某用户的达人身份
  app.post('/user/:name/block', auth.adminRequired, user.block);  // 禁言某用户

  // topic
  // 新建文章界面
  app.get('/topic/create', auth.signinRequired, topic.create);
  app.get('/topic/:tid', topic.index);  // 显示某个话题
  app.get('/topic/:tid/top/:is_top?', auth.signinRequired, topic.top);  // 将某话题置顶
  app.get('/topic/:tid/edit', auth.signinRequired, topic.showEdit);  // 编辑某话题

  // Po-Ying Chen <poying.me@gmail.com>: 當 "非" 作者的使用者在留言的地方貼上一個網址為
  // http://[domain name]/topic/[topic id]/delete 的圖片之後，只要作者一看到圖片，文章就會被刪除了，
  // 可能需要將刪除的方法改成 post 來避免此問題
  app.post('/topic/:tid/delete', topic.delete);

  // 保存新建的文章
  // TODO: 如果创建文章的过程太长，导致session过期，界面的内容会丢失
  // FIXME: 采用前端来判断，不通过跳转的形式来解决
  app.post('/topic/create', auth.signinRequired, limit.postInterval, topic.put);
  app.post('/topic/:tid/edit', topic.update);
  app.post('/topic/collect', auth.userRequired, topic.collect); // 关注某话题
  app.post('/topic/de_collect', auth.userRequired, topic.de_collect); // 取消关注某话题

  // 新建分组界面
  app.get('/group/create', auth.signinRequired, group.create);
  app.get('/group/:gid', group.index);  // 显示某个话题

  // 创建新分组
  app.post('/group/create', auth.signinRequired, limit.postInterval, group.put);
  app.post('/group/:gid/edit', group.update);
  app.post('/group/follow', auth.userRequired, group.follow); // 关注某分组
  app.post('/group/unfollow', auth.userRequired, group.unfollow); // 取消关注某分组

  // reply
  // 回复
  app.get('/reply/:reply_id/edit', reply.showEdit); // 修改自己的评论页
  app.post('/:topic_id/reply', auth.userRequired, limit.postInterval, reply.add); // 提交一级回复
  app.post('/:topic_id/reply2', auth.userRequired, limit.postInterval, reply.add_reply2); // 提交二级回复
  app.post('/reply/:reply_id/up', auth.userRequired, reply.up); // 为评论点赞
  app.post('/reply/:reply_id/edit', reply.update); // 修改某评论
  app.post('/reply/:reply_id/delete', reply.delete); // 删除某评论

  // tools
  app.get('/site_tools', tools.run_site_tools);

  // static
  app.get('/about', assets.about);
  app.get('/faq', assets.faq);

  //rss
  app.get('/rss', rss.index);

  // site status
  app.get('/status', status.status);

  // github oauth
  app.get('/auth/github', configMiddleware.github, passport.authenticate('github'));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/signin' }),
    github.callback);
  app.get('/auth/github/new', github.new);
  app.post('/auth/github/create', github.create);

  app.get('/search', auth.userRequired, site.search);
  app.get('/tags', auth.userRequired, site.tags);
  app.get('/tags/:tag', auth.userRequired, site.tag);

};
