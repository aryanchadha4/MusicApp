import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Link } from 'react-router-dom';
import { getShortReview } from './domain/models';
import { useFeedData } from './features/social/useFeedData';

const fallbackImg = 'https://via.placeholder.com/100x100?text=No+Image';

const Feed = ({ user }) => {
  const { popularAlbums, popularError, friendFeed, friendFeedError, friendFeedLoading } = useFeedData(user?.id);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const albumsPerView = 3;
  const [friendFeedIdx, setFriendFeedIdx] = useState(0);
  const reviewsPerView = 3;

  const handleFriendPrev = () => {
    setFriendFeedIdx(idx => Math.max(0, idx - 1));
  };
  const handleFriendNext = () => {
    setFriendFeedIdx(idx => Math.min((friendFeed.length - reviewsPerView), idx + 1));
  };

  const friendSwipeHandlers = useSwipeable({
    onSwipedLeft: () => handleFriendNext(),
    onSwipedRight: () => handleFriendPrev(),
    trackMouse: true
  });

  const visibleFriendReviews = Array.isArray(friendFeed)
    ? friendFeed.slice(friendFeedIdx, friendFeedIdx + reviewsPerView)
    : [];

  const handlePrev = () => {
    setCarouselIdx(idx => Math.max(0, idx - 1));
  };
  const handleNext = () => {
    setCarouselIdx(idx => Math.min((popularAlbums.length - albumsPerView), idx + 1));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true
  });

  const visibleAlbums = Array.isArray(popularAlbums)
    ? popularAlbums.slice(carouselIdx, carouselIdx + albumsPerView)
    : [];

  return (
    <div>
      <h2>Feed</h2>
      <div className="card" style={{ marginBottom: '2em' }}>
        <h3 style={{ color: '#7fd7ff', marginBottom: 12 }}>Friend Ratings</h3>
        {friendFeedError && <div style={{ color: '#ff7f7f', marginBottom: 12 }}>{friendFeedError}</div>}
        <div {...friendSwipeHandlers} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', position: 'relative', minHeight: 180 }}>
          <button onClick={handleFriendPrev} disabled={friendFeedIdx === 0} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: friendFeedIdx === 0 ? 'not-allowed' : 'pointer', padding: 0, marginRight: 8 }}>&larr;</button>
          <div style={{ display: 'flex', gap: 24, flex: 1, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            {(!user || !user.id) ? (
              <div style={{ color: '#7fd7ff', textAlign: 'center', width: '100%' }}>
                <div className="spinner" style={{ margin: '40px auto', width: 32, height: 32, border: '4px solid #7fd7ff', borderTop: '4px solid #23263a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : friendFeedLoading ? (
              <div style={{ color: '#7fd7ff', textAlign: 'center', width: '100%' }}>
                <div className="spinner" style={{ margin: '40px auto', width: 32, height: 32, border: '4px solid #7fd7ff', borderTop: '4px solid #23263a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : visibleFriendReviews.length > 0 ? visibleFriendReviews.map((item, idx) => {
              const shortReview = getShortReview(item.review);
              return (
                <div key={item.reviewedAt + item.user + idx} style={{ background: '#23263a', borderRadius: 10, padding: 12, width: 120, minWidth: 120, maxWidth: 140, textAlign: 'center', boxShadow: '0 1px 8px #0002', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: '#a084ee', fontSize: 15, marginBottom: 2 }}>
                    <Link to={`/user/${encodeURIComponent(item.userId)}`} style={{ color: '#a084ee', fontWeight: 600 }}>{item.user}</Link>
                  </div>
                  <div style={{ color: '#7fd7ff', fontSize: 14, fontWeight: 500 }}>
                    <Link
                      to={`/album/${encodeURIComponent(item.albumId)}`}
                      className="highlight-album"
                      style={{ color: '#a084ee', fontWeight: 700 }}
                    >
                      {item.album}
                    </Link> by <Link to={`/artist/${encodeURIComponent(item.artistId)}`} style={{ color: '#7fd7ff', fontWeight: 500 }}>{item.artist}</Link>: <b>{item.rating}/5</b>
                  </div>
                  {item.review && <div style={{ color: '#e0e6ed', fontStyle: 'italic', fontSize: 15 }}>&quot;{shortReview}&quot;</div>}
                  <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>
                    {item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : ''}
                  </div>
                  {item.image && <img src={item.image} alt={item.album} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginTop: 4 }} />}
                </div>
              );
            }) : (!friendFeedError && user && user.id && !friendFeedLoading) && <div style={{ color: '#aaa' }}>No ratings to display yet.</div>}
          </div>
          <button onClick={handleFriendNext} disabled={friendFeedIdx >= (friendFeed.length - reviewsPerView)} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: friendFeedIdx >= (friendFeed.length - reviewsPerView) ? 'not-allowed' : 'pointer', padding: 0, marginLeft: 8 }}>&rarr;</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#aaa', fontSize: 13 }}>
          Swipe or tap arrows to see more
        </div>
      </div>
      <div className="card">
        <h3 style={{ color: '#a084ee', marginBottom: 12 }}>Popular Albums</h3>
        {popularError && <div style={{ color: '#ff7f7f', marginBottom: 12 }}>{popularError}</div>}
        <div {...swipeHandlers} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', position: 'relative', minHeight: 180 }}>
          <button onClick={handlePrev} disabled={carouselIdx === 0} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx === 0 ? 'not-allowed' : 'pointer', padding: 0, marginRight: 8 }}>&larr;</button>
          <div style={{ display: 'flex', gap: 16, flex: 1, justifyContent: 'center' }}>
            {visibleAlbums.length > 0 ? visibleAlbums.map((item, idx) => (
              <div key={item.id || idx} style={{ background: '#23263a', borderRadius: 10, padding: 12, minWidth: 110, maxWidth: 120, textAlign: 'center', boxShadow: '0 1px 8px #0002', flex: 1 }}>
                <img src={item.image || fallbackImg} alt={item.album} style={{ width: 90, height: 90, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />
                <div style={{ fontWeight: 600, color: '#a084ee', fontSize: 15, marginBottom: 2 }}>
                  {item.artistId ? (
                    <Link to={`/album/${encodeURIComponent(item.id)}`} style={{ color: '#a084ee', fontWeight: 700, textDecoration: 'none' }}>{item.album}</Link>
                  ) : (
                    <span style={{ color: '#a084ee', fontWeight: 700 }}>{item.album}</span>
                  )}
                </div>
                <div style={{ color: '#7fd7ff', fontSize: 13 }}>
                  {item.artistId ? (
                    <Link to={`/artist/${encodeURIComponent(item.artistId)}`} style={{ color: '#7fd7ff', fontWeight: 500, textDecoration: 'none' }}>{item.artist}</Link>
                  ) : (
                    <span style={{ color: '#7fd7ff', fontWeight: 500 }}>{item.artist}</span>
                  )}
                </div>
              </div>
            )) : !popularError && <div style={{ color: '#aaa' }}>No popular albums found.</div>}
          </div>
          <button onClick={handleNext} disabled={carouselIdx >= (popularAlbums.length - albumsPerView)} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx >= (popularAlbums.length - albumsPerView) ? 'not-allowed' : 'pointer', padding: 0, marginLeft: 8 }}>&rarr;</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#aaa', fontSize: 13 }}>
          Swipe or tap arrows to see more
        </div>
      </div>
    </div>
  );
};

export default Feed;

/* Add spinner animation */
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);
