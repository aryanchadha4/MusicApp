import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from './config';

const fetchSpotifySuggestions = async (type, query) => {
  if (!query) return [];
  const resp = await fetch(`${API_BASE_URL}/api/diary/search?query=${encodeURIComponent(query)}&type=${type}`);
  const data = await resp.json();
  if (type === 'artist' && data.artists && data.artists.items) {
    return data.artists.items;
  }
  if (type === 'track' && data.tracks && data.tracks.items) {
    return data.tracks.items;
  }
  return [];
};

const EditProfile = ({ profileInfo, setProfileInfo }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(profileInfo?.name || '');
  const [artists, setArtists] = useState(
    Array.isArray(profileInfo?.favoriteArtists) && typeof profileInfo.favoriteArtists[0] === 'object'
      ? profileInfo.favoriteArtists
      : (profileInfo?.favoriteArtists || ['', '', '', '', '']).map(name => ({ name, id: '' }))
  );
  const [songs, setSongs] = useState(
    Array.isArray(profileInfo?.favoriteSongs) && typeof profileInfo.favoriteSongs[0] === 'object'
      ? profileInfo.favoriteSongs
      : (profileInfo?.favoriteSongs || ['', '', '', '', '']).map(title => ({ title, artist: '', artistId: '' }))
  );
  const [artistSuggestions, setArtistSuggestions] = useState([[], [], [], [], []]);
  const [songSuggestions, setSongSuggestions] = useState([[], [], [], [], []]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(profileInfo?.profilePic || '');
  const [profilePicPreview, setProfilePicPreview] = useState(profileInfo?.profilePic || '/default-avatar.jpeg');
  const [profilePicError, setProfilePicError] = useState('');
  // Add state for modal visibility and credential fields
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const handleArtistChange = async (idx, value) => {
    const updated = [...artists];
    updated[idx] = { name: value, id: '' };
    setArtists(updated);
    // Fetch suggestions
    if (value.trim()) {
      const suggestions = await fetchSpotifySuggestions('artist', value);
      setArtistSuggestions(sugs => sugs.map((s, i) => (i === idx ? suggestions : s)));
    } else {
      setArtistSuggestions(sugs => sugs.map((s, i) => (i === idx ? [] : s)));
    }
  };
  const handleArtistSuggestion = (idx, suggestion) => {
    const updated = [...artists];
    updated[idx] = { name: suggestion.name, id: suggestion.id };
    setArtists(updated);
    setArtistSuggestions(sugs => sugs.map((s, i) => (i === idx ? [] : s)));
  };
  const handleSongTitleChange = async (idx, value) => {
    const updated = [...songs];
    updated[idx] = { ...updated[idx], title: value };
    setSongs(updated);
    // Fetch suggestions
    if (value.trim()) {
      const suggestions = await fetchSpotifySuggestions('track', value + ' ' + (updated[idx].artist || ''));
      setSongSuggestions(sugs => sugs.map((s, i) => (i === idx ? suggestions : s)));
    } else {
      setSongSuggestions(sugs => sugs.map((s, i) => (i === idx ? [] : s)));
    }
  };
  const handleSongArtistChange = async (idx, value) => {
    const updated = [...songs];
    updated[idx] = { ...updated[idx], artist: value };
    setSongs(updated);
    // Fetch suggestions
    if (updated[idx].title.trim()) {
      const suggestions = await fetchSpotifySuggestions('track', updated[idx].title + ' ' + value);
      setSongSuggestions(sugs => sugs.map((s, i) => (i === idx ? suggestions : s)));
    } else {
      setSongSuggestions(sugs => sugs.map((s, i) => (i === idx ? [] : s)));
    }
  };
  const handleSongSuggestion = (idx, suggestion) => {
    const updated = [...songs];
    updated[idx] = {
      title: suggestion.name,
      artist: suggestion.artists[0]?.name || '',
      artistId: suggestion.artists[0]?.id || ''
    };
    setSongs(updated);
    setSongSuggestions(sugs => sugs.map((s, i) => (i === idx ? [] : s)));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setProfilePicError('Image is too large (max 2MB). Please choose a smaller file.');
        return;
      } else {
        setProfilePicError('');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize/compress image to max 400x400px
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // compress to jpeg
          setProfilePic(dataUrl);
          setProfilePicPreview(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (artists.some(a => !a.name.trim()) || songs.some(s => !s.title.trim() || !s.artist.trim())) {
      setError('Please fill in all favorite artists and songs (with artist).');
      return;
    }
    setLoading(true);
    try {
      // PATCH to backend (assume user email is unique identifier)
      const res = await fetch(`${API_BASE_URL}/api/auth/edit-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileInfo.email,
          name,
          favoriteArtists: artists,
          favoriteSongs: songs,
          profilePic
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed');
        setLoading(false);
        return;
      }
      setSuccess('Profile updated!');
      // Fetch latest profile from backend
      const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile?email=${encodeURIComponent(profileInfo.email)}`);
      const profileData = await profileRes.json();
      setProfileInfo(profileData);
      setLoading(false);
    } catch (err) {
      setError('Update failed');
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 500, margin: '2em auto' }}>
      <button onClick={() => navigate('/profile')} style={{ marginBottom: 16 }}>&larr; Back</button>
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ marginBottom: '1em', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ marginBottom: 8 }}>Profile Picture:<br />
            <img src={profilePicPreview} alt="Profile Preview" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px solid #7fd7ff', marginBottom: 8, background: '#181a20' }} />
            <input type="file" accept="image/*" onChange={handleProfilePicChange} style={{ marginTop: 8 }} />
          </label>
          {profilePicError && <div style={{ color: '#ff7f7f', marginBottom: 8 }}>{profilePicError}</div>}
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>Name:<br />
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </label>
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>5 Favorite Artists:</label>
          {artists.map((artist, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <input
                type="text"
                value={artist.name}
                onChange={e => handleArtistChange(idx, e.target.value)}
                placeholder={`Artist #${idx + 1}`}
                style={{ marginBottom: 6, width: '90%' }}
                autoComplete="off"
              />
              {artistSuggestions[idx] && artistSuggestions[idx].length > 0 && (
                <ul style={{ position: 'absolute', left: 0, top: 36, background: '#23263a', color: '#fff', border: '1px solid #7fd7ff', borderRadius: 8, zIndex: 10, width: '90%', maxHeight: 120, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
                  {artistSuggestions[idx].map(sug => (
                    <li key={sug.id} style={{ padding: 6, cursor: 'pointer' }} onClick={() => handleArtistSuggestion(idx, sug)}>
                      {sug.images && sug.images[0] && <img src={sug.images[0].url} alt={sug.name} style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }} />}
                      {sug.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>5 Favorite Songs (with Artist):</label>
          {songs.map((song, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, position: 'relative' }}>
              <input
                type="text"
                value={song.title}
                onChange={e => handleSongTitleChange(idx, e.target.value)}
                placeholder={`Song #${idx + 1}`}
                style={{ width: '55%' }}
                autoComplete="off"
              />
              <input
                type="text"
                value={song.artist}
                onChange={e => handleSongArtistChange(idx, e.target.value)}
                placeholder="Artist"
                style={{ width: '35%' }}
                autoComplete="off"
              />
              {songSuggestions[idx] && songSuggestions[idx].length > 0 && (
                <ul style={{ position: 'absolute', left: 0, top: 36, background: '#23263a', color: '#fff', border: '1px solid #7fd7ff', borderRadius: 8, zIndex: 10, width: '90%', maxHeight: 120, overflowY: 'auto', listStyle: 'none', margin: 0, padding: 0 }}>
                  {songSuggestions[idx].map(sug => (
                    <li key={sug.id} style={{ padding: 6, cursor: 'pointer' }} onClick={() => handleSongSuggestion(idx, sug)}>
                      {sug.album && sug.album.images && sug.album.images[0] && <img src={sug.album.images[0].url} alt={sug.name} style={{ width: 24, height: 24, borderRadius: 8, marginRight: 8, verticalAlign: 'middle' }} />}
                      {sug.name} <span style={{ color: '#aaa', fontSize: 13 }}>by {sug.artists[0]?.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        {error && <div style={{ color: '#ff7f7f', marginBottom: '1em' }}>{error}</div>}
        {success && <div style={{ color: '#7fd7ff', marginBottom: '1em' }}>{success}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        <button onClick={() => setShowChangeModal(true)} style={{ marginTop: 16, background: '#35384d', color: '#7fd7ff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Change Password / Email</button>
      </form>
      {showChangeModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#23263a', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0006', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ color: '#a084ee', marginBottom: 8 }}>Change Password / Email</h3>
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #35384d', background: '#181a20', color: '#fff' }} />
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #35384d', background: '#181a20', color: '#fff' }} />
            <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #35384d', background: '#181a20', color: '#fff' }} />
            <input type="email" placeholder="New Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ padding: 8, borderRadius: 6, border: '1px solid #35384d', background: '#181a20', color: '#fff' }} />
            {changeError && <div style={{ color: '#ff7f7f', fontSize: 14 }}>{changeError}</div>}
            {changeSuccess && <div style={{ color: '#7fd7ff', fontSize: 14 }}>{changeSuccess}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={async () => {
                setChangeError(''); setChangeSuccess('');
                if (!currentPassword) { setChangeError('Enter current password.'); return; }
                if (newPassword && newPassword !== confirmPassword) { setChangeError('Passwords do not match.'); return; }
                if (!newPassword && !newEmail) { setChangeError('Enter a new password or email.'); return; }
                // Send PATCH request
                const resp = await fetch(`${API_BASE_URL}/api/auth/change-credentials`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: profileInfo.email, currentPassword, newPassword, newEmail })
                });
                const data = await resp.json();
                if (!resp.ok) { setChangeError(data.message || 'Update failed.'); return; }
                setChangeSuccess('Credentials updated successfully!');
              }} style={{ background: 'linear-gradient(90deg, #7fd7ff 0%, #a084ee 100%)', color: '#181a20', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Save Changes</button>
              <button onClick={() => { setShowChangeModal(false); setChangeError(''); setChangeSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNewEmail(''); }} style={{ background: '#35384d', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile; 