const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const friendRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    toUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    respondedAt: { type: Date, default: null },
  },
  {
    collection: 'friend_requests',
    timestamps: true,
  }
);

friendRequestSchema.index(
  { fromUserId: 1, toUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

applyStandardJson(friendRequestSchema);

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
