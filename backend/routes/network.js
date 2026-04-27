const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const {
  acceptFriendRequest,
  buildFriendFeed,
  cancelFriendRequest,
  declineFriendRequest,
  listFriendsForUser,
  listRequestsForUser,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} = require('../services/networkService');

const router = express.Router();

function getActingUserAccount(req, res) {
  if (!req.userAccount) {
    res.status(401).json({ message: 'Authenticated user account not found' });
    return null;
  }

  return req.userAccount;
}

function handleNetworkError(res, error, fallbackMessage) {
  if (error?.status) {
    const response = { message: error.message || fallbackMessage };

    if (error.request) {
      response.request = error.request;
    }

    return res.status(error.status).json(response);
  }

  return res.status(500).json({ message: fallbackMessage });
}

router.get('/search', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const users = await searchUsers(currentUser, req.query.query || req.query.q || '', {
      limit: req.query.limit,
    });
    res.json({ users });
  } catch (error) {
    handleNetworkError(res, error, 'User search failed');
  }
});

router.get('/requests', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const requests = await listRequestsForUser(currentUser._id);
    res.json(requests);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to fetch friend requests');
  }
});

router.post('/requests', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const response = await sendFriendRequest(
      currentUser,
      req.body.targetUserId || req.body.userId || req.body.identifier || ''
    );
    res.status(201).json(response);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to send friend request');
  }
});

router.delete('/requests/:requestId', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const response = await cancelFriendRequest(currentUser, req.params.requestId);
    res.json(response);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to cancel friend request');
  }
});

router.post('/requests/:requestId/accept', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const response = await acceptFriendRequest(currentUser, req.params.requestId);
    res.json(response);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to accept friend request');
  }
});

router.post('/requests/:requestId/decline', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const response = await declineFriendRequest(currentUser, req.params.requestId);
    res.json(response);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to decline friend request');
  }
});

router.delete('/friends/:friendUserId', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const response = await removeFriend(currentUser, req.params.friendUserId);
    res.json(response);
  } catch (error) {
    handleNetworkError(res, error, 'Failed to remove friend');
  }
});

router.get('/friends', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const friends = await listFriendsForUser(currentUser._id);
    res.json({ friends });
  } catch (error) {
    handleNetworkError(res, error, 'Failed to fetch friends');
  }
});

router.get('/feed', requireAuth, async (req, res) => {
  const currentUser = getActingUserAccount(req, res);
  if (!currentUser) return;

  try {
    const items = await buildFriendFeed(currentUser._id, req.query.limit);
    res.json({ items });
  } catch (error) {
    handleNetworkError(res, error, 'Failed to fetch friend activity feed');
  }
});

module.exports = router;
