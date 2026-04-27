const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const listCollectionSchema = new mongoose.Schema(
  {
    legacyListId: { type: ObjectId, ref: 'MusicList', sparse: true, unique: true, index: true },
    ownerUserId: { type: ObjectId, ref: 'UserAccount', required: true, index: true },
    name: { type: String, required: true, trim: true },
    itemType: { type: String, enum: ['album', 'track'], required: true },
    displayMode: { type: String, enum: ['both', 'name', 'cover'], default: 'both' },
  },
  {
    collection: 'list_collections',
    timestamps: true,
  }
);

listCollectionSchema.index({ ownerUserId: 1, updatedAt: -1 });
listCollectionSchema.index({ ownerUserId: 1, name: 1 });

applyStandardJson(listCollectionSchema);

module.exports = mongoose.model('ListCollection', listCollectionSchema);
