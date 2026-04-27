const mongoose = require('mongoose');
const ActivityEvent = require('../models/ActivityEvent');
const DiaryEntry = require('../models/DiaryEntry');
const FriendRequest = require('../models/FriendRequest');
const Friendship = require('../models/Friendship');
const MusicEntry = require('../models/MusicEntry');
const UserAccount = require('../models/UserAccount');
const { normalizeObjectIdPair } = require('../models/schemaUtils');
const {
  findUserAccountByIdentifier,
  searchUserAccountsByQuery,
} = require('./accountService');

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(String(value || ''))) return null;
  return new mongoose.Types.ObjectId(String(value));
}

function uniqueIds(values) {
  return [...new Set(values.map((value) => String(value || '')).filter(Boolean))];
}

function createHttpError(status, message, extra = {}) {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
}

function clampLimit(value, fallback = 20, max = 100) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(Math.max(Math.trunc(numericValue), 1), max);
}

function buildUserSummary(account, relationship = null) {
  return {
    id: account.id || account._id?.toString(),
    legacyUserId:
      account.legacyUserId?.toString?.() || String(account.legacyUserId || ''),
    username: account.username || '',
    displayName:
      account.displayName || account.name || account.username || account.email || 'Listener',
    email: account.email || '',
    avatarUrl: account.avatarUrl || account.profilePic || '',
    relationship,
  };
}

function buildFriendRequestSummary(request, counterpart, direction) {
  return {
    id: request.id || request._id?.toString(),
    fromUserId: request.fromUserId?.toString?.() || String(request.fromUserId || ''),
    toUserId: request.toUserId?.toString?.() || String(request.toUserId || ''),
    status: request.status,
    respondedAt: request.respondedAt || null,
    createdAt: request.createdAt || null,
    updatedAt: request.updatedAt || null,
    direction,
    user: counterpart ? buildUserSummary(counterpart) : null,
  };
}

function buildRelationshipStatus({ friendship, incomingRequest, outgoingRequest }) {
  if (friendship) {
    return {
      status: 'friend',
      friendshipId: friendship.id || friendship._id?.toString(),
      since: friendship.createdAt || null,
    };
  }
  if (incomingRequest) {
    return {
      status: 'incoming_request',
      requestId: incomingRequest.id || incomingRequest._id?.toString(),
      createdAt: incomingRequest.createdAt || null,
    };
  }
  if (outgoingRequest) {
    return {
      status: 'outgoing_request',
      requestId: outgoingRequest.id || outgoingRequest._id?.toString(),
      createdAt: outgoingRequest.createdAt || null,
    };
  }
  return { status: 'none' };
}

function buildActorSummary(actor) {
  if (!actor) return null;
  return buildUserSummary(actor, { status: 'friend' });
}

function buildFeedSubject(entry) {
  const subject = entry?.subjectId;
  if (!subject) return null;

  if (entry.subjectType === 'track') {
    const album = subject.albumId || null;
    const primaryArtist = subject.primaryArtistId || album?.primaryArtistId || null;

    return {
      id: subject.id || subject._id?.toString(),
      type: 'track',
      spotifyId: subject.spotifyId || '',
      title: subject.title || '',
      name: subject.name || subject.title || '',
      coverImageUrl: album?.coverImageUrl || '',
      imageUrl: album?.coverImageUrl || '',
      primaryArtistName: primaryArtist?.name || '',
      primaryArtistId: primaryArtist?.id || primaryArtist?._id?.toString() || '',
      albumId: album?.id || album?._id?.toString() || '',
      albumTitle: album?.title || '',
    };
  }

  const primaryArtist = subject.primaryArtistId || null;
  return {
    id: subject.id || subject._id?.toString(),
    type: 'album',
    spotifyId: subject.spotifyId || '',
    title: subject.title || '',
    name: subject.name || subject.title || '',
    coverImageUrl: subject.coverImageUrl || '',
    imageUrl: subject.coverImageUrl || '',
    primaryArtistName: primaryArtist?.name || '',
    primaryArtistId: primaryArtist?.id || primaryArtist?._id?.toString() || '',
  };
}

