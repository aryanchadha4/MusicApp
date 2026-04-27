import { Link } from 'react-router-dom';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Button } from './lib/platform/web/ui';
import { getProfileDisplayName, getSongArtistName, sortReviewsByDate } from './domain/models';
import { buildAlbumPath, buildArtistPath } from './lib/navigation/appTabs';

function formatJoinedDate(value) {
  if (!value) return 'New listener';
  return new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function ProfileHome({ profileInfo, onLogout }) {
  const recentReviews = sortReviewsByDate(profileInfo?.ratedAlbums || []).slice(0, 3);
  const favoriteArtists = profileInfo?.favoriteArtists || [];
  const favoriteSongs = profileInfo?.favoriteSongs || [];

  return (
    <ScreenShell
      eyebrow="You"
      title={getProfileDisplayName(profileInfo || {}) || 'Profile'}
      subtitle={`Member since ${formatJoinedDate(profileInfo?.joined)}. Keep your identity, favorites, and personal history in one profile stack.`}
      actions={
        <div className="stack-screen__actions">
          <Button to="/profile/edit">
            Edit profile
          </Button>
          {onLogout ? (
            <Button type="button" variant="secondary" className="profile-logout-btn" onClick={onLogout}>
              Logout
            </Button>
          ) : null}
        </div>
      }
    >
      <ScreenMetrics
        items={[
          { label: 'Reviews', value: profileInfo?.ratedAlbums?.length || 0 },
          { label: 'Artists', value: favoriteArtists.length },
          { label: 'Songs', value: favoriteSongs.length },
        ]}
      />

      <div className="mobile-section-grid mobile-section-grid--two-up">
        <Link to="/profile/reviews" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">History</span>
          <strong className="mobile-section-card__title">All reviews</strong>
          <span className="mobile-section-card__text">Browse and edit your full ratings timeline.</span>
        </Link>
        <Link to="/profile/friends" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">People</span>
          <strong className="mobile-section-card__title">Friends</strong>
          <span className="mobile-section-card__text">Jump into the people you already know and follow up from there.</span>
        </Link>
      </div>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Favorites</p>
            <h3 className="mobile-section-card__heading">Artists on repeat</h3>
          </div>
        </div>
        {favoriteArtists.length === 0 ? (
          <p className="mobile-section-empty">Add favorite artists in your profile settings to see them here.</p>
        ) : (
          <div className="mobile-chip-list">
            {favoriteArtists.map((artist) => (
              artist?.id ? (
                <Link key={artist.id || artist.name} to={buildArtistPath('profile', artist.id)} className="mobile-chip">
                  {artist.name}
                </Link>
              ) : (
                <span key={artist.name} className="mobile-chip">
                  {artist.name}
                </span>
              )
            ))}
          </div>
        )}
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Favorites</p>
            <h3 className="mobile-section-card__heading">Songs you keep coming back to</h3>
          </div>
        </div>
        {favoriteSongs.length === 0 ? (
          <p className="mobile-section-empty">Favorite songs will appear here after you add them to your profile.</p>
        ) : (
          <div className="mobile-section-list">
            {favoriteSongs.map((song, index) => (
              <div key={`${song.title}-${index}`} className="mobile-list-row">
                <div className="mobile-list-row__body">
                  <div className="mobile-list-row__title">{song.title}</div>
                  <div className="mobile-list-row__subtitle">{getSongArtistName(song)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Latest</p>
            <h3 className="mobile-section-card__heading">Recent reviews</h3>
          </div>
          <Link to="/profile/reviews" className="stack-inline-link">
            View all
          </Link>
        </div>
        {recentReviews.length === 0 ? (
          <p className="mobile-section-empty">Your recent ratings will show here after you log a few albums.</p>
        ) : (
          <div className="mobile-section-list">
            {recentReviews.map((item, index) => (
              <div key={`${item.albumId}-${index}`} className="mobile-list-row">
                {item.image ? <img src={item.image} alt="" className="mobile-list-row__image" /> : null}
                <div className="mobile-list-row__body">
                  <Link to={buildAlbumPath('profile', item.albumId)} className="mobile-list-row__title">
                    {item.albumName}
                  </Link>
                  <Link to={buildArtistPath('profile', item.artistId)} className="mobile-list-row__subtitle">
                    {item.artist}
                  </Link>
                </div>
                <strong className="mobile-list-row__meta">{item.rating}/5</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </ScreenShell>
  );
}
