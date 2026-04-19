import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import API_BASE_URL from './config';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const fetchSpotifyImage = async (type, name, artist) => {
  let query = name;
  if (artist) query += ' ' + artist;
  const resp = await fetch(`${API_BASE_URL}/api/diary/search?query=${encodeURIComponent(query)}&type=${type}`);
  const data = await resp.json();
  if (type === 'artist' && data.artists && data.artists.items && data.artists.items[0]) {
    return data.artists.items[0].images[0]?.url;
  }
  if (type === 'track' && data.tracks && data.tracks.items && data.tracks.items[0]) {
    return data.tracks.items[0].album.images[0]?.url;
  }
  return null;
};

const Profile = ({ profileInfo }) => {
  if (!profileInfo) return <div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No profile info available.</div>;
  const user = profileInfo;
  const ratings = (user.ratedAlbums || []).slice().sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt));
  const [carouselIdx, setCarouselIdx] = useState(0);
  const reviewsPerView = 3;
  const handlePrev = () => setCarouselIdx(idx => Math.max(0, idx - 1));
  const handleNext = () => setCarouselIdx(idx => Math.min((ratings.length - reviewsPerView), idx + 1));
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true
  });
  const visibleRatings = ratings.slice(carouselIdx, carouselIdx + reviewsPerView);
  const [artistImages, setArtistImages] = useState({});
  const [songImages, setSongImages] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchImages = async () => {
      const artistImgs = {};
      for (const artist of user.favoriteArtists || []) {
        if (artist && artist.id && !artistImages[artist.id]) {
          artistImgs[artist.id] = await fetchSpotifyImage('artist', artist.name);
        }
      }
      setArtistImages(imgs => ({ ...imgs, ...artistImgs }));
      const songImgs = {};
      for (const songObj of user.favoriteSongs || []) {
        const key = songObj.title + ' - ' + songObj.artist;
        if (songObj.title && !songImages[key]) {
          songImgs[key] = await fetchSpotifyImage('track', songObj.title, songObj.artist);
        }
      }
      setSongImages(imgs => ({ ...imgs, ...songImgs }));
    };
    fetchImages();
    // eslint-disable-next-line
  }, [user.favoriteArtists, user.favoriteSongs]);

  return (
    <div>
      <h2>User Profile</h2>
      <div className="profile-card" style={{ maxWidth: 420, margin: '0 auto', padding: 16, borderRadius: 16, background: '#23263a', boxShadow: '0 2px 16px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={user.profilePic || '/default-avatar.jpeg'}
            alt="Profile"
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid #7fd7ff', background: '#181a20' }}
            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.jpeg'; }}
          />
          <Link to="/edit-profile" style={{ textDecoration: 'none' }}>
            <button style={{ marginBottom: 8, fontSize: 13, background: '#35384d', color: '#7fd7ff', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
              Change Profile Picture
            </button>
          </Link>
          <b style={{ color: '#7fd7ff', fontSize: '1.2em', marginBottom: 2 }}>{user.name ? user.name : '@musicfan123'}</b>
          <small style={{ color: '#aaa', marginBottom: 8 }}>Joined: {formatDate(user.joined)}</small>
          <div style={{ marginTop: 4, marginBottom: 12, fontWeight: 500, color: '#a084ee', fontSize: 16, display: 'flex', gap: 16 }}>
            <Link to="/followers" style={{ color: '#a084ee', textDecoration: 'underline', cursor: 'pointer' }}>
              {user.followers ? user.followers.length : 0} Followers
            </Link>
            <span style={{ color: '#aaa' }}>|</span>
            <Link to="/following" style={{ color: '#a084ee', textDecoration: 'underline', cursor: 'pointer' }}>
              {user.following ? user.following.length : 0} Following
            </Link>
          </div>
        </div>
        {/* Only show counts at the top. No followers/following lists here. */}
          <div style={{ marginTop: '1em' }}>
            <h4 style={{ margin: '0.5em 0 0.2em 0', color: '#a084ee' }}>Favorite Artists</h4>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {(user.favoriteArtists || []).map((artist, idx) => (
                <li key={idx} style={{ color: '#7fd7ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {artistImages[artist.id] && <img src={artistImages[artist.id]} alt={artist.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                  <Link to={`/artist/${encodeURIComponent(artist.id)}`} style={{ color: '#7fd7ff', fontWeight: 500 }}>{artist.name}</Link>
                </li>
              ))}
            </ul>
            <h4 style={{ margin: '1em 0 0.2em 0', color: '#a084ee' }}>Favorite Songs</h4>
            <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {(user.favoriteSongs || []).map((songObj, idx) => {
                const key = songObj.title + ' - ' + songObj.artist;
                return (
                  <li key={idx} style={{ color: '#7fd7ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {songImages[key] && <img src={songImages[key]} alt={songObj.title} style={{ width: 32, height: 32, borderRadius: 8 }} />}
                    <span>{songObj.title}</span>
                    <span style={{ color: '#aaa', fontSize: 13, marginLeft: 4 }}>by {songObj.artistId ? (
                      <Link to={`/artist/${encodeURIComponent(songObj.artistId)}`} style={{ color: '#7fd7ff', fontWeight: 500 }}>{songObj.artist}</Link>
                    ) : (
                      <span style={{ color: '#7fd7ff', fontWeight: 500 }}>{songObj.artist}</span>
                    )}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        {profileInfo && (
          <Link to="/edit-profile">
            <button style={{ marginTop: '1em', padding: '10px 32px', fontSize: 18, borderRadius: 12, background: 'linear-gradient(90deg, #7fd7ff 0%, #a084ee 100%)', color: '#181a20', fontWeight: 600, border: 'none', boxShadow: '0 1px 8px #0002', cursor: 'pointer' }}>Edit</button>
          </Link>
        )}
      </div>
      <div>
        <h3>My Reviews</h3>
        <div style={{ width: '100%', textAlign: 'right', marginBottom: 8 }}>
          <Link to="/my-reviews" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'linear-gradient(90deg, #7fd7ff 0%, #a084ee 100%)',
              color: '#181a20',
              border: 'none',
              borderRadius: 8,
              padding: '6px 18px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 1px 8px #0002'
            }}>
              See All Reviews
            </button>
          </Link>
        </div>
        <div {...swipeHandlers} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', position: 'relative', minHeight: 180 }}>
          <button onClick={handlePrev} disabled={carouselIdx === 0} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx === 0 ? 'not-allowed' : 'pointer', padding: 0, marginRight: 8 }}>&larr;</button>
          <div style={{ display: 'flex', gap: 16, flex: 1, justifyContent: 'center' }}>
            {visibleRatings.length === 0 && <div style={{ color: '#aaa', textAlign: 'center' }}>No ratings yet</div>}
            {visibleRatings.map((item, idx) => {
              const reviewWords = (item.review || '').split(' ');
              const shortReview = reviewWords.length > 3 ? reviewWords.slice(0, 3).join(' ') + '...' : item.review;
              return (
                <div key={item.reviewedAt + item.albumName + idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column', textAlign: 'left', background: '#23263a', borderRadius: 10, padding: 16, minWidth: 220, maxWidth: 260, boxShadow: '0 1px 8px #0002', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {item.image && <img src={item.image} alt={item.albumName} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 16 }} />}
                    <div style={{ flex: 1 }}>
                      {item.artistId ? (
                        <Link
                          to={`/album/${encodeURIComponent(item.albumId)}`}
                          style={{ color: '#a084ee', fontWeight: 700 }}
                        >
                          {item.albumName}
                        </Link>
                      ) : (
                        <span style={{ color: '#a084ee', fontWeight: 700 }}>{item.albumName}</span>
                      )} by {item.artistId ? (
                        <Link to={`/artist/${encodeURIComponent(item.artistId)}`} style={{ color: '#7fd7ff', fontWeight: 500 }}>{item.artist}</Link>
                      ) : (
                        <span style={{ color: '#7fd7ff', fontWeight: 500 }}>{item.artist}</span>
                      )}: <b>{item.rating}/5</b>
                    </div>
                  </div>
                  {item.review && (
                    <div style={{ marginTop: 8, color: '#e0e6ed', fontStyle: 'italic', width: '100%' }}>
                      "{shortReview}"
                      <div style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>
                        Reviewed on {formatDateTime(item.reviewedAt)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={handleNext} disabled={carouselIdx >= (ratings.length - reviewsPerView)} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx >= (ratings.length - reviewsPerView) ? 'not-allowed' : 'pointer', padding: 0, marginLeft: 8 }}>&rarr;</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#aaa', fontSize: 13 }}>
          Swipe or tap arrows to see more
        </div>
      </div>
    </div>
  );
};

export default Profile;
