import { useCallback, useState } from 'react';
import { socialClient } from '../../lib/api';

export function useNetworkController(user) {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setFeed([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [friendList, requests, feedItems] = await Promise.all([
        socialClient.getFriends(),
        socialClient.getFriendRequests(),
        socialClient.getFriendsFeed(user.id),
      ]);
      setFriends(Array.isArray(friendList) ? friendList : []);
      setIncoming(Array.isArray(requests?.incoming) ? requests.incoming : []);
      setOutgoing(Array.isArray(requests?.outgoing) ? requests.outgoing : []);
      setFeed(Array.isArray(feedItems) ? feedItems : []);
    } catch (e) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setFeed([]);
      setError(e.message || 'Could not load network');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const runSearch = useCallback(
    async (rawQuery) => {
      const q = String(rawQuery || '').trim();
      setSearchQuery(q);
      if (!q) {
        setSearchResults([]);
        setSearchError('');
        return;
      }
      if (!user?.id) return;
      setSearchLoading(true);
      setSearchError('');
      try {
        const users = await socialClient.searchUsers(q);
        setSearchResults(Array.isArray(users) ? users : []);
      } catch (e) {
        setSearchResults([]);
        setSearchError(e.message || 'Search failed');
      } finally {
        setSearchLoading(false);
      }
    },
    [user?.id]
  );

  const withBusy = async (key, fn) => {
    setBusyKey(key);
    setError('');
    try {
      await fn();
      await refresh();
      if (searchQuery) {
        await runSearch(searchQuery);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusyKey('');
    }
  };

  return {
    friends,
    incoming,
    outgoing,
    feed,
    loading,
    error,
    setError,
    searchQuery,
    searchResults,
    searchLoading,
    searchError,
    busyKey,
    refresh,
    runSearch,
    acceptIncoming: (requestId) =>
      withBusy(`accept:${requestId}`, () => socialClient.acceptFriendRequest(requestId)),
    declineIncoming: (requestId) =>
      withBusy(`decline:${requestId}`, () => socialClient.declineFriendRequest(requestId)),
    cancelOutgoing: (requestId) =>
      withBusy(`cancel:${requestId}`, () => socialClient.cancelOutgoingFriendRequest(requestId)),
    removeFriend: (friendUserId) =>
      withBusy(`remove:${friendUserId}`, () => socialClient.removeFriend(friendUserId)),
    sendRequest: (targetUserId) =>
      withBusy(`add:${targetUserId}`, () => socialClient.sendFriendRequest(targetUserId)),
  };
}
