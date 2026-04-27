const mongoose = require('mongoose');
const { applyStandardJson } = require('./schemaUtils');

const artistSchema = new mongoose.Schema(
  {
    spotifyId: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    genres: { type: [String], default: [] },
    popularity: { type: Number, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  {
    collection: 'artists',
    timestamps: true,
  }
);

applyStandardJson(artistSchema);

module.exports = mongoose.model('Artist', artistSchema);
