const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();

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
  const { username, name, email, password, favoriteArtists, favoriteSongs, profilePic } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      name,
      email,
      password: hashedPassword,
      favoriteArtists: favoriteArtists || [],
      favoriteSongs: favoriteSongs || [],
      profilePic: profilePic || ''
    });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({ $or: [ { email: identifier }, { username: identifier } ] });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { username: user.username, email: user.email, id: user._id } });
  } catch (err) {
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
    // Get following users
    const followingUsersRaw = await User.find({ _id: { $in: user.following } }).select('name username email _id profilePic');
    const followingUsers = followingUsersRaw.map(u => ({
      _id: u._id,
      name: u.name || 'Unknown',
      username: u.username || 'unknown',
      email: u.email || '',
      profilePic: u.profilePic || '/default-avatar.jpeg'
    }));
    // Get followers (users who have this user in their following array)
    const followersRaw = await User.find({ following: user._id }).select('name username email _id profilePic');
    const followers = followersRaw.map(u => ({
      _id: u._id,
      name: u.name || 'Unknown',
      username: u.username || 'unknown',
      email: u.email || '',
      profilePic: u.profilePic || '/default-avatar.jpeg'
    }));
    res.json({
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      favoriteArtists: user.favoriteArtists,
      favoriteSongs: user.favoriteSongs,
      ratedAlbums: user.ratedAlbums || [],
      joined: user.createdAt,
      following: followingUsers,
      followers: followers,
      profilePic: user.profilePic || ''
    });
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
    const user = await User.findOne({ email });
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
      const hashed = await bcrypt.hash(newPassword, 10);
      user.password = hashed;
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
