/**
 * One-time migration: copy User.ratedAlbums into DiaryEntry collection.
 * Run from backend/: node migrate_ratedAlbums_to_diary.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DiaryEntry = require('./models/DiaryEntry');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/musicratingapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const users = await User.find({ 'ratedAlbums.0': { $exists: true } });
  let created = 0;

  for (const user of users) {
    for (const a of user.ratedAlbums || []) {
      if (!a.albumId) continue;
      const exists = await DiaryEntry.findOne({
        userId: user._id,
        kind: 'album',
        spotifyId: a.albumId,
      });
      if (exists) continue;

      await DiaryEntry.create({
        userId: user._id,
        kind: 'album',
        spotifyId: a.albumId,
        title: a.albumName || 'Unknown',
        image: a.image || a.albumImage || '',
        primaryArtistName: a.artist || a.artistName || '',
        primaryArtistId: a.artistId || '',
        albumName: '',
        albumId: '',
        rating: a.rating ?? 0,
        notes: a.review || '',
        loggedAt: a.reviewedAt || new Date(),
      });
      created += 1;
    }
  }

  console.log(`Migration done. Created ${created} diary entries from ratedAlbums.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
