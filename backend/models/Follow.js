const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const followSchema = new mongoose.Schema(
  {
    followerUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    followeeUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
  },
  {
    collection: 'follows',
    timestamps: true,
  }
);

followSchema.index({ followerUserId: 1, followeeUserId: 1 }, { unique: true });

applyStandardJson(followSchema);

module.exports = mongoose.model('Follow', followSchema);
