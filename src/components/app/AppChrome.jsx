import { NavLink, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { APP_TABS } from '../../lib/navigation/appTabs';
import { getRouteChrome } from '../../lib/navigation/routeChrome';

function AuthChromeHeader({ showLogout, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-shell app-shell--header">
        <div className="app-header__surface">
          <div className="app-brand">
            <p className="app-brand__eyebrow">Music Diary</p>
            <h1 className="app-brand__title">Music Diary</h1>
            <p className="app-brand__subtitle">
              Track albums, discover music, and move through the app like a native mobile product.
            </p>
          </div>
          {showLogout ? (
            <Button type="button" variant="danger" size="sm" className="app-logout" onClick={onLogout}>
              Logout
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default function AppChrome({
  children,
  showTabs,
  showLogout,
  onLogout,
  activeTabKey = 'home',
  tabTargets = {},
}) {
  const location = useLocation();
  const chromeMeta = getRouteChrome(location.pathname);
  const activeTab = APP_TABS.find((tab) => tab.key === activeTabKey) || APP_TABS[0];
  const routeTransitionKey = `${location.pathname}${location.search || ''}`;

  return (
    <div className={`app-frame${showTabs ? ' app-frame--authed' : ''}`}>
      {showTabs ? (
        <header className="app-header app-header--shell">
          <div className="app-shell app-shell--header">
            <div className="app-header__surface app-header__surface--shell">
              <div className="app-mobile-header__copy">
                <p className="app-mobile-header__eyebrow">{chromeMeta.eyebrow}</p>
                <h1 className="app-mobile-header__title">{chromeMeta.title}</h1>
                <p className="app-mobile-header__subtitle">{chromeMeta.subtitle}</p>
              </div>
              <div className="app-mobile-header__meta" aria-label="Current section">
                <span className="app-mobile-header__pill">{activeTab.label}</span>
                <span className="app-mobile-header__hint">{activeTab.hint}</span>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <AuthChromeHeader showLogout={showLogout} onLogout={onLogout} />
      )}

      <main className="app-main">
        <div className="app-shell app-shell--main">
          <div key={routeTransitionKey} className={`app-route-layer${showTabs ? ' app-route-layer--authed' : ''}`}>
            {children}
          </div>
        </div>
      </main>

      {showTabs ? (
        <div className="app-tabbar-wrap">
          <div className="app-shell app-shell--tabbar">
            <nav className="app-tabbar" aria-label="Primary">
              {APP_TABS.map((tab) => (
                <NavLink
                  key={tab.key}
                  to={tabTargets[tab.key] || tab.to}
                  className={`app-tabbar__item${activeTabKey === tab.key ? ' app-tabbar__item--active' : ''}`}
                >
                  <span className="app-tabbar__label">{tab.label}</span>
                  <span className="app-tabbar__hint">{tab.hint}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
