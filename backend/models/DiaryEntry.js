const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['album', 'track'], required: true },
    spotifyId: { type: String, required: true },
    title: { type: String, required: true },
    image: { type: String, default: '' },
    primaryArtistName: { type: String, default: '' },
    primaryArtistId: { type: String, default: '' },
    albumName: { type: String, default: '' },
    albumId: { type: String, default: '' },
    rating: { type: Number, required: true },
    notes: { type: String, default: '' },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

diaryEntrySchema.index({ userId: 1, loggedAt: -1 });
diaryEntrySchema.index({ userId: 1, rating: -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
