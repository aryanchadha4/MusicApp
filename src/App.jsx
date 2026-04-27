import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './Home';
import Search from './Search';
import Activity from './Activity';
import Diary from './Diary';
import Lists from './Lists';
import Network from './Network';
import ProfileHome from './ProfileHome';
import FriendsDirectory from './FriendsDirectory';
import AlbumPage from './AlbumPage';
import ArtistPage from './ArtistPage';
import PublicProfile from './PublicProfile';
import MyReviews from './MyReviews';
import EditProfile from './EditProfile';
import Login from './Login';
import Signup from './Signup';
import { Spinner } from './lib/platform/web/ui';
import { diaryClient } from './lib/api';
import { useSessionBootstrap } from './hooks/useSessionBootstrap';
import { AppChrome } from './lib/platform/web/app';
import { usePersistentWebAppShell } from './hooks/usePersistentWebAppShell';
import { APP_TABS, buildUserPath, normalizeSectionKey } from './lib/navigation/appTabs';
import { getStoredWebAppShellStateSync } from './lib/platform/web/appStateStorageAdapter';
import './App.css';
import { AUTH_DISABLED } from './config';

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

const APP_TAB_KEYS = new Set(APP_TABS.map((tab) => tab.key));

function resolveSection(section) {
  return APP_TAB_KEYS.has(section) ? section : null;
}

function SectionAlbumRoute() {
  const { section } = useParams();
  const resolvedSection = resolveSection(section);
  return resolvedSection ? <AlbumPage section={resolvedSection} /> : <Navigate to="/home" replace />;
}

function SectionArtistRoute({ onAlbumRated }) {
  const { section } = useParams();
  const resolvedSection = resolveSection(section);
  return resolvedSection ? <ArtistPage section={resolvedSection} onAlbumRated={onAlbumRated} /> : <Navigate to="/home" replace />;
}

function SectionPublicProfileRoute({ user, setProfileInfo }) {
  const { section } = useParams();
  const resolvedSection = resolveSection(section);
  return resolvedSection ? (
    <PublicProfile section={resolvedSection} user={user} setProfileInfo={setProfileInfo} />
  ) : (
    <Navigate to="/home" replace />
  );
}

function SectionPublicReviewsRoute({ user, profileInfo }) {
  const { section, id } = useParams();
  const resolvedSection = resolveSection(section);
  return resolvedSection ? (
    <MyReviews
      section={resolvedSection}
      backTo={buildUserPath(resolvedSection, id)}
      user={user}
      profileInfo={profileInfo}
      isPublic
    />
  ) : (
    <Navigate to="/home" replace />
  );
}

function LegacyUserRedirect() {
  const { id } = useParams();
  return <Navigate to={buildUserPath('network', id)} replace />;
}

function LegacyAlbumRedirect() {
  const { albumId } = useParams();
  return <Navigate to={`/search/album/${encodeURIComponent(albumId)}`} replace />;
}

function LegacyArtistRedirect() {
  const { id } = useParams();
  return <Navigate to={`/search/artist/${encodeURIComponent(id)}`} replace />;
}

