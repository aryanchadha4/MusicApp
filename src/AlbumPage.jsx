import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Skeleton } from './lib/platform/web/ui';
import { musicClient, spotifyClient } from './lib/api';
import { StackScreen } from './lib/platform/web/app';
import { buildArtistPath, buildUserPath, getSectionRoot } from './lib/navigation/appTabs';

const AlbumPage = ({ section = 'search' }) => {
  const { albumId } = useParams();
  const [albumInfo, setAlbumInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [histogram, setHistogram] = useState([0, 0, 0, 0, 0]);
  const [averageScore, setAverageScore] = useState(0);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      setLoading(true);
      setError('');
      try {
        const albumData = await spotifyClient.getAlbum(albumId);
        setAlbumInfo(albumData);
        const reviewsData = await musicClient.getAlbumReviews(albumId);
        setReviews(reviewsData);
        // Calculate histogram and average
        const hist = [0, 0, 0, 0, 0];
        let totalRating = 0;
        for (const r of reviewsData) {
          if (r.rating >= 1 && r.rating <= 5) {
            hist[r.rating - 1]++;
            totalRating += r.rating;
          }
        }
        setHistogram(hist);
        setAverageScore(reviewsData.length > 0 ? (totalRating / reviewsData.length).toFixed(1) : 0);
      } catch (err) {
        setError(err.message || 'Failed to load album info or reviews.');
      }
      setLoading(false);
    };
    fetchAlbum();
  }, [albumId]);

  if (loading) {
    return (
      <StackScreen backTo={getSectionRoot(section)} eyebrow="Details" title="Album" subtitle="Loading album details…">
        <div className="screen-shell__stack">
          <section className="mobile-section-card">
            <div className="album-screen__hero-main">
              <Skeleton variant="block" className="album-screen__cover" />
              <div className="album-screen__hero-copy" style={{ flex: 1 }}>
                <Skeleton style={{ width: '58%', height: '1.1rem' }} />
                <Skeleton style={{ width: '42%' }} />
                <Skeleton style={{ width: '34%' }} />
              </div>
            </div>
          </section>
          <section className="mobile-section-card">
            <div className="ui-loading-stack">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="ui-loading-row">
                  <div className="ui-loading-row__body">
                    <Skeleton style={{ width: '40%' }} />
                    <Skeleton style={{ width: '70%' }} />
                    <Skeleton style={{ width: '82%' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </StackScreen>
    );
  }

  if (error) {
    return (
      <StackScreen backTo={getSectionRoot(section)} eyebrow="Details" title="Album" subtitle="We could not load this album.">
        <p className="mobile-section-error">{error}</p>
      </StackScreen>
    );
  }

  return (
    <StackScreen
      backTo={getSectionRoot(section)}
      eyebrow="Details"
      title={albumInfo?.name || 'Album'}
      subtitle="Album details, review distribution, and recent listener reactions."
    >
      <div className="screen-shell__stack album-screen">
      <section className="mobile-section-card album-screen__hero">
        <div className="album-screen__hero-main">
          {albumInfo?.images && albumInfo.images[0] && (
            <img src={albumInfo.images[0].url} alt={albumInfo.name} className="album-screen__cover" />
          )}
          <div className="album-screen__hero-copy">
            <div className="album-screen__artists">
              {albumInfo?.artists?.map((a, idx) => (
                <span key={a.id}>
                  <Link to={buildArtistPath(section, a.id)} className="album-screen__artist-link">
                    {a.name}
                  </Link>
                  {idx < albumInfo.artists.length - 1 && ', '}
                </span>
              ))}
            </div>
            <div className="album-screen__meta">{albumInfo?.release_date}</div>
            <div className="album-screen__meta">{albumInfo?.total_tracks} tracks</div>
          </div>
        </div>
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Community</p>
            <h3 className="mobile-section-card__heading">Review distribution</h3>
          </div>
        </div>
        <div className="album-screen__stats">
          <div className="album-screen__average">
            <div className="album-screen__average-value">{averageScore}</div>
            <div className="album-screen__average-label">Average</div>
          </div>
          <div className="album-screen__histogram">
          {histogram.map((count, idx) => {
            const maxCount = Math.max(...histogram);
            const barHeight = maxCount > 0 ? (count / maxCount) * 80 : 0;
            return (
              <div key={idx} className="album-screen__bar-group">
                <div 
                  style={{ 
                    background: count > 0 ? '#a084ee' : '#333', 
                    width: '100%', 
                    height: `${barHeight}px`, 
                    borderRadius: 6, 
                    marginBottom: 4, 
                    transition: 'height 0.3s',
                    minHeight: count > 0 ? 4 : 0,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                <div className="album-screen__bar-label">{idx + 1}</div>
              </div>
            );
          })}
          {hoveredBar !== null && histogram[hoveredBar] > 0 && (
            <div className="album-screen__tooltip" style={{ left: `${(hoveredBar / 5) * 100}%` }}>
              {histogram[hoveredBar]} review{histogram[hoveredBar] === 1 ? '' : 's'} with {hoveredBar + 1} star{hoveredBar === 0 ? '' : 's'}
            </div>
          )}
          </div>
        </div>
      <div className="album-screen__review-count">
        {reviews.length} Review{reviews.length === 1 ? '' : 's'} so far
      </div>
      </section>

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Recent</p>
            <h3 className="mobile-section-card__heading">Latest reviews</h3>
          </div>
        </div>
      <ul className="screen-entry-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {reviews.slice(0, 10).map((r, idx) => (
          <li key={r.userId + r.albumId + idx} className="album-screen__review">
            <div className="album-screen__review-user">
              <Link to={buildUserPath(section, r.userId)} className="album-screen__review-link">
                {r.user}
              </Link>
            </div>
            <div className="album-screen__review-rating">{r.rating}/5</div>
            <div className="album-screen__review-body">{r.review}</div>
            <div className="album-screen__review-date">{r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : ''}</div>
          </li>
        ))}
      </ul>
      </section>
      </div>
    </StackScreen>
  );
};

export default AlbumPage; 
