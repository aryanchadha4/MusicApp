const mongoose = require('mongoose');

function transformDocument(_doc, ret) {
  ret.id = ret._id?.toString() || ret.id;
  delete ret._id;
  delete ret.__v;
  return ret;
}

function applyStandardJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    transform: transformDocument,
  });
  schema.set('toObject', {
    virtuals: true,
    transform: transformDocument,
  });
}

function normalizeObjectIdPair(leftId, rightId) {
  const [first, second] = [String(leftId || ''), String(rightId || '')].sort();
  return [first, second];
}

module.exports = {
  ObjectId: mongoose.Schema.Types.ObjectId,
  applyStandardJson,
  normalizeObjectIdPair,
};
