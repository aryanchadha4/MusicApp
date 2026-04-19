import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Diary from './Diary';
import Lists from './Lists';
import Login from './Login';
import Signup from './Signup';
import { useState, useEffect } from 'react';
import './App.css';
import API_BASE_URL, { AUTH_DISABLED, DEV_USER_EMAIL } from './config';

const AUTH_TOKEN_STORAGE_KEY = 'music_diary_token';

/** Drop focus from nav links after navigation so :focus doesn’t look like a “selected” tab (desktop Chrome). */
function NavRouteBlur() {
  const { pathname } = useLocation();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = document.activeElement;
      if (el && typeof el.closest === 'function' && el.closest('nav')) {
        el.blur();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (AUTH_DISABLED) {
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
        return;
      }

      const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!token) {
        setUser(null);
        setProfileInfo(null);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const profile = await response.json().catch(() => ({}));
        if (profile?.message) {
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setUser(null);
          setProfileInfo(null);
          return;
        }
        setUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
        });
        setProfileInfo(profile);
      } catch (e) {
        window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        setUser(null);
        setProfileInfo(null);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (AUTH_DISABLED || !user?.email || profileInfo?.email === user.email) return;
    fetch(`${API_BASE_URL}/api/auth/profile?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => setProfileInfo(data));
  }, [user, profileInfo?.email]);

  const handleLogin = (authPayload) => {
    const nextUser = authPayload?.user;
    const token = authPayload?.token;
    if (!nextUser || !token) return;
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    setUser(nextUser);
    setProfileInfo(null);
  };

  const handleLogout = () => {
    if (AUTH_DISABLED) return;
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
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
      <NavRouteBlur />
      <div className="app-shell">
        <h1>Music Diary</h1>
        {showApp && !AUTH_DISABLED && (
          <button type="button" className="app-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
        {showApp && (
          <nav>
            <div className="nav-main">
              <Link to="/diary" className="nav-main__link">
                Diary
              </Link>
              <Link to="/lists" className="nav-main__link">
                Lists
              </Link>
            </div>
          </nav>
        )}
        <Routes>
          {showApp && (
            <Route
              path="/diary"
              element={<Diary user={user} onDiaryEntrySave={handleDiaryEntrySave} setProfileInfo={setProfileInfo} />}
            />
          )}
          {showApp && <Route path="/lists" element={<Lists user={user} />} />}
          {!AUTH_DISABLED && (
            <Route
              path="/login"
              element={user ? <Navigate to="/diary" replace /> : <Login onLogin={handleLogin} />}
            />
          )}
          {!AUTH_DISABLED && (
            <Route
              path="/signup"
              element={user ? <Navigate to="/diary" replace /> : <Signup />}
            />
          )}
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
                <Login onLogin={handleLogin} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
