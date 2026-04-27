const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const musicEntrySchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    legacyUserId: { type: ObjectId, ref: 'User', default: null, index: true },
    legacyDiaryEntryId: { type: ObjectId, ref: 'DiaryEntry', default: null, index: true },
    source: {
      type: String,
      enum: ['legacy_rated_album', 'legacy_diary_entry', 'app', 'migration'],
      default: 'app',
    },
    subjectType: { type: String, enum: ['album', 'track'], required: true, index: true },
    subjectModel: { type: String, enum: ['Album', 'Track'], required: true },
    subjectId: { type: ObjectId, refPath: 'subjectModel', required: true, index: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewText: { type: String, default: '' },
    notes: { type: String, default: '' },
    visibility: { type: String, enum: ['private', 'friends', 'public'], default: 'friends' },
    loggedAt: { type: Date, default: Date.now, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    collection: 'music_entries',
    timestamps: true,
  }
);

musicEntrySchema.index({ userId: 1, loggedAt: -1 });
musicEntrySchema.index({ subjectType: 1, subjectId: 1, loggedAt: -1 });
musicEntrySchema.index(
  { legacyDiaryEntryId: 1 },
  {
    unique: true,
    partialFilterExpression: { legacyDiaryEntryId: { $type: 'objectId' } },
  }
);

applyStandardJson(musicEntrySchema);

module.exports = mongoose.model('MusicEntry', musicEntrySchema);
