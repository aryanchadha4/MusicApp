import { useCallback, useEffect, useState } from 'react';
import { socialClient, spotifyClient } from '../../lib/api';

export function useFeedData(userId) {
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [popularError, setPopularError] = useState('');
  const [popularLoading, setPopularLoading] = useState(false);
  const [friendFeed, setFriendFeed] = useState([]);
  const [friendFeedError, setFriendFeedError] = useState('');
  const [friendFeedLoading, setFriendFeedLoading] = useState(false);

  const loadFeed = useCallback(async () => {
    if (userId) {
      setFriendFeedLoading(true);
      try {
        const data = await socialClient.getFriendsFeed(userId);
        setFriendFeed(Array.isArray(data) ? data : []);
        setFriendFeedError('');
      } catch (err) {
        setFriendFeed([]);
        setFriendFeedError(err.message || 'Could not load friends feed.');
      } finally {
        setFriendFeedLoading(false);
      }
    } else {
      setFriendFeed([]);
      setFriendFeedError('');
    }

    try {
      setPopularLoading(true);
      const data = await spotifyClient.getTopAlbums();
      setPopularAlbums(Array.isArray(data) ? data : []);
      setPopularError('');
    } catch (err) {
      setPopularAlbums([]);
      setPopularError(err.message || 'Could not load popular albums. Please try again later.');
    } finally {
      setPopularLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    popularAlbums,
    popularError,
    popularLoading,
    friendFeed,
    friendFeedError,
    friendFeedLoading,
    reload: loadFeed,
  };
}
