import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from './config';

const Following = ({ user }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user || !user.id) return;
      const res = await fetch(`${API_BASE_URL}/api/auth/profile?id=${user.id}`);
      const data = await res.json();
      setFollowing(data.following || []);
      setLoading(false);
    };
    fetchFollowing();
  }, [user]);

  return (
    <div className="card" style={{ maxWidth: 500, margin: '2em auto' }}>
      <Link to="/profile">&larr; Back to Profile</Link>
      <h2 style={{ color: '#a084ee' }}>Following</h2>
      {loading ? <div>Loading...</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {following.length === 0 && <li style={{ color: '#aaa' }}>Not following anyone</li>}
          {following.map(f => (
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