import { apiRequest } from './httpClient';

function mapUserSummary(user) {
  if (!user) return null;
  const accountId = user.id || user._id || '';
  const legacyUserId = user.legacyUserId || user.userId || accountId;
  return {
    _id: legacyUserId,
    id: accountId,
    legacyUserId,
    name: user.displayName || user.name || user.username || user.email || 'Listener',
    displayName: user.displayName || user.name || user.username || user.email || 'Listener',
    username: user.username || '',
    email: user.email || '',
    profilePic: user.avatarUrl || user.profilePic || '',
    avatarUrl: user.avatarUrl || user.profilePic || '',
    relationship: user.relationship || null,
  };
}

function mapRequestSummary(request) {
  if (!request) return null;
  return {
    id: request.id || request._id || '',
    status: request.status || 'pending',
    direction: request.direction || 'outgoing',
    createdAt: request.createdAt || null,
    respondedAt: request.respondedAt || null,
    user: mapUserSummary(request.user),
  };
}

function mapFeedItems(items = []) {
  return items.map((item) => {
    const actor = mapUserSummary(item.actor);
    const entry = item.entry || {};
    const subject = entry.subject || {};
    const albumLikeTitle = subject.title || subject.name || '';

    return {
      id: item.id || '',
      user: actor?.name || actor?.username || 'Listener',
      userId: actor?._id || '',
      profilePic: actor?.profilePic || '',
      album: albumLikeTitle,
      albumId: subject.id || '',
      artist: subject.primaryArtistName || '',
      artistId: subject.primaryArtistId || '',
      rating: entry.rating || 0,
      review: entry.reviewText || entry.notes || '',
      image: subject.coverImageUrl || subject.imageUrl || '',
      reviewedAt: item.occurredAt || entry.loggedAt || '',
      subjectType: entry.subjectType || subject.type || '',
      entryId: entry.id || '',
      subject,
      actor,
      raw: item,
    };
  });
}

function buildRelationshipState(friendIds, requests, targetUserId) {
  const targetId = String(targetUserId || '');
  if (!targetId) {
    return { status: 'none' };
  }

  if (friendIds.has(targetId)) {
    return { status: 'friend' };
  }

  const incoming = requests.incoming.find((request) => request.user?._id === targetId);
  if (incoming) {
    return {
      status: 'incoming_request',
      requestId: incoming.id,
      createdAt: incoming.createdAt,
    };
  }

  const outgoing = requests.outgoing.find((request) => request.user?._id === targetId);
  if (outgoing) {
    return {
      status: 'outgoing_request',
      requestId: outgoing.id,
      createdAt: outgoing.createdAt,
    };
  }

  return { status: 'none' };
}

async function getRelationshipState(targetUserId) {
  const [friends, requests] = await Promise.all([
    socialClient.getFriends(),
    socialClient.getFriendRequests(),
  ]);

  const friendIds = new Set((friends || []).map((friend) => String(friend._id || friend.id || '')));
  return buildRelationshipState(friendIds, requests, targetUserId);
}

export const socialClient = {
  async searchUsers(query) {
    const response = await apiRequest('/api/network/search', {
      query: { query },
      auth: true,
    });
    return Array.isArray(response?.users) ? response.users.map(mapUserSummary) : [];
  },

  async getFriendRequests() {
    const response = await apiRequest('/api/network/requests', {
      auth: true,
    });

    return {
      incoming: Array.isArray(response?.incoming) ? response.incoming.map(mapRequestSummary) : [],
      outgoing: Array.isArray(response?.outgoing) ? response.outgoing.map(mapRequestSummary) : [],
    };
  },

  async getFriends() {
    const response = await apiRequest('/api/network/friends', {
      auth: true,
    });
    return Array.isArray(response?.friends) ? response.friends.map(mapUserSummary) : [];
  },

  getRelationshipState,

  async followUser(_userIdOrFollowId, maybeFollowId) {
    const targetUserId = maybeFollowId || _userIdOrFollowId;
    const relationship = await getRelationshipState(targetUserId);

    if (relationship.status === 'friend' || relationship.status === 'outgoing_request') {
      return relationship;
    }

    if (relationship.status === 'incoming_request' && relationship.requestId) {
      const response = await apiRequest(`/api/network/requests/${relationship.requestId}/accept`, {
        method: 'POST',
        auth: true,
      });
      return {
        status: 'friend',
        friendshipId: response?.friendship?.id || '',
      };
    }

    const response = await apiRequest('/api/network/requests', {
      method: 'POST',
      body: { targetUserId },
      auth: true,
    });

    return {
      status: 'outgoing_request',
      requestId: response?.request?.id || '',
    };
  },

  async unfollowUser(_userIdOrUnfollowId, maybeUnfollowId) {
    const targetUserId = maybeUnfollowId || _userIdOrUnfollowId;
    const relationship = await getRelationshipState(targetUserId);

    if (relationship.status === 'friend') {
      await apiRequest(`/api/network/friends/${targetUserId}`, {
        method: 'DELETE',
        auth: true,
      });
      return { status: 'none' };
    }

    if (relationship.status === 'outgoing_request' && relationship.requestId) {
      await apiRequest(`/api/network/requests/${relationship.requestId}`, {
        method: 'DELETE',
        auth: true,
      });
      return { status: 'none' };
    }

    if (relationship.status === 'incoming_request' && relationship.requestId) {
      await apiRequest(`/api/network/requests/${relationship.requestId}/decline`, {
        method: 'POST',
        auth: true,
      });
      return { status: 'none' };
    }

    return { status: 'none' };
  },

  async getFriendsFeed(_userId) {
    const response = await apiRequest('/api/network/feed', {
      auth: true,
    });
    return mapFeedItems(response?.items || []);
  },

  async sendFriendRequest(targetUserId) {
    return apiRequest('/api/network/requests', {
      method: 'POST',
      body: { targetUserId },
      auth: true,
    });
  },

  async acceptFriendRequest(requestId) {
    return apiRequest(`/api/network/requests/${requestId}/accept`, {
      method: 'POST',
      auth: true,
    });
  },

  async declineFriendRequest(requestId) {
    return apiRequest(`/api/network/requests/${requestId}/decline`, {
      method: 'POST',
      auth: true,
    });
  },

  async cancelOutgoingFriendRequest(requestId) {
    return apiRequest(`/api/network/requests/${requestId}`, {
      method: 'DELETE',
      auth: true,
    });
  },

  async removeFriend(friendUserId) {
    return apiRequest(`/api/network/friends/${friendUserId}`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
