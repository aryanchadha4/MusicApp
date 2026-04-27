const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const listItemSchema = new mongoose.Schema(
  {
    listId: { type: ObjectId, ref: 'ListCollection', required: true, index: true },
    sourceMusicEntryId: { type: ObjectId, ref: 'MusicEntry', default: null, index: true },
    subjectType: { type: String, enum: ['album', 'track'], required: true },
    subjectModel: { type: String, enum: ['Album', 'Track'], required: true },
    subjectId: { type: ObjectId, refPath: 'subjectModel', required: true, index: true },
    legacyListItemId: { type: String, default: '' },
    position: { type: Number, default: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'list_items',
    timestamps: true,
  }
);

listItemSchema.index({ listId: 1, position: 1 });
listItemSchema.index({ listId: 1, subjectType: 1, subjectId: 1 }, { unique: true });

applyStandardJson(listItemSchema);

module.exports = mongoose.model('ListItem', listItemSchema);
