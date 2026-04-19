const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();
const LOGIN_TOKEN_TTL = '1d';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';

/** When profile is requested for this email and no user exists, create a minimal dev user (auth-off / local dev). */
const DEV_AUTO_EMAIL = (process.env.DEV_AUTO_EMAIL || 'dev@musicratingapp.local').toLowerCase();

async function ensureDevUserByEmail(emailRaw) {
  const email = String(emailRaw || '').trim().toLowerCase();
  if (email !== DEV_AUTO_EMAIL) return null;
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const hashedPassword = await bcrypt.hash('dev-placeholder-not-used', 10);
  const user = new User({
    username: 'dev_listener',
    name: 'Dev Listener',
    email,
    password: hashedPassword,
    favoriteArtists: [{ name: 'TBD', id: 'dev' }],
    favoriteSongs: [{ title: 'TBD', artist: 'TBD', artistId: 'dev' }],
    profilePic: '',
  });
  try {
    await user.save();
    return user;
  } catch (e) {
    if (e.code === 11000) {
      return User.findOne({ email });
    }
    throw e;
  }
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function buildAuthUser(user) {
  return {
    id: user._id.toString(),
    username: user.username || '',
    email: user.email,
    created_at: user.created_at || user.createdAt,
  };
}

function getAuthToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return '';
  return token.trim();
}

async function buildProfileResponse(user) {
  const followingUsersRaw = await User.find({ _id: { $in: user.following } }).select('name username email _id profilePic');
  const followingUsers = followingUsersRaw.map((u) => ({
    _id: u._id,
    name: u.name || 'Unknown',
    username: u.username || 'unknown',
    email: u.email || '',
    profilePic: u.profilePic || '/default-avatar.jpeg',
  }));

  const followersRaw = await User.find({ following: user._id }).select('name username email _id profilePic');
  const followers = followersRaw.map((u) => ({
    _id: u._id,
    name: u.name || 'Unknown',
    username: u.username || 'unknown',
    email: u.email || '',
    profilePic: u.profilePic || '/default-avatar.jpeg',
  }));

  return {
    id: user._id.toString(),
    username: user.username || '',
    name: user.name,
    email: user.email,
    favoriteArtists: user.favoriteArtists,
    favoriteSongs: user.favoriteSongs,
    ratedAlbums: user.ratedAlbums || [],
    created_at: user.created_at || user.createdAt,
    createdAt: user.created_at || user.createdAt,
    joined: user.created_at || user.createdAt,
    following: followingUsers,
    followers,
    profilePic: user.profilePic || '',
  };
}

async function requireAuth(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }
    req.auth = payload;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session' });
  }
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

async function generateUniqueUsername(baseValue) {
  const base = normalizeUsername(baseValue) || 'listener';
  let candidate = base;
  let suffix = 1;

  while (await User.exists({ username: candidate })) {
    const suffixText = String(suffix++);
    const trimmedBase = base.slice(0, Math.max(1, 24 - suffixText.length - 1));
    candidate = `${trimmedBase}_${suffixText}`;
  }

  return candidate;
}

// Helper to get Spotify token
async function getSpotifyToken() {
  if (global.spotifyToken && global.spotifyTokenExpires > Date.now()) return global.spotifyToken;
  const resp = await axios.post('https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
      }
    }
  );
  global.spotifyToken = resp.data.access_token;
  global.spotifyTokenExpires = Date.now() + (resp.data.expires_in - 60) * 1000;
  return global.spotifyToken;
}

