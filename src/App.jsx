import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Search from './Search';
import Diary from './Diary';
import Lists from './Lists';
import Login from './Login';
import { useState, useEffect } from 'react';
import './App.css';
import API_BASE_URL, { AUTH_DISABLED, DEV_USER_EMAIL } from './config';

function App() {
  const [user, setUser] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);

  useEffect(() => {
    if (!AUTH_DISABLED) return;

    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/profile?email=${encodeURIComponent(DEV_USER_EMAIL)}`
        );
        const data = await res.json();
        if (data.message) {
          console.warn('[AUTH_DISABLED] Profile error:', data.message);
          setUser(null);
          setProfileInfo(null);
          return;
        }
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
        });
        setProfileInfo(data);
      } catch (e) {
        console.error('[AUTH_DISABLED] Failed to load profile', e);
        setUser(null);
        setProfileInfo(null);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED || !user?.email) return;
    fetch(`${API_BASE_URL}/api/auth/profile?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => setProfileInfo(data));
  }, [user]);

  const handleLogout = () => {
    if (AUTH_DISABLED) return;
    setUser(null);
    setProfileInfo(null);
    window.location.href = '/';
  };

  const handleDiaryEntrySave = async (entry) => {
    if (!user?.id) throw new Error('Not signed in');
    const res = await fetch(`${API_BASE_URL}/api/diary/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...entry }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save diary entry');
    return data;
  };

  const showApp = AUTH_DISABLED ? user && profileInfo : user;

  const devSetup = (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <p>
        <strong>Dev mode:</strong> start the API and MongoDB. Set <code>VITE_API_BASE_URL</code> in{' '}
        <code>.env</code> if the API is not at <code>http://localhost:5001</code>. A generic dev account is
        created on first profile request.
      </p>
    </div>
  );

  return (
    <Router>
      <div>
        <h1>Listen diary</h1>
        {showApp && (
          <nav>
            <div className="nav-main">
              <Link to="/diary">Diary</Link>
              <Link to="/search">Search</Link>
              <Link to="/lists">Lists</Link>
            </div>
            {!AUTH_DISABLED && (
              <div className="nav-secondary">
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    color: 'var(--color-danger)',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        )}
        <Routes>
          {showApp && <Route path="/diary" element={<Diary user={user} />} />}
          {showApp && (
            <Route
              path="/search"
              element={
                <Search user={user} onDiaryEntrySave={handleDiaryEntrySave} setProfileInfo={setProfileInfo} />
              }
            />
          )}
          {showApp && <Route path="/lists" element={<Lists user={user} />} />}
          {!AUTH_DISABLED && <Route path="/login" element={<Login onLogin={setUser} />} />}
          <Route
            path="/"
            element={
              AUTH_DISABLED ? (
                showApp ? (
                  <Navigate to="/diary" replace />
                ) : (
                  devSetup
                )
              ) : user ? (
                <Navigate to="/diary" replace />
              ) : (
                <Login onLogin={setUser} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
