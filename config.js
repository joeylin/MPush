/**
 * config
 */

var path = require('path');
var pkg = require('./package.json');

var debug = false;

var config = {
  // debug 为 true 时，用于本地调试
  debug: debug,

  mini_assets: !debug, // 是否启用静态文件的合并压缩，详见视图中的Loader

  name: 'Morepush', // 社区名字
  description: 'Morepush 记录分享交流你的总结心得', // 社区的描述

  // 添加到 html head 中的信息
  site_headers: [],
  site_logo: '<img src="/public/images/logo.png" title="morepush" />', // default is `name`
  site_icon: '/public/images/logo_32.png', // 默认没有 favicon, 这里填写网址
  // 右上角的导航区
  site_navs: [
    // 格式 [ path, title, [target=''] ]
    // 例子 [ '/about', '关于' ],
  ],
  // cdn host，如 http://valuenet.qiniudn.com
  site_static_host: '', // 静态文件存储域名
  // 社区的域名
  host: 'morepush.com',
  // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
  google_tracker_id: 'UA-54659872-1',

  // mongodb 配置
  db: 'mongodb://127.0.0.1/node_club_dev',
  db_name: 'node_club_dev',


  session_secret: 'mpsession', // 务必修改
  auth_cookie_name: 'mpsession',

  // 程序运行的端口
  port: 3000,

  // 话题列表显示的话题数量
  list_topic_count: 20,

  // 限制发帖时间间隔，单位：毫秒
  post_interval: 2000,

  // 七牛组件配置
  qiniu: {
      accessKey: 'RTfz66gR4FRkqjAYr36WgiB04KpexfsAejR5d6jw',
      secretKey: 'JOkxMLsHGvmJCtmVCYZIRXmpboloBQ3y_Hvjy-X3',
      bucket: 'valuenet',
      bucketHost: 'valuenet.qiniudn.com'
  },

  // RSS配置
  rss: {
    title: 'Mpush：程序员的记录本',
    link: 'http://morepush.com',
    language: 'zh-cn',
    description: 'Mpush：程序员的记录本',
    //最多获取的RSS Item数量
    max_rss_items: 50
  },

  // site links
  site_links: [
    {
      'text': 'ngnice',
      'url': 'http://www.ngnice.com/',
    },
    {
      text: '前端乱炖',
      url: 'http://html-js.com',
    },
    {
      'text': 'Node.js 官网',
      'url': 'http://nodejs.org/',
    }
  ],

  // 邮箱配置
  mail_opts: {
    host: 'smtp.ym.163.com',
    port: 25,
    auth: {
      user: 'joeylin@morepush.com',
      pass: 'linyao4200162'
    }
  },

  //weibo app key
  weibo_key: 10000000,

  // admin 可删除话题，编辑标签，设某人为达人
  admins: { user_login_name: true },

  // github 登陆的配置
  GITHUB_OAUTH: {
    clientID: '10bcbd067b991f5868df',
    clientSecret: '9af5c00e0222599fc87bb04c1e4bb1ccff851efe',
    callbackURL: 'http://morepush.com/auth/github/callback',
  },
  // 是否允许直接注册（否则只能走 github 的方式）
  allow_sign_up: true,

  // newrelic 是个用来监控网站性能的服务
  newrelic_key: 'c86d960ace9593a38b731c01c92c74d80ff9dbf5'
};

module.exports = config;
module.exports.config = config;
