const mongoose = require('mongoose');

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
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favoriteArtists: { type: [favoriteArtistSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  favoriteSongs: { type: [favoriteSongSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  ratedAlbums: { type: [ratedAlbumSchema], default: [] },
  profilePic: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
