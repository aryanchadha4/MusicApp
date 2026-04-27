const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const trackSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    albumId: { type: ObjectId, ref: 'Album', default: null },
    primaryArtistId: { type: ObjectId, ref: 'Artist', default: null },
    artistIds: [{ type: ObjectId, ref: 'Artist' }],
    durationMs: { type: Number, default: null },
    trackNumber: { type: Number, default: null },
    explicit: { type: Boolean, default: false },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    collection: 'tracks',
    timestamps: true,
  }
);

applyStandardJson(trackSchema);

module.exports = mongoose.model('Track', trackSchema);