// Signup
router.post('/signup', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const name = String(req.body.name || '').trim();
  const requestedUsername = normalizeUsername(req.body.username);
  const favoriteArtists = Array.isArray(req.body.favoriteArtists) ? req.body.favoriteArtists : [];
  const favoriteSongs = Array.isArray(req.body.favoriteSongs) ? req.body.favoriteSongs : [];
  const profilePic = typeof req.body.profilePic === 'string' ? req.body.profilePic : '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    if (requestedUsername) {
      const existingUsername = await User.findOne({ username: requestedUsername });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const username = requestedUsername || await generateUniqueUsername(email.split('@')[0]);

    const user = new User({
      username,
      name: name || displayNameFromEmail(email),
      email,
      password,
      favoriteArtists,
      favoriteSongs,
      profilePic,
    });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: buildAuthUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email || req.body.identifier);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Authentication is not configured correctly' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: LOGIN_TOKEN_TTL }
    );

    res.json({
      token,
      user: buildAuthUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = await buildProfileResponse(req.user);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit Profile
router.patch('/edit-profile', async (req, res) => {
  const { email, name, favoriteArtists, favoriteSongs, profilePic } = req.body;
  try {
    const updateFields = { name, favoriteArtists, favoriteSongs };
    if (profilePic !== undefined) updateFields.profilePic = profilePic;
    const user = await User.findOneAndUpdate(
      { email },
      updateFields,
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  const { id, email } = req.query;
  try {
    let user;
    if (id) {
      user = await User.findById(id);
    } else if (email) {
      const trimmed = email.trim();
      user = await User.findOne({ email: trimmed });
      if (!user) {
        user = await ensureDevUserByEmail(trimmed);
      }
    } else {
      return res.status(400).json({ message: 'Missing id or email' });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    const profile = await buildProfileResponse(user);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate an album
router.post('/rate-album', async (req, res) => {
  const { userId, email, album } = req.body;
  try {
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Missing userId or email' });
    }
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Ensure artistId is present
    if (!album.artistId && album.albumId) {
      // Fetch from Spotify
      const token = await getSpotifyToken();
      const resp = await axios.get(`https://api.spotify.com/v1/albums/${album.albumId}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      album.artistId = resp.data.artists[0]?.id || '';
    }
    if (!album.artistId) {
      return res.status(400).json({ message: 'Missing artistId for review.' });
    }
    // Remove any previous rating for this album
    user.ratedAlbums = (user.ratedAlbums || []).filter(a => a.albumId !== album.albumId);
    user.ratedAlbums.push({ ...album, reviewedAt: new Date() });
    await user.save();
    // Backend check: verify artistId in saved review matches
    const saved = user.ratedAlbums.find(a => a.albumId === album.albumId);
    if (!saved || saved.artistId !== album.artistId) {
      console.warn(`ArtistId mismatch after save: sent ${album.artistId}, saved ${saved?.artistId}`);
    }
    res.json({ message: 'Album rated', ratedAlbums: user.ratedAlbums });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a review
router.post('/delete-review', async (req, res) => {
  const { userId, albumId } = req.body;
  if (!userId || !albumId) return res.status(400).json({ message: 'Missing userId or albumId' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.ratedAlbums = (user.ratedAlbums || []).filter(a => a.albumId !== albumId);
    await user.save();
    res.json({ message: 'Review deleted', ratedAlbums: user.ratedAlbums });
  } catch (err) {
    res.status(500).json({ message: 'Delete review failed' });
  }
});

// Edit a review
router.post('/edit-review', async (req, res) => {
  const { userId, albumId, review, rating } = req.body;
  if (!userId || !albumId) return res.status(400).json({ message: 'Missing userId or albumId' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    let updated = false;
    user.ratedAlbums = (user.ratedAlbums || []).map(a => {
      if (a.albumId === albumId) {
        updated = true;
        return { ...a.toObject(), review, rating };
      }
      return a;
    });
    if (!updated) return res.status(404).json({ message: 'Review not found' });
    await user.save();
    res.json({ message: 'Review updated', ratedAlbums: user.ratedAlbums });
  } catch (err) {
    res.status(500).json({ message: 'Edit review failed' });
  }
});

// Search users
router.get('/search-users', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }
  try {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name username email _id profilePic');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'User search failed' });
  }
});

// Follow a user
router.post('/follow', async (req, res) => {
  const { userId, followId } = req.body;
  if (!userId || !followId) return res.status(400).json({ message: 'Missing userId or followId' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.following.includes(followId)) {
      user.following.push(followId);
      await user.save();
    }
    res.json({ message: 'Followed', following: user.following });
  } catch (err) {
    res.status(500).json({ message: 'Follow failed' });
  }
});

// Unfollow a user
router.post('/unfollow', async (req, res) => {
  const { userId, unfollowId } = req.body;
  if (!userId || !unfollowId) return res.status(400).json({ message: 'Missing userId or unfollowId' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.following = user.following.filter(id => id.toString() !== unfollowId);
    await user.save();
    res.json({ message: 'Unfollowed', following: user.following });
  } catch (err) {
    res.status(500).json({ message: 'Unfollow failed' });
  }
});

// Get feed of ratings from followed users
router.get('/friends-feed', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  try {
    const user = await User.findById(userId).populate({
      path: 'following',
      select: 'username name ratedAlbums',
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Flatten ratings from all followed users
    const feed = [];
    for (const followed of user.following) {
      for (const rating of followed.ratedAlbums || []) {
        feed.push({
          user: followed.name || followed.username,
          userId: followed._id, // Ensure userId is present
          album: rating.albumName,
          albumId: rating.albumId, // Ensure albumId is present
          artist: rating.artist,
          artistId: rating.artistId, // Ensure artistId is present
          rating: rating.rating,
          review: rating.review,
          image: rating.image,
          reviewedAt: rating.reviewedAt
        });
      }
    }
    // Sort by most recent
    feed.sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
    res.json(feed);
  } catch (err) {
    res.status(500).json({ message: 'Friends feed failed' });
  }
});

// Change Password / Email endpoint
router.patch('/change-credentials', async (req, res) => {
  const { email, currentPassword, newPassword, newEmail } = req.body;
  if (!email || !currentPassword) return res.status(400).json({ message: 'Missing email or current password' });
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    // Update email if provided and not taken
    if (newEmail && newEmail !== user.email) {
      const existing = await User.findOne({ email: newEmail });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = newEmail;
    }
    // Update password if provided
    if (newPassword) {
      user.password = newPassword;
    }
    await user.save();
    res.json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reviews for a given album
router.get('/album-reviews', async (req, res) => {
  const { albumId } = req.query;
  if (!albumId) return res.status(400).json({ message: 'Missing albumId' });
  try {
    const users = await User.find({ 'ratedAlbums.albumId': albumId });
    const reviews = [];
    for (const user of users) {
      for (const r of user.ratedAlbums) {
        if (r.albumId === albumId) {
          reviews.push({
            user: user.name || user.username || 'Unknown',
            userId: user._id,
            albumId: r.albumId,
            rating: r.rating,
            review: r.review,
            reviewedAt: r.reviewedAt
          });
        }
      }
    }
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch album reviews' });
  }
});

module.exports = router;
