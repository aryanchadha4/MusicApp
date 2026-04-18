const mongoose = require('mongoose');
const fetch = require('node-fetch');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/musicratingapp';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken() {
  const resp = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`
  });
  const data = await resp.json();
  return data.access_token;
}

async function getArtistIdByName(name, accessToken) {
  const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`, {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const data = await resp.json();
  return data.artists && data.artists.items && data.artists.items[0] ? data.artists.items[0].id : '';
}

async function getArtistIdByAlbumId(albumId, accessToken) {
  const resp = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { Authorization: 'Bearer ' + accessToken }
  });
  const data = await resp.json();
  return data.artists && data.artists[0] ? data.artists[0].id : '';
}

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const accessToken = await getSpotifyAccessToken();
  const users = await User.find();
  for (const user of users) {
    let updated = false;
    // Fix favoriteArtists
    if (Array.isArray(user.favoriteArtists)) {
      user.favoriteArtists = user.favoriteArtists.map(a => {
        if (typeof a === 'string') return { name: a, id: '' };
        if (!a.id && a.name) updated = true;
        return a;
      });
      for (const artist of user.favoriteArtists) {
        if (!artist.id && artist.name) {
          artist.id = await getArtistIdByName(artist.name, accessToken);
          updated = true;
        }
      }
    }
    // Fix favoriteSongs
    if (Array.isArray(user.favoriteSongs)) {
      for (const song of user.favoriteSongs) {
        if (song.artist && !song.artistId) {
          song.artistId = await getArtistIdByName(song.artist, accessToken);
          updated = true;
        }
      }
    }
    // Fix ratedAlbums
    if (Array.isArray(user.ratedAlbums)) {
      for (const album of user.ratedAlbums) {
        if (!album.artistId && album.albumId) {
          album.artistId = await getArtistIdByAlbumId(album.albumId, accessToken);
          updated = true;
        }
      }
    }
    if (updated) {
      await user.save();
      console.log(`Updated user ${user.email}`);
    }
  }
  mongoose.disconnect();
  console.log('Migration complete.');
}

async function clearAllReviews() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const users = await User.find();
  for (const user of users) {
    user.ratedAlbums = [];
    if (!user.name) user.name = 'Unknown';
    await user.save();
    console.log(`Cleared reviews for user ${user.email}`);
  }
  mongoose.disconnect();
  console.log('All reviews cleared.');
}

async function deleteAllUsers() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
  mongoose.disconnect();
  console.log('All users deleted.');
}

// Uncomment to run the deleteAllUsers script
deleteAllUsers();
// clearAllReviews();
// migrate(); 