const mongoose = require('mongoose');

const listItemSchema = new mongoose.Schema(
  {
    diaryEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiaryEntry',
      required: false,
    },
    spotifyId: { type: String, default: '' },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    primaryArtistName: { type: String, default: '' },
    albumName: { type: String, default: '' },
    kind: { type: String, enum: ['album', 'track'], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

listItemSchema.index({ diaryEntryId: 1 });
listItemSchema.index({ spotifyId: 1 });

const musicListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    itemKind: { type: String, enum: ['album', 'track'], required: true },
    displayMode: {
      type: String,
      enum: ['both', 'name', 'cover'],
      default: 'both',
    },
    items: { type: [listItemSchema], default: [] },
  },
  { timestamps: true }
);

musicListSchema.index({ userId: 1, updatedAt: -1 });
musicListSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('MusicList', musicListSchema);
