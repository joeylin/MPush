var models = require('../models');
var GroupFollow = models.GroupFollow;

/**
 * 查找关注关系
 * @param {ID} userId 被关注人的id
 * @param {ID} groupId 关注人的id
 */
exports.getGroupFollow = function (userId, groupId, callback) {
  GroupFollow.findOne({user_id: userId, group_id: groupId}, callback);
};

/**
 * 根据用户查找用户管组的分组
 * @param {ID} userId 被关注人的id
 */
exports.getUserFollows = function (userId, callback) {
  GroupFollow.find({user_id: userId}, callback);
};

/**
 * 创建新的关注关系
 * @param {ID} userId 被关注人的id
 * @param {ID} groupId 关注人的id
 */
exports.newAndSave = function (userId, groupId, callback) {
  var groupFollow = new GroupFollow();
  groupFollow.user_id = userId;
  groupFollow.group_id = groupId;
  groupFollow.save(callback);
};

/**
 * 删除的关注关系
 * @param {ID} userId 被关注人的id
 * @param {ID} groupId 关注人的id
 */
exports.remove = function (userId, groupId, callback) {
  GroupFollow.remove({user_id: userId, group_id: groupId}, callback);
};