
var models = require('../models');
var Group = models.Group;

/**
 * 根据id查找分组
 * @param {ID} id 分组id
 */
exports.getGroup = function (id, callback) {
  Group.findOne({_id: id}, callback);
};

/**
 * 查找关注的分组
 * @param {ARRAY} array 用户关注的分组id集合
 */
exports.getGroupsByFollows = function (array, callback) {
  Group.find({_id: {'$in': array}}, callback);
};

/**
 * 创建新的分组
 * @param {String} name 分组名称
 * @param {String} des 分组的描述
 */
exports.newAndSave = function (name, des, avatar, tags, callback) {
  var group = new Group();
  group.name = name;
  group.des = des;
  group.tags = tags;
  group.avatar = avatar;
  group.save(callback);
};

/**
 * 删除的分组
 * @param {ID} id 分组的id
 */
exports.remove = function (id, callback) {
  Group.remove({_id: id}, callback);
};