function AppRouterShell({
  showApp,
  restoredAppPath,
  profileInfo,
  setProfileInfo,
  user,
  sessionLoading,
  handleLogin,
  handleLogout,
  handleDiaryEntrySave,
}) {
  const { activeTabKey, tabTargets } = usePersistentWebAppShell({ enabled: !!showApp });
  const loadingScreen = (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-fg-muted)' }}>
      <span className="ui-loading-inline">
        <Spinner size="sm" />
        Loading…
      </span>
    </div>
  );

  const devSetup = (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <p>
        <strong>Dev mode:</strong> start the API and MongoDB. Set <code>VITE_API_BASE_URL</code> in <code>.env</code>{' '}
        if the API is not at <code>http://localhost:5001</code>. A generic dev account is created on first profile
        request.
      </p>
    </div>
  );

  return (
    <>
      <NavRouteBlur />
      <AppChrome
        showTabs={!!showApp}
        showLogout={showApp && !AUTH_DISABLED}
        onLogout={handleLogout}
        activeTabKey={activeTabKey}
        tabTargets={tabTargets}
      >
        <Routes>
          {showApp && <Route path="/home" element={<Home user={user} profileInfo={profileInfo} />} />}
          {showApp && <Route path="/search" element={<Search />} />}
          {showApp && <Route path="/network" element={<Network user={user} />} />}
          {showApp && <Route path="/activity" element={<Activity profileInfo={profileInfo} />} />}
          {showApp && <Route path="/activity/diary" element={<Diary user={user} onDiaryEntrySave={handleDiaryEntrySave} />} />}
          {showApp && <Route path="/activity/lists" element={<Lists user={user} />} />}
          {showApp && <Route path="/profile" element={<ProfileHome profileInfo={profileInfo} onLogout={handleLogout} />} />}
          {showApp && (
            <Route
              path="/profile/edit"
              element={<EditProfile backTo="/profile" profileInfo={profileInfo} setProfileInfo={setProfileInfo} />}
            />
          )}
          {showApp && (
            <Route
              path="/profile/reviews"
              element={<MyReviews section="profile" backTo="/profile" user={user} profileInfo={profileInfo} />}
            />
          )}
          {showApp && <Route path="/profile/friends" element={<FriendsDirectory user={user} />} />}
          {showApp && <Route path="/:section/album/:albumId" element={<SectionAlbumRoute />} />}
          {showApp && <Route path="/:section/artist/:id" element={<SectionArtistRoute onAlbumRated={handleDiaryEntrySave} />} />}
          {showApp && (
            <Route path="/:section/users/:id" element={<SectionPublicProfileRoute user={user} setProfileInfo={setProfileInfo} />} />
          )}
          {showApp && (
            <Route
              path="/:section/users/:id/reviews"
              element={<SectionPublicReviewsRoute user={user} profileInfo={profileInfo} />}
            />
          )}
          {showApp && <Route path="/diary" element={<Navigate to="/activity/diary" replace />} />}
          {showApp && <Route path="/lists" element={<Navigate to="/activity/lists" replace />} />}
          {showApp && <Route path="/user/:id" element={<LegacyUserRedirect />} />}
          {showApp && <Route path="/album/:albumId" element={<LegacyAlbumRedirect />} />}
          {showApp && <Route path="/artist/:id" element={<LegacyArtistRedirect />} />}
          {showApp && <Route path="/my-reviews" element={<Navigate to="/profile/reviews" replace />} />}
          {showApp && <Route path="/edit-profile" element={<Navigate to="/profile/edit" replace />} />}
          {showApp && <Route path="/followers" element={<Navigate to="/profile/friends" replace />} />}
          {showApp && <Route path="/following" element={<Navigate to="/profile/friends" replace />} />}
          {!AUTH_DISABLED && (
            <Route
              path="/login"
              element={sessionLoading ? loadingScreen : user ? <Navigate to={restoredAppPath} replace /> : <Login onLogin={handleLogin} />}
            />
          )}
          {!AUTH_DISABLED && (
            <Route
              path="/signup"
              element={sessionLoading ? loadingScreen : user ? <Navigate to={restoredAppPath} replace /> : <Signup />}
            />
          )}
          <Route
            path="/"
            element={
              AUTH_DISABLED ? (
                showApp ? (
                  <Navigate to={restoredAppPath} replace />
                ) : (
                  devSetup
                )
              ) : user ? (
                <Navigate to={restoredAppPath} replace />
              ) : sessionLoading ? (
                loadingScreen
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          {showApp && <Route path="*" element={<Navigate to={`/${normalizeSectionKey('home')}`} replace />} />}
        </Routes>
      </AppChrome>
    </>
  );
}

function App() {
  const {
    user,
    profileInfo,
    setProfileInfo,
    loading: sessionLoading,
    login: handleLogin,
    logout: logoutSession,
  } = useSessionBootstrap();

  const handleLogout = async () => {
    if (AUTH_DISABLED) return;
    await logoutSession();
  };

  const handleDiaryEntrySave = async (entry) => {
    if (!user?.id) throw new Error('Not signed in');
    return diaryClient.createEntry({ userId: user.id, ...entry });
  };

  const showApp = AUTH_DISABLED ? user && profileInfo : user;
  const restoredAppPath = getStoredWebAppShellStateSync().lastPath || '/home';

  return (
    <Router>
      <AppRouterShell
        showApp={showApp}
        restoredAppPath={restoredAppPath}
        profileInfo={profileInfo}
        setProfileInfo={setProfileInfo}
        user={user}
        sessionLoading={sessionLoading}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        handleDiaryEntrySave={handleDiaryEntrySave}
      />
    </Router>
  );
}

export default App;
