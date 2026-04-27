import { Link } from 'react-router-dom';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { sortReviewsByDate } from './domain/models';
import { buildAlbumPath, buildArtistPath } from './lib/navigation/appTabs';

export default function Activity({ profileInfo }) {
  const recentItems = sortReviewsByDate(profileInfo?.ratedAlbums || []).slice(0, 4);

  return (
    <ScreenShell
      eyebrow="Library"
      title="Activity"
      subtitle="This section groups your personal listening tools into one mobile-friendly stack: quick access to diary logging, list management, and your most recent entries."
    >
      <ScreenMetrics
        items={[
          { label: 'Diary entries', value: profileInfo?.ratedAlbums?.length || 0 },
          { label: 'Favorite artists', value: profileInfo?.favoriteArtists?.length || 0 },
          { label: 'Favorite songs', value: profileInfo?.favoriteSongs?.length || 0 },
        ]}
      />

      <div className="mobile-section-grid mobile-section-grid--two-up">
        <Link to="/activity/diary" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Journal</span>
          <strong className="mobile-section-card__title">Diary</strong>
          <span className="mobile-section-card__text">Rate albums and songs with the same touch-first flow you already use.</span>
        </Link>
        <Link to="/activity/lists" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Collections</span>
          <strong className="mobile-section-card__title">Lists</strong>
          <span className="mobile-section-card__text">Move from logging into organizing without changing sections.</span>
        </Link>
      </div>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Recently logged</p>
            <h3 className="mobile-section-card__heading">Your latest entries</h3>
          </div>
          <Link to="/activity/diary" className="stack-inline-link">
            Open diary
          </Link>
        </div>
        {recentItems.length === 0 ? (
          <p className="mobile-section-empty">Start rating music and your latest entries will show up here.</p>
        ) : (
          <div className="mobile-section-list">
            {recentItems.map((item, index) => (
              <div key={`${item.albumId}-${index}`} className="mobile-list-row">
                {item.image ? <img src={item.image} alt="" className="mobile-list-row__image" /> : null}
                <div className="mobile-list-row__body">
                  <Link to={buildAlbumPath('activity', item.albumId)} className="mobile-list-row__title">
                    {item.albumName}
                  </Link>
                  <Link to={buildArtistPath('activity', item.artistId)} className="mobile-list-row__subtitle">
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
