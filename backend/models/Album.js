const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const albumSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    primaryArtistId: { type: ObjectId, ref: 'Artist', default: null },
    artistIds: [{ type: ObjectId, ref: 'Artist' }],
    coverImageUrl: { type: String, default: '' },
    releaseDateText: { type: String, default: '' },
    releaseDatePrecision: { type: String, enum: ['year', 'month', 'day', ''], default: '' },
    totalTracks: { type: Number, default: null },
    label: { type: String, default: '' },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    collection: 'albums',
    timestamps: true,
  }
);

applyStandardJson(albumSchema);

module.exports = mongoose.model('Album', albumSchema);
