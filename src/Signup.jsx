import React, { useState } from 'react';
import API_BASE_URL from './config';
import { Link } from 'react-router-dom';

const fetchSpotifySuggestions = async (type, query) => {
  if (!query) return [];
  const resp = await fetch(`${API_BASE_URL}/api/spotify/search?query=${encodeURIComponent(query)}&type=${type}`);
  const data = await resp.json();
  if (type === 'artist' && data.artists && data.artists.items) {
    return data.artists.items;
  }
  if (type === 'track' && data.tracks && data.tracks.items) {
    return data.tracks.items;
  }
  return [];
};

const Signup = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [artists, setArtists] = useState([
    { name: '', id: '' },
    { name: '', id: '' },
    { name: '', id: '' },
    { name: '', id: '' },
    { name: '', id: '' }
  ]);
  const [artistSuggestions, setArtistSuggestions] = useState([[], [], [], [], []]);
  const [songs, setSongs] = useState([
    { title: '', artist: '', artistId: '' },
    { title: '', artist: '', artistId: '' },
    { title: '', artist: '', artistId: '' },
    { title: '', artist: '', artistId: '' },
    { title: '', artist: '', artistId: '' }
  ]);
  const [songSuggestions, setSongSuggestions] = useState([[], [], [], [], []]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (artists.some(a => !a.name.trim()) || songs.some(s => !s.title.trim() || !s.artist.trim())) {
      setError('Please fill in all favorite artists and songs (with artist).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          favoriteArtists: artists,
          favoriteSongs: songs
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Signup failed');
        setLoading(false);
        return;
      }
      setSuccess('Signup successful!');
      setLoading(false);
      if (onSignup) {
        onSignup({ name, username, email, favoriteArtists: artists, favoriteSongs: songs });
      }
    } catch (err) {
      setError('Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 500, margin: '2em auto' }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1em' }}>
          <label>Name:<br />
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </label>
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>Username:<br />
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
          </label>
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>Email:<br />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          </label>
        </div>
        <div style={{ marginBottom: '1em' }}>
          <label>Password:<br />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
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
        <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        <div style={{ textAlign: 'center', marginTop: '1em' }}>
          <span style={{ color: '#aaa' }}>Already have an account? </span>
          <Link to="/login" style={{ color: '#7fd7ff', textDecoration: 'none' }}>Login</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;
