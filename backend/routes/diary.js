const express = require('express');
const mongoose = require('mongoose');
const DiaryEntry = require('../models/DiaryEntry');
const User = require('../models/User');

const router = express.Router();

// POST /api/diary/entries
router.post('/entries', async (req, res) => {
  const {
    userId,
    kind,
    spotifyId,
    title,
    image,
    primaryArtistName,
    primaryArtistId,
    albumName,
    albumId,
    rating,
    notes,
    loggedAt,
  } = req.body;

  if (!userId || !kind || !spotifyId || !title || rating == null) {
    return res.status(400).json({ message: 'Missing required fields: userId, kind, spotifyId, title, rating' });
  }
  if (!['album', 'track'].includes(kind)) {
    return res.status(400).json({ message: 'kind must be album or track' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = new DiaryEntry({
      userId,
      kind,
      spotifyId,
      title,
      image: image || '',
      primaryArtistName: primaryArtistName || '',
      primaryArtistId: primaryArtistId || '',
      albumName: albumName || '',
      albumId: albumId || '',
      rating: Number(rating),
      notes: notes || '',
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create diary entry', error: err.message });
  }
});

// GET /api/diary/entries?userId=&kind=&sort=&order=
router.get('/entries', async (req, res) => {
  const { userId, kind, sort = 'date', order = 'desc' } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const filter = { userId };
    if (kind && kind !== 'all') {
      if (!['album', 'track'].includes(kind)) {
        return res.status(400).json({ message: 'kind must be all, album, or track' });
      }
      filter.kind = kind;
    }

    let sortSpec = {};
    if (sort === 'rating') {
      sortSpec.rating = order === 'asc' ? 1 : -1;
      sortSpec.loggedAt = -1;
    } else {
      sortSpec.loggedAt = order === 'asc' ? 1 : -1;
    }

    const entries = await DiaryEntry.find(filter).sort(sortSpec).lean();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list diary entries', error: err.message });
  }
});

// PATCH /api/diary/entries/:id
router.patch('/entries/:id', async (req, res) => {
  const { id } = req.params;
  const { userId, rating, notes, loggedAt } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid entry id' });
  }

  try {
    const entry = await DiaryEntry.findById(id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (rating != null) entry.rating = Number(rating);
    if (notes !== undefined) entry.notes = notes;
    if (loggedAt) entry.loggedAt = new Date(loggedAt);

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update diary entry', error: err.message });
  }
});

// DELETE /api/diary/entries/:id
router.delete('/entries/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId' });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid entry id' });
  }

  try {
    const entry = await DiaryEntry.findById(id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await DiaryEntry.deleteOne({ _id: id });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete diary entry', error: err.message });
  }
});

module.exports = router;
