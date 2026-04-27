const mongoose = require('mongoose');
const { ObjectId, applyStandardJson, normalizeObjectIdPair } = require('./schemaUtils');

const friendshipSchema = new mongoose.Schema(
  {
    userAId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    userBId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    sourceRequestId: { type: ObjectId, ref: 'FriendRequest', default: null },
  },
  {
    collection: 'friendships',
    timestamps: true,
  }
);

friendshipSchema.pre('validate', function normalizeFriendshipPair(next) {
  if (!this.userAId || !this.userBId) return next();
  const [first, second] = normalizeObjectIdPair(this.userAId, this.userBId);
  this.userAId = new mongoose.Types.ObjectId(first);
  this.userBId = new mongoose.Types.ObjectId(second);
  next();
});

friendshipSchema.index({ userAId: 1, userBId: 1 }, { unique: true });

applyStandardJson(friendshipSchema);

module.exports = mongoose.model('Friendship', friendshipSchema);
