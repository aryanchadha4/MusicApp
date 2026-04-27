import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StackScreen } from './lib/platform/web/app';
import { socialClient } from './lib/api';
import { buildUserPath } from './lib/navigation/appTabs';

export default function FriendsDirectory({ user, section = 'profile', backTo = '/profile' }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadFriends = async () => {
      if (!user?.id) {
        setFriends([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const nextFriends = await socialClient.getFriends();
        if (!cancelled) {
          setFriends(Array.isArray(nextFriends) ? nextFriends : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setFriends([]);
          setError(loadError.message || 'Could not load friends.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFriends();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <StackScreen
      backTo={backTo}
      eyebrow="People"
      title="Friends"
      subtitle="A simple list view that works like a native stack screen and keeps people management inside the profile section."
    >
      <section className="mobile-section-card">
        {loading ? <p className="mobile-section-empty">Loading friends…</p> : null}
        {error ? <p className="mobile-section-error">{error}</p> : null}
        {!loading && !error && friends.length === 0 ? (
          <p className="mobile-section-empty">No friends yet.</p>
        ) : null}
        {!loading && !error && friends.length > 0 ? (
          <div className="mobile-section-list">
            {friends.map((friend) => (
              <Link
                key={friend._id || friend.id}
                to={buildUserPath(section, friend._id || friend.id)}
                className="mobile-list-row mobile-list-row--interactive"
              >
                {friend.profilePic ? <img src={friend.profilePic} alt="" className="mobile-list-row__avatar" /> : null}
                <div className="mobile-list-row__body">
                  <span className="mobile-list-row__title">{friend.name || friend.username}</span>
                  <span className="mobile-list-row__subtitle">{friend.username || 'Friend'}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </StackScreen>
  );
}
