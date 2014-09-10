
var models = require('../models');
var Like = models.Like;

/**
 * 查找是否已赞记录
 * @param {ID} userId 赞的人的id
 * @param {ID} topicId 被赞文章的id
 */
exports.getLike = function (userId, topicId, callback) {
  Like.findOne({user_id: userId, topic_id: topicId}, callback);
};

/**
 * 查找一篇记录的赞的人数
 * @param {ID} topicId 记录的id
 */
exports.getLikesByTopic = function (topicId, callback) {
  Like.count({topic_id: topicId}, callback);
};

/**
 * 根据用户查找赞的记录
 * @param {ID} userId 被关注人的id
 */
exports.getLikesByUser = function (userId, callback) {
  Like.find({user_id: userId}, callback);
};

/**
 * 创建新的关注关系
 * @param {ID} userId 被关注人的id
 * @param {ID} topicId 被赞记录的id
 */
exports.newAndSave = function (userId, topicId, callback) {
  var like = new Like();
  like.user_id = userId;
  like.topic_id = topicId;
  like.save(callback);
};

/**
 * 删除的关注关系
 * @param {ID} userId 被关注人的id
 * @param {ID} topicId 被赞记录的id
 */
exports.remove = function (userId, topicId, callback) {
  Like.remove({user_id: userId, topic_id: topicId}, callback);
};
