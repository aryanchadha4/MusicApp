import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_BASE_URL from './config';

const AlbumPage = ({ user }) => {
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
        // Fetch album info from Spotify
        const albumRes = await fetch(`${API_BASE_URL}/api/spotify/album/${albumId}`);
        const albumData = await albumRes.json();
        setAlbumInfo(albumData);
        // Fetch all reviews for this album from backend
        const reviewsRes = await fetch(`${API_BASE_URL}/api/auth/album-reviews?albumId=${albumId}`);
        const reviewsData = await reviewsRes.json();
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
        setError('Failed to load album info or reviews.');
      }
      setLoading(false);
    };
    fetchAlbum();
  }, [albumId]);

  if (loading) return <div style={{ color: '#7fd7ff', textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (error) return <div style={{ color: '#ff7f7f', textAlign: 'center', marginTop: 40 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2em auto' }}>
      <h2 style={{ color: '#a084ee', textAlign: 'center', marginBottom: 16 }}>{albumInfo?.name}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
        {albumInfo?.images && albumInfo.images[0] && (
          <img src={albumInfo.images[0].url} alt={albumInfo.name} style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover', boxShadow: '0 2px 16px #0004' }} />
        )}
        <div>
          <div style={{ color: '#7fd7ff', fontSize: 20, fontWeight: 600 }}>
            {albumInfo?.artists?.map((a, idx) => (
              <span key={a.id}>
                <Link to={`/artist/${encodeURIComponent(a.id)}`} style={{ color: '#7fd7ff', textDecoration: 'none' }}>
                  {a.name}
                </Link>
                {idx < albumInfo.artists.length - 1 && ', '}
              </span>
            ))}
          </div>
          <div style={{ color: '#aaa', fontSize: 15, marginTop: 4 }}>{albumInfo?.release_date}</div>
          <div style={{ color: '#aaa', fontSize: 15, marginTop: 4 }}>{albumInfo?.total_tracks} tracks</div>
        </div>
      </div>
      <h3 style={{ color: '#7fd7ff', marginBottom: 8 }}>Review Distribution</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ color: '#a084ee', fontSize: 24, fontWeight: 700 }}>{averageScore}</div>
          <div style={{ color: '#aaa', fontSize: 13 }}>Average</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, position: 'relative' }}>
          {histogram.map((count, idx) => {
            const maxCount = Math.max(...histogram);
            const barHeight = maxCount > 0 ? (count / maxCount) * 80 : 0;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
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
                <div style={{ color: '#aaa', fontSize: 12, fontWeight: 600 }}>{idx + 1}</div>
              </div>
            );
          })}
          {hoveredBar !== null && histogram[hoveredBar] > 0 && (
            <div style={{
              position: 'absolute',
              top: -40,
              left: `${(hoveredBar / 5) * 100}%`,
              transform: 'translateX(-50%)',
              background: '#23263a',
              color: '#e0e6ed',
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '1px solid #333',
              zIndex: 10,
              whiteSpace: 'nowrap'
            }}>
              {histogram[hoveredBar]} review{histogram[hoveredBar] === 1 ? '' : 's'} with {hoveredBar + 1} star{hoveredBar === 0 ? '' : 's'}
            </div>
          )}
        </div>
      </div>
      <div style={{ color: '#7fd7ff', fontWeight: 600, fontSize: 17, marginBottom: 16 }}>
        {reviews.length} Review{reviews.length === 1 ? '' : 's'} so far
      </div>
      <h3 style={{ color: '#a084ee', marginBottom: 8 }}>Recent Reviews</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.slice(0, 10).map((r, idx) => (
          <li key={r.userId + r.albumId + idx} style={{ background: '#23263a', borderRadius: 10, padding: 14, marginBottom: 12, boxShadow: '0 1px 8px #0002' }}>
            <div style={{ color: '#a084ee', fontWeight: 600 }}>
              <Link to={`/user/${encodeURIComponent(r.userId)}`} style={{ color: '#a084ee', textDecoration: 'none' }}>
                {r.user}
              </Link>
            </div>
            <div style={{ color: '#7fd7ff', fontWeight: 500 }}>{r.rating}/5</div>
            <div style={{ color: '#e0e6ed', fontStyle: 'italic', marginTop: 4 }}>{r.review}</div>
            <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlbumPage; 