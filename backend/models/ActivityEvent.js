const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const activityEventSchema = new mongoose.Schema(
  {
    actorUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    targetUserId: { type: ObjectId, ref: 'UserAccount', default: null, index: true },
    musicEntryId: { type: ObjectId, ref: 'MusicEntry', default: null, index: true },
    type: {
      type: String,
      enum: [
        'music_entry_logged',
        'music_entry_updated',
        'music_entry_deleted',
        'friend_request_sent',
        'friendship_created',
        'follow_created',
      ],
      required: true,
      index: true,
    },
    subjectType: {
      type: String,
      enum: ['album', 'track', 'music_entry', 'friend_request', 'friendship', 'follow', 'user'],
      default: 'music_entry',
    },
    subjectId: { type: ObjectId, default: null, index: true },
    visibility: { type: String, enum: ['private', 'friends', 'public'], default: 'friends' },
    occurredAt: { type: Date, default: Date.now, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'activity_events',
    timestamps: true,
  }
);

activityEventSchema.index({ actorUserId: 1, occurredAt: -1 });
activityEventSchema.index({ type: 1, occurredAt: -1 });

applyStandardJson(activityEventSchema);

module.exports = mongoose.model('ActivityEvent', activityEventSchema);
