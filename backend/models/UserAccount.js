const mongoose = require('mongoose');
const { ObjectId, applyStandardJson } = require('./schemaUtils');

const userAccountSchema = new mongoose.Schema(
  {
    legacyUserId: { type: ObjectId, ref: 'User', sparse: true, unique: true, index: true },
    username: { type: String, trim: true, sparse: true, unique: true },
    displayName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    avatarUrl: { type: String, default: '' },
    favoriteArtistIds: [{ type: ObjectId, ref: 'Artist' }],
    favoriteTrackIds: [{ type: ObjectId, ref: 'Track' }],
    createdAtLegacy: { type: Date, default: null },
  },
  {
    collection: 'user_accounts',
    timestamps: true,
  }
);

userAccountSchema.pre('validate', function normalizeAccountFields(next) {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  if (typeof this.username === 'string') {
    const nextUsername = this.username.trim().toLowerCase();
    this.username = nextUsername || undefined;
  }
  if (typeof this.displayName === 'string') {
    this.displayName = this.displayName.trim();
  }
  next();
});

applyStandardJson(userAccountSchema);

module.exports = mongoose.model('UserAccount', userAccountSchema);
