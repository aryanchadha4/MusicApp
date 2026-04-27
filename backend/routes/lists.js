const express = require('express');
const mongoose = require('mongoose');
const MusicList = require('../models/MusicList');
const DiaryEntry = require('../models/DiaryEntry');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

async function getOwnedList(listId, userId) {
  if (!mongoose.Types.ObjectId.isValid(listId)) {
    return { error: { status: 400, message: 'Invalid list id' } };
  }
  const list = await MusicList.findById(listId);
  if (!list) return { error: { status: 404, message: 'List not found' } };
  if (list.userId.toString() !== userId) {
    return { error: { status: 403, message: 'Forbidden' } };
  }
  return { list };
}

// GET /api/lists?userId=&kind=&sort=&order=
router.get('/', requireAuth, async (req, res) => {
  const { kind = 'all', sort = 'updated', order = 'desc' } = req.query;
  const userId = req.user._id.toString();

  try {
    const filter = { userId };
    if (kind && kind !== 'all') {
      if (!['album', 'track'].includes(kind)) {
        return res.status(400).json({ message: 'kind must be all, album, or track' });
      }
      filter.itemKind = kind;
    }

    let sortSpec = {};
    if (sort === 'name') {
      sortSpec.name = order === 'asc' ? 1 : -1;
    } else if (sort === 'created') {
      sortSpec.createdAt = order === 'asc' ? 1 : -1;
    } else {
      sortSpec.updatedAt = order === 'asc' ? 1 : -1;
    }

    const lists = await MusicList.find(filter).sort(sortSpec).lean();
    res.json(lists);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list music lists', error: err.message });
  }
});

// GET /api/lists/:id?userId=
router.get('/:id', requireAuth, async (req, res) => {
  const userId = req.user._id.toString();
  const r = await getOwnedList(req.params.id, userId);
  if (r.error) return res.status(r.error.status).json({ message: r.error.message });

  res.json(r.list);
});

// POST /api/lists
router.post('/', requireAuth, async (req, res) => {
  const { name, itemKind, displayMode } = req.body;
  const userId = req.user._id.toString();

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Missing name' });
  }
  if (!['album', 'track'].includes(itemKind)) {
    return res.status(400).json({ message: 'itemKind must be album or track' });
  }
  if (displayMode && !['both', 'name', 'cover'].includes(displayMode)) {
    return res.status(400).json({ message: 'displayMode must be both, name, or cover' });
  }

  try {
    const list = new MusicList({
      userId,
      name: String(name).trim(),
      itemKind,
      displayMode: displayMode || 'both',
      items: [],
    });
    await list.save();
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create list', error: err.message });
  }
});

// PATCH /api/lists/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const { name, displayMode } = req.body;
  const userId = req.user._id.toString();
  const r = await getOwnedList(req.params.id, userId);
  if (r.error) return res.status(r.error.status).json({ message: r.error.message });

  const { list } = r;
  if (name !== undefined) {
    const t = String(name).trim();
    if (!t) return res.status(400).json({ message: 'Name cannot be empty' });
    list.name = t;
  }
  if (displayMode !== undefined) {
    if (!['both', 'name', 'cover'].includes(displayMode)) {
      return res.status(400).json({ message: 'displayMode must be both, name, or cover' });
    }
    list.displayMode = displayMode;
  }

  try {
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update list', error: err.message });
  }
});

// DELETE /api/lists/:id?userId=
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.user._id.toString();
  const r = await getOwnedList(req.params.id, userId);
  if (r.error) return res.status(r.error.status).json({ message: r.error.message });

  try {
    await MusicList.deleteOne({ _id: r.list._id });
    res.json({ message: 'List deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete list', error: err.message });
  }
});

// DELETE /api/lists/:id/items/by-id/:itemSubdocId?userId=  (must be before POST :id/items if any path overlap — N/A)
router.delete('/:id/items/by-id/:itemSubdocId', requireAuth, async (req, res) => {
  const userId = req.user._id.toString();
  const { itemSubdocId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(itemSubdocId)) {
    return res.status(400).json({ message: 'Invalid item id' });
  }

  const r = await getOwnedList(req.params.id, userId);
  if (r.error) return res.status(r.error.status).json({ message: r.error.message });

  const { list } = r;
  const before = list.items.length;
  list.items = list.items.filter((it) => it._id.toString() !== itemSubdocId);
  if (list.items.length === before) {
    return res.status(404).json({ message: 'Item not in list' });
  }

  try {
    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item', error: err.message });
  }
});

// POST /api/lists/:id/items — body: { userId, diaryEntryId } OR { userId, fromSearch: { kind, spotifyId, title, ... } }
// Prefer fromSearch when present so Search→list never fails on stray/invalid diaryEntryId.
router.post('/:id/items', requireAuth, async (req, res) => {
  const { diaryEntryId, fromSearch } = req.body;
  const userId = req.user._id.toString();

  const r = await getOwnedList(req.params.id, userId);
  if (r.error) return res.status(r.error.status).json({ message: r.error.message });

  const { list } = r;

  const isFromSearchPayload =
    fromSearch != null &&
    typeof fromSearch === 'object' &&
    !Array.isArray(fromSearch) &&
    String(fromSearch.spotifyId || '').trim() !== '' &&
    String(fromSearch.title || '').trim() !== '' &&
    ['album', 'track'].includes(fromSearch.kind);

  const diaryIdRaw =
    diaryEntryId != null && String(diaryEntryId).trim() !== '' ? String(diaryEntryId).trim() : null;

  try {
    if (isFromSearchPayload) {
      const fs = fromSearch;
      if (fs.kind !== list.itemKind) {
        return res.status(400).json({
          message: `This list only accepts ${list.itemKind} entries; item is ${fs.kind}`,
        });
      }

      const sid = String(fs.spotifyId);
      const existsSp = list.items.some((it) => it.spotifyId && it.spotifyId === sid);
      if (existsSp) {
        return res.status(409).json({ message: 'This track or album is already in this list' });
      }

      list.items.push({
        spotifyId: sid,
        title: String(fs.title),
        image: fs.image || '',
        primaryArtistName: fs.primaryArtistName || '',
        albumName: fs.albumName || '',
        kind: fs.kind,
        addedAt: new Date(),
      });
    } else if (diaryIdRaw) {
      if (!mongoose.Types.ObjectId.isValid(diaryIdRaw)) {
        return res.status(400).json({ message: 'Invalid diaryEntryId' });
      }
      const entry = await DiaryEntry.findById(diaryIdRaw);
      if (!entry) return res.status(404).json({ message: 'Diary entry not found' });
      if (entry.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Diary entry does not belong to user' });
      }
      if (entry.kind !== list.itemKind) {
        return res.status(400).json({
          message: `This list only accepts ${list.itemKind} entries; diary entry is ${entry.kind}`,
        });
      }

      const exists = list.items.some(
        (it) => it.diaryEntryId && it.diaryEntryId.toString() === diaryIdRaw
      );
      if (exists) {
        return res.status(409).json({ message: 'This diary entry is already in this list' });
      }

      list.items.push({
        diaryEntryId: entry._id,
        spotifyId: entry.spotifyId ? String(entry.spotifyId) : '',
        title: entry.title,
        image: entry.image || '',
        primaryArtistName: entry.primaryArtistName || '',
        albumName: entry.albumName || '',
        kind: entry.kind,
        addedAt: new Date(),
      });
    } else {
      return res.status(400).json({ message: 'Provide diaryEntryId or fromSearch with spotifyId, title, and kind' });
    }

    await list.save();
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add item', error: err.message });
  }
});

module.exports = router;
