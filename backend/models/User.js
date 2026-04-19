const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

const ratedAlbumSchema = new mongoose.Schema({
  albumId: String,
  albumName: String,
  artist: String,
  artistId: String,
  image: String,
  rating: Number,
  review: String,
  reviewedAt: { type: Date, default: Date.now }
}, { _id: false });

const favoriteSongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  artistId: String
}, { _id: false });

const favoriteArtistSchema = new mongoose.Schema({
  name: String,
  id: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, select: false },
  created_at: { type: Date, default: Date.now },
  username: { type: String, unique: true, sparse: true, trim: true },
  name: { type: String, trim: true, default: '' },
  favoriteArtists: { type: [favoriteArtistSchema], default: [] },
  favoriteSongs: { type: [favoriteSongSchema], default: [] },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratedAlbums: { type: [ratedAlbumSchema], default: [] },
  profilePic: { type: String, default: '' },
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id?.toString() || ret.id;
      delete ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
});

userSchema.pre('validate', function normalizeAuthFields(next) {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  if (typeof this.username === 'string') {
    const trimmedUsername = this.username.trim();
    this.username = trimmedUsername || undefined;
  }
  if (typeof this.name === 'string') {
    this.name = this.name.trim();
  }
  if (!this.created_at) {
    this.created_at = new Date();
  }
  next();
});

userSchema.pre('save', async function hashPasswordIfNeeded(next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (BCRYPT_HASH_RE.test(this.password)) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
