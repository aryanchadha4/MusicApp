import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { socialClient } from './lib/api';

const Following = ({ user }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));

  useEffect(() => {
    let cancelled = false;

    async function loadFriends() {
      if (!user?.id) {
        setFriends([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const nextFriends = await socialClient.getFriends();
        if (!cancelled) {
          setFriends(Array.isArray(nextFriends) ? nextFriends : []);
        }
      } catch (_error) {
        if (!cancelled) {
          setFriends([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFriends();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="card" style={{ maxWidth: 500, margin: '2em auto' }}>
      <Link to="/profile">&larr; Back to Profile</Link>
      <h2 style={{ color: '#a084ee' }}>Friends</h2>
      {loading ? <div>Loading...</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {friends.length === 0 && <li style={{ color: '#aaa' }}>No friends yet</li>}
          {friends.map(f => (
            <li key={f._id} style={{ color: '#7fd7ff', fontSize: 17, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link to={`/user/${f._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#7fd7ff', textDecoration: 'none' }}>
                <img src={f.profilePic || '/default-avatar.jpeg'} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #7fd7ff', background: '#181a20' }} onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.jpeg'; }} />
                {f.name || f.username}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Following;
