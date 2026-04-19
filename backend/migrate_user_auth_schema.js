require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^[_.-]+|[_.-]+$/g, '')
    .slice(0, 24);
}

function displayNameFromEmail(email) {
  const localPart = String(email || '').split('@')[0] || 'listener';
  return localPart
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function generateUniqueUsername(baseValue, currentUserId) {
  const base = normalizeUsername(baseValue) || 'listener';
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await User.findOne({ username: candidate }).select('_id');
    if (!existing || existing._id.toString() === currentUserId.toString()) {
      return candidate;
    }
    const suffixText = String(suffix++);
    const trimmedBase = base.slice(0, Math.max(1, 24 - suffixText.length - 1));
    candidate = `${trimmedBase}_${suffixText}`;
  }
}

async function migrateUsers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/musicratingapp');

  const users = await User.find({}).select('+password');
  let updatedCount = 0;

  for (const user of users) {
    let changed = false;
    const normalizedEmail = normalizeEmail(user.email);
    if (user.email !== normalizedEmail) {
      user.email = normalizedEmail;
      changed = true;
    }

    if (!user.created_at) {
      user.created_at = user.createdAt || new Date();
      changed = true;
    }

    if (!user.username || !String(user.username).trim()) {
      user.username = await generateUniqueUsername(normalizedEmail.split('@')[0], user._id);
      changed = true;
    } else {
      const normalizedExistingUsername = normalizeUsername(user.username);
      if (user.username !== normalizedExistingUsername) {
        user.username = await generateUniqueUsername(normalizedExistingUsername, user._id);
        changed = true;
      }
    }

    if (!user.name || !String(user.name).trim()) {
      user.name = displayNameFromEmail(normalizedEmail);
      changed = true;
    }

    if (!Array.isArray(user.favoriteArtists)) {
      user.favoriteArtists = [];
      changed = true;
    }

    if (!Array.isArray(user.favoriteSongs)) {
      user.favoriteSongs = [];
      changed = true;
    }

    if (typeof user.password === 'string' && !BCRYPT_HASH_RE.test(user.password)) {
      user.password = await bcrypt.hash(user.password, 10);
      changed = true;
    }

    if (changed) {
      await user.save();
      updatedCount += 1;
    }
  }

  console.log(`Migrated ${updatedCount} user(s).`);
  await mongoose.disconnect();
}

migrateUsers().catch(async (error) => {
  console.error('User auth migration failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