function buildFeedItem({ id, occurredAt, actor, entry, type }) {
  const actorSummary = buildActorSummary(actor);
  const subject = buildFeedSubject(entry);
  if (!actorSummary || !subject) return null;

  return {
    id,
    type,
    occurredAt: occurredAt || entry.loggedAt || entry.createdAt || null,
    actor: actorSummary,
    entry: {
      id: entry.id || entry._id?.toString(),
      subjectType: entry.subjectType,
      rating: entry.rating,
      reviewText: entry.reviewText || '',
      notes: entry.notes || '',
      visibility: entry.visibility || 'friends',
      loggedAt: entry.loggedAt || entry.createdAt || null,
      subject,
    },
  };
}

function buildLegacyFeedItem(entry, actor) {
  const actorSummary = buildActorSummary(actor);
  if (!actorSummary) return null;

  const subjectType = entry.kind === 'track' ? 'track' : 'album';
  return {
    id: `legacy-diary:${entry._id.toString()}`,
    type: 'music_entry_logged',
    occurredAt: entry.loggedAt || entry.createdAt || null,
    actor: actorSummary,
    entry: {
      id: `legacy-diary:${entry._id.toString()}`,
      subjectType,
      rating: entry.rating,
      reviewText: '',
      notes: entry.notes || '',
      visibility: 'friends',
      loggedAt: entry.loggedAt || entry.createdAt || null,
      subject: {
        id: entry.spotifyId || entry._id.toString(),
        type: subjectType,
        spotifyId: entry.spotifyId || '',
        title: entry.title || '',
        name: entry.title || '',
        coverImageUrl: entry.image || '',
        imageUrl: entry.image || '',
        primaryArtistName: entry.primaryArtistName || '',
        primaryArtistId: entry.primaryArtistId || '',
        albumId: entry.albumId || '',
        albumTitle: entry.albumName || '',
      },
    },
  };
}

function buildRequestResponse(request, targetUserId) {
  return {
    id: request._id.toString(),
    status: request.status,
    toUserId: String(targetUserId || request.toUserId),
    createdAt: request.createdAt || null,
  };
}

function buildRequestMutationResponse(request) {
  return {
    id: request._id.toString(),
    status: request.status,
    respondedAt: request.respondedAt || null,
  };
}

function buildFriendshipLookup(leftUserId, rightUserId) {
  const leftId = toObjectId(leftUserId);
  const rightId = toObjectId(rightUserId);
  if (!leftId || !rightId) return null;

  const [userAId, userBId] = normalizeObjectIdPair(leftId, rightId);
  return {
    userAId: new mongoose.Types.ObjectId(userAId),
    userBId: new mongoose.Types.ObjectId(userBId),
  };
}

async function getRelationshipState(currentUserId, targetUserIds) {
  const currentId = toObjectId(currentUserId);
  const targetIds = uniqueIds(targetUserIds).map(toObjectId).filter(Boolean);
  if (!currentId || targetIds.length === 0) return new Map();

  const [friendships, requests] = await Promise.all([
    Friendship.find({
      $or: [
        { userAId: currentId, userBId: { $in: targetIds } },
        { userBId: currentId, userAId: { $in: targetIds } },
      ],
    }).lean(),
    FriendRequest.find({
      status: 'pending',
      $or: [
        { fromUserId: currentId, toUserId: { $in: targetIds } },
        { toUserId: currentId, fromUserId: { $in: targetIds } },
      ],
    }).lean(),
  ]);

  const relationshipMap = new Map();
  targetIds.forEach((targetId) => {
    relationshipMap.set(String(targetId), {
      friendship: null,
      incomingRequest: null,
      outgoingRequest: null,
    });
  });

  friendships.forEach((friendship) => {
    const otherId =
      String(friendship.userAId) === String(currentId)
        ? String(friendship.userBId)
        : String(friendship.userAId);
    const state = relationshipMap.get(otherId);
    if (state) {
      state.friendship = friendship;
    }
  });

  requests.forEach((request) => {
    const isOutgoing = String(request.fromUserId) === String(currentId);
    const otherId = isOutgoing ? String(request.toUserId) : String(request.fromUserId);
    const state = relationshipMap.get(otherId);
    if (!state) return;
    if (isOutgoing) {
      state.outgoingRequest = request;
    } else {
      state.incomingRequest = request;
    }
  });

  return relationshipMap;
}

