import { Link } from 'react-router-dom';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Button, Skeleton, Spinner } from './lib/platform/web/ui';
import { getProfileDisplayName, getShortReview, sortReviewsByDate } from './domain/models';
import { useFeedData } from './features/social/useFeedData';
import { buildAlbumPath, buildArtistPath, buildUserPath } from './lib/navigation/appTabs';

function formatActivityDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Home({ user, profileInfo }) {
  const { friendFeed, friendFeedLoading, friendFeedError, popularAlbums, popularError, popularLoading, reload } = useFeedData(user?.id);
  const latestRatings = sortReviewsByDate(profileInfo?.ratedAlbums || []).slice(0, 3);
  const displayName = getProfileDisplayName(profileInfo || user || {});

  return (
    <ScreenShell
      eyebrow="Start"
      title={`Welcome back, ${displayName}`}
      subtitle="A mobile-style home base for discovery, recent activity, and the shortcuts you will want most on a phone."
      actions={
        <Button type="button" variant="secondary" loading={friendFeedLoading || popularLoading} onClick={reload}>
          Refresh
        </Button>
      }
    >
      <ScreenMetrics
        items={[
          { label: 'Recent ratings', value: profileInfo?.ratedAlbums?.length || 0 },
          { label: 'Friend updates', value: friendFeed.length },
          { label: 'Top picks', value: popularAlbums.length },
        ]}
      />

      <div className="mobile-section-grid mobile-section-grid--two-up">
        <Link to="/search" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Discover</span>
          <strong className="mobile-section-card__title">Search music</strong>
          <span className="mobile-section-card__text">Jump into albums, artists, and tracks from one tab.</span>
        </Link>
        <Link to="/activity/diary" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Log</span>
          <strong className="mobile-section-card__title">Open diary</strong>
          <span className="mobile-section-card__text">Capture a rating the moment you finish listening.</span>
        </Link>
        <Link to="/activity/lists" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Organize</span>
          <strong className="mobile-section-card__title">View lists</strong>
          <span className="mobile-section-card__text">Keep favorites, moods, and ranking projects together.</span>
        </Link>
        <Link to="/network" className="mobile-section-card mobile-section-card--link">
          <span className="mobile-section-card__eyebrow">Connect</span>
          <strong className="mobile-section-card__title">Check network</strong>
          <span className="mobile-section-card__text">See requests, friends, and new listening activity.</span>
        </Link>
      </div>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Your pace</p>
            <h3 className="mobile-section-card__heading">Recent diary highlights</h3>
          </div>
          <Link to="/activity" className="stack-inline-link">
            Activity
          </Link>
        </div>
        {latestRatings.length === 0 ? (
          <p className="mobile-section-empty">Nothing logged yet. Your latest albums and songs will show up here.</p>
        ) : (
          <div className="mobile-section-list">
            {latestRatings.map((item, index) => (
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

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Friends</p>
            <h3 className="mobile-section-card__heading">Latest network activity</h3>
          </div>
          <Link to="/network" className="stack-inline-link">
            Open network
          </Link>
        </div>
        {friendFeedLoading ? (
          <div className="ui-loading-stack">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="ui-loading-row">
                <Skeleton variant="avatar" />
                <div className="ui-loading-row__body">
                  <Skeleton style={{ width: '42%' }} />
                  <Skeleton style={{ width: '64%' }} />
                  <Skeleton style={{ width: '82%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {friendFeedError ? <p className="mobile-section-error">{friendFeedError}</p> : null}
        {!friendFeedLoading && !friendFeedError && friendFeed.length === 0 ? (
          <p className="mobile-section-empty">Once your friends start logging music, their activity will appear here.</p>
        ) : null}
        {!friendFeedLoading && !friendFeedError && friendFeed.length > 0 ? (
          <div className="mobile-section-list">
            {friendFeed.slice(0, 5).map((item) => (
              <article key={item.id || `${item.userId}-${item.reviewedAt}`} className="mobile-feed-card">
                <div className="mobile-feed-card__topline">
                  <Link to={buildUserPath('home', item.userId)} className="mobile-feed-card__user">
                    {item.user}
                  </Link>
                  <span className="mobile-feed-card__date">{formatActivityDate(item.reviewedAt)}</span>
                </div>
                <Link to={buildAlbumPath('home', item.albumId)} className="mobile-feed-card__title">
                  {item.album}
                </Link>
                <Link to={buildArtistPath('home', item.artistId)} className="mobile-feed-card__subtitle">
                  {item.artist}
                </Link>
                <p className="mobile-feed-card__text">
                  Rated {item.rating}/5
                  {item.review ? ` · "${getShortReview(item.review, 10)}"` : ''}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Discover</p>
            <h3 className="mobile-section-card__heading">Popular right now</h3>
          </div>
          <Link to="/search" className="stack-inline-link">
            Search
          </Link>
        </div>
        {popularError ? <p className="mobile-section-error">{popularError}</p> : null}
        {popularLoading ? (
          <div className="ui-loading-inline">
            <Spinner size="sm" />
            Loading popular albums…
          </div>
        ) : null}
        {!popularLoading && !popularError && popularAlbums.length === 0 ? (
          <p className="mobile-section-empty">Popular albums will appear here when available.</p>
        ) : null}
        {!popularLoading && !popularError && popularAlbums.length > 0 ? (
          <div className="mobile-section-list">
            {popularAlbums.slice(0, 5).map((item) => (
              <div key={item.id} className="mobile-list-row">
                {item.image ? <img src={item.image} alt="" className="mobile-list-row__image" /> : null}
                <div className="mobile-list-row__body">
                  <Link to={buildAlbumPath('home', item.id)} className="mobile-list-row__title">
                    {item.album}
                  </Link>
                  <Link to={buildArtistPath('home', item.artistId)} className="mobile-list-row__subtitle">
                    {item.artist}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </ScreenShell>
  );
}