async function searchUsers(currentUser, query, options = {}) {
  const rawQuery = String(query || '').trim();
  if (!rawQuery) return [];

  const currentUserId = currentUser?._id || currentUser;
  const limit = clampLimit(options.limit, 20, 50);
  const accounts = await searchUserAccountsByQuery(rawQuery, {
    excludeAccountId: currentUserId,
    excludeLegacyUserId: currentUser?.legacyUserId || null,
    limit,
  });

  if (accounts.length === 0) return [];

  const relationshipMap = await getRelationshipState(
    currentUserId,
    accounts.map((account) => account._id)
  );

  return accounts.map((account) =>
    buildUserSummary(
      account,
      buildRelationshipStatus(relationshipMap.get(String(account._id)) || {})
    )
  );
}

async function findPendingRequestBetweenUsers(fromUserId, toUserId) {
  return FriendRequest.findOne({
    fromUserId,
    toUserId,
    status: 'pending',
  });
}

async function findFriendshipBetweenUsers(leftUserId, rightUserId) {
  const lookup = buildFriendshipLookup(leftUserId, rightUserId);
  if (!lookup) return null;
  return Friendship.findOne(lookup);
}

async function listFriendsForUser(userId) {
  const currentId = toObjectId(userId);
  if (!currentId) return [];

  const friendships = await Friendship.find({
    $or: [{ userAId: currentId }, { userBId: currentId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const friendIds = uniqueIds(
    friendships.map((friendship) =>
      String(friendship.userAId) === String(currentId) ? friendship.userBId : friendship.userAId
    )
  );

  if (friendIds.length === 0) return [];

  const accountIds = friendIds.map((friendId) => new mongoose.Types.ObjectId(friendId));
  const accounts = await UserAccount.find({ _id: { $in: accountIds } }).lean();
  const accountMap = new Map(accounts.map((account) => [String(account._id), account]));

  return friendships
    .map((friendship) => {
      const friendId =
        String(friendship.userAId) === String(currentId)
          ? String(friendship.userBId)
          : String(friendship.userAId);
      const account = accountMap.get(friendId);
      if (!account) return null;
      return buildUserSummary(account, {
        status: 'friend',
        friendshipId: friendship._id.toString(),
        since: friendship.createdAt || null,
      });
    })
    .filter(Boolean);
}

async function listRequestsForUser(userId) {
  const currentId = toObjectId(userId);
  if (!currentId) {
    return { incoming: [], outgoing: [] };
  }

  const requests = await FriendRequest.find({
    status: 'pending',
    $or: [{ fromUserId: currentId }, { toUserId: currentId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const counterpartIds = uniqueIds(
    requests.map((request) =>
      String(request.fromUserId) === String(currentId) ? request.toUserId : request.fromUserId
    )
  );
  const accounts = await UserAccount.find({
    _id: { $in: counterpartIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();
  const accountMap = new Map(accounts.map((account) => [String(account._id), account]));

  const incoming = [];
  const outgoing = [];

  requests.forEach((request) => {
    const isOutgoing = String(request.fromUserId) === String(currentId);
    const counterpartId = isOutgoing ? String(request.toUserId) : String(request.fromUserId);
    const summary = buildFriendRequestSummary(
      request,
      accountMap.get(counterpartId),
      isOutgoing ? 'outgoing' : 'incoming'
    );
    if (isOutgoing) {
      outgoing.push(summary);
    } else {
      incoming.push(summary);
    }
  });

  return { incoming, outgoing };
}

async function createActivityEvent(payload) {
  const event = new ActivityEvent(payload);
  await event.save();
  return event;
}

async function sendFriendRequest(currentUser, targetIdentifier) {
  const targetUser = await findUserAccountByIdentifier(targetIdentifier);
  if (!targetUser) {
    throw createHttpError(400, 'Valid targetUserId is required');
  }

  if (String(targetUser._id) === String(currentUser._id)) {
    throw createHttpError(400, 'You cannot send a friend request to yourself');
  }

  const [existingFriendship, outgoingRequest, incomingRequest] = await Promise.all([
    findFriendshipBetweenUsers(currentUser._id, targetUser._id),
    findPendingRequestBetweenUsers(currentUser._id, targetUser._id),
    findPendingRequestBetweenUsers(targetUser._id, currentUser._id),
  ]);

  if (existingFriendship) {
    throw createHttpError(409, 'You are already friends');
  }

  if (outgoingRequest) {
    throw createHttpError(409, 'Friend request already sent', {
      request: buildRequestResponse(outgoingRequest, outgoingRequest.toUserId),
    });
  }

  if (incomingRequest) {
    throw createHttpError(409, 'This user has already sent you a friend request', {
      request: {
        id: incomingRequest._id.toString(),
        status: incomingRequest.status,
        fromUserId: String(incomingRequest.fromUserId),
        createdAt: incomingRequest.createdAt || null,
      },
    });
  }

  const request = new FriendRequest({
    fromUserId: currentUser._id,
    toUserId: targetUser._id,
    status: 'pending',
  });

  try {
    await request.save();
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
    const existingRequest = await findPendingRequestBetweenUsers(currentUser._id, targetUser._id);
    throw createHttpError(409, 'Friend request already sent', {
      request: existingRequest ? buildRequestResponse(existingRequest, existingRequest.toUserId) : null,
    });
  }

  await createActivityEvent({
    actorUserId: currentUser._id,
    targetUserId: targetUser._id,
    type: 'friend_request_sent',
    subjectType: 'friend_request',
    subjectId: request._id,
    visibility: 'private',
    occurredAt: request.createdAt || new Date(),
    metadata: {
      fromUsername: currentUser.username || '',
      toUsername: targetUser.username || '',
    },
  });

  return {
    message: 'Friend request sent',
    request: buildRequestResponse(request, targetUser._id),
  };
}

async function cancelFriendRequest(currentUser, requestId) {
  const resolvedRequestId = toObjectId(requestId);
  if (!resolvedRequestId) {
    throw createHttpError(400, 'Valid requestId is required');
  }

  const request = await FriendRequest.findById(resolvedRequestId);
  if (!request || request.status !== 'pending') {
    throw createHttpError(404, 'Pending friend request not found');
  }
  if (String(request.fromUserId) !== String(currentUser._id)) {
    throw createHttpError(403, 'You can only cancel requests you sent');
  }

  request.status = 'cancelled';
  request.respondedAt = new Date();
  await request.save();

  return {
    message: 'Friend request cancelled',
    request: buildRequestMutationResponse(request),
  };
}

async function acceptFriendRequest(currentUser, requestId) {
  const resolvedRequestId = toObjectId(requestId);
  if (!resolvedRequestId) {
    throw createHttpError(400, 'Valid requestId is required');
  }

  const request = await FriendRequest.findById(resolvedRequestId);
  if (!request || request.status !== 'pending') {
    throw createHttpError(404, 'Pending friend request not found');
  }
  if (String(request.toUserId) !== String(currentUser._id)) {
    throw createHttpError(403, 'You can only accept requests sent to you');
  }

  const lookup = buildFriendshipLookup(request.fromUserId, request.toUserId);
  let friendship = await Friendship.findOne(lookup);
  let createdFriendship = false;

  if (!friendship) {
    friendship = await Friendship.findOneAndUpdate(
      lookup,
      {
        $setOnInsert: {
          ...lookup,
          sourceRequestId: request._id,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    createdFriendship = true;
  }

  request.status = 'accepted';
  request.respondedAt = new Date();
  await request.save();

  await FriendRequest.updateMany(
    {
      _id: { $ne: request._id },
      status: 'pending',
      $or: [
        { fromUserId: request.fromUserId, toUserId: request.toUserId },
        { fromUserId: request.toUserId, toUserId: request.fromUserId },
      ],
    },
    {
      $set: {
        status: 'cancelled',
        respondedAt: request.respondedAt,
      },
    }
  );

  if (createdFriendship) {
    const existingFriendshipEvent = await ActivityEvent.findOne({
      type: 'friendship_created',
      subjectType: 'friendship',
      subjectId: friendship._id,
    }).lean();

    if (!existingFriendshipEvent) {
    await createActivityEvent({
      actorUserId: currentUser._id,
      targetUserId: request.fromUserId,
      type: 'friendship_created',
      subjectType: 'friendship',
      subjectId: friendship._id,
      visibility: 'friends',
      occurredAt: friendship.createdAt || new Date(),
      metadata: {
        requestId: request._id.toString(),
      },
    });
    }
  }

  return {
    message: 'Friend request accepted',
    friendship: {
      id: friendship._id.toString(),
      createdAt: friendship.createdAt || null,
    },
    request: buildRequestMutationResponse(request),
  };
}

async function declineFriendRequest(currentUser, requestId) {
  const resolvedRequestId = toObjectId(requestId);
  if (!resolvedRequestId) {
    throw createHttpError(400, 'Valid requestId is required');
  }

  const request = await FriendRequest.findById(resolvedRequestId);
  if (!request || request.status !== 'pending') {
    throw createHttpError(404, 'Pending friend request not found');
  }
  if (String(request.toUserId) !== String(currentUser._id)) {
    throw createHttpError(403, 'You can only decline requests sent to you');
  }

  request.status = 'declined';
  request.respondedAt = new Date();
  await request.save();

  return {
    message: 'Friend request declined',
    request: buildRequestMutationResponse(request),
  };
}

async function removeFriend(currentUser, friendIdentifier) {
  const friendAccount = await findUserAccountByIdentifier(friendIdentifier);
  if (!friendAccount) {
    throw createHttpError(400, 'Valid friendUserId is required');
  }

  const friendship = await findFriendshipBetweenUsers(currentUser._id, friendAccount._id);
  if (!friendship) {
    throw createHttpError(404, 'Friendship not found');
  }

  await Friendship.deleteOne({ _id: friendship._id });

  return {
    message: 'Friend removed',
  };
}

async function populateMusicEntries(query, limit) {
  return MusicEntry.find(query)
    .sort({ loggedAt: -1, createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'subjectId',
      populate: [
        { path: 'primaryArtistId' },
        {
          path: 'albumId',
          populate: [{ path: 'primaryArtistId' }],
        },
      ],
    })
    .lean();
}

async function buildFriendFeed(userId, limit = 40) {
  const cappedLimit = clampLimit(limit, 40, 100);
  const friends = await listFriendsForUser(userId);
  if (friends.length === 0) return [];

  const friendAccountIds = friends.map((friend) => toObjectId(friend.id)).filter(Boolean);
  const friendLegacyIds = uniqueIds(friends.map((friend) => friend.legacyUserId))
    .map(toObjectId)
    .filter(Boolean);

  const actorByAccountId = new Map(friends.map((friend) => [String(friend.id), friend]));
  const actorByLegacyId = new Map(
    friends
      .filter((friend) => friend.legacyUserId)
      .map((friend) => [String(friend.legacyUserId), friend])
  );

  const activityEvents = await ActivityEvent.find({
    actorUserId: { $in: friendAccountIds },
    musicEntryId: { $ne: null },
    type: { $in: ['music_entry_logged', 'music_entry_updated'] },
    visibility: { $in: ['friends', 'public'] },
  })
    .sort({ occurredAt: -1, createdAt: -1 })
    .limit(cappedLimit)
    .lean();

  const eventEntryIds = uniqueIds(activityEvents.map((event) => event.musicEntryId));
  const eventEntryObjectIds = eventEntryIds.map((entryId) => new mongoose.Types.ObjectId(entryId));

  const [eventEntries, fallbackEntries] = await Promise.all([
    eventEntryObjectIds.length > 0
      ? MusicEntry.find({
          _id: { $in: eventEntryObjectIds },
          deletedAt: null,
        })
          .populate({
            path: 'subjectId',
            populate: [
              { path: 'primaryArtistId' },
              {
                path: 'albumId',
                populate: [{ path: 'primaryArtistId' }],
              },
            ],
          })
          .lean()
      : [],
    populateMusicEntries(
      {
        userId: { $in: friendAccountIds },
        deletedAt: null,
        visibility: { $in: ['friends', 'public'] },
        ...(eventEntryObjectIds.length > 0 ? { _id: { $nin: eventEntryObjectIds } } : {}),
      },
      cappedLimit
    ),
  ]);

  const eventEntryMap = new Map(eventEntries.map((entry) => [String(entry._id), entry]));
  const representedLegacyDiaryIds = new Set(
    uniqueIds(
      [...eventEntries, ...fallbackEntries].map((entry) => entry.legacyDiaryEntryId).filter(Boolean)
    )
  );

  const feedItems = [];

  activityEvents.forEach((event) => {
    const actor = actorByAccountId.get(String(event.actorUserId));
    const entry = eventEntryMap.get(String(event.musicEntryId || ''));
    if (!actor || !entry) return;

    const item = buildFeedItem({
      id: event._id.toString(),
      occurredAt: event.occurredAt || event.createdAt || entry.loggedAt || null,
      actor,
      entry,
      type: event.type,
    });

    if (item) {
      feedItems.push(item);
    }
  });

  fallbackEntries.forEach((entry) => {
    const actor = actorByAccountId.get(String(entry.userId));
    if (!actor) return;

    const item = buildFeedItem({
      id: `music-entry:${entry._id.toString()}`,
      occurredAt: entry.loggedAt || entry.createdAt || null,
      actor,
      entry,
      type: 'music_entry_logged',
    });

    if (item) {
      feedItems.push(item);
    }
  });

  if (feedItems.length < cappedLimit && friendLegacyIds.length > 0) {
    const legacyEntries = await DiaryEntry.find({
      userId: { $in: friendLegacyIds },
      ...(
        representedLegacyDiaryIds.size > 0
          ? {
              _id: {
                $nin: [...representedLegacyDiaryIds].map(
                  (entryId) => new mongoose.Types.ObjectId(entryId)
                ),
              },
            }
          : {}
      ),
    })
      .sort({ loggedAt: -1, createdAt: -1 })
      .limit(cappedLimit)
      .lean();

    legacyEntries.forEach((entry) => {
      const actor = actorByLegacyId.get(String(entry.userId));
      if (!actor) return;
      const item = buildLegacyFeedItem(entry, actor);
      if (item) {
        feedItems.push(item);
      }
    });
  }

  return feedItems
    .sort((left, right) => {
      const leftTime = new Date(left.occurredAt || 0).getTime();
      const rightTime = new Date(right.occurredAt || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, cappedLimit);
}

module.exports = {
  acceptFriendRequest,
  buildFriendFeed,
  buildRelationshipStatus,
  buildUserSummary,
  cancelFriendRequest,
  createActivityEvent,
  declineFriendRequest,
  getRelationshipState,
  listFriendsForUser,
  listRequestsForUser,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  toObjectId,
};
