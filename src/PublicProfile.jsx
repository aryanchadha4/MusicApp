import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import API_BASE_URL from './config';

const PublicProfile = ({ user, setProfileInfo }) => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Image state for artists and songs
  const [artistImages, setArtistImages] = useState({});
  const [songImages, setSongImages] = useState({});
  // Carousel state
  const [carouselIdx, setCarouselIdx] = useState(0);
  const reviewsPerView = 3;
  const handlePrev = () => setCarouselIdx(idx => Math.max(0, idx - 1));
  const handleNext = () => setCarouselIdx(idx => Math.min(((profile?.ratedAlbums?.length || 0) - reviewsPerView), idx + 1));
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true
  });
  const visibleRatings = (profile?.ratedAlbums || []).slice(carouselIdx, carouselIdx + reviewsPerView);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/profile?id=${id}`);
      const data = await res.json();
      setProfile(data);
      setLoading(false);
      if (user && data.followers) {
        setIsFollowing(data.followers.some(f => f._id === user.id));
      }
    };
    fetchProfile();
  }, [id, user]);

  // Fetch images for artists and songs
  useEffect(() => {
    if (!profile) return;
    const fetchSpotifyImage = async (type, name, artist) => {
      let query = name;
      if (artist) query += ' ' + artist;
      const resp = await fetch(`${API_BASE_URL}/api/spotify/search?query=${encodeURIComponent(query)}&type=${type}`);
      const data = await resp.json();
      if (type === 'artist' && data.artists && data.artists.items && data.artists.items[0]) {
        return data.artists.items[0].images[0]?.url;
      }
      if (type === 'track' && data.tracks && data.tracks.items && data.tracks.items[0]) {
        return data.tracks.items[0].album.images[0]?.url;
      }
      return null;
    };
    const fetchImages = async () => {
      const artistImgs = {};
      for (const artist of profile.favoriteArtists || []) {
        if (artist && artist.id && !artistImages[artist.id]) {
          artistImgs[artist.id] = await fetchSpotifyImage('artist', artist.name);
        }
      }
      setArtistImages(imgs => ({ ...imgs, ...artistImgs }));
      const songImgs = {};
      for (const songObj of profile.favoriteSongs || []) {
        const key = songObj.title + ' - ' + songObj.artist;
        if (songObj.title && !songImages[key]) {
          songImgs[key] = await fetchSpotifyImage('track', songObj.title, songObj.artist);
        }
      }
      setSongImages(imgs => ({ ...imgs, ...songImgs }));
    };
    fetchImages();
    // eslint-disable-next-line
  }, [profile]);

  const handleFollow = async () => {
    if (!user || !user.id) return;
    setFollowLoading(true);
    await fetch(`${API_BASE_URL}/api/auth/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, followId: id })
    });
    setIsFollowing(true);
    // Refresh profile
    const res = await fetch(`${API_BASE_URL}/api/auth/profile?id=${id}`);
    const data = await res.json();
    setProfile(data);
    setFollowLoading(false);
    if (setProfileInfo) setProfileInfo(data);
  };
  const handleUnfollow = async () => {
    if (!user || !user.id) return;
    setFollowLoading(true);
    await fetch(`${API_BASE_URL}/api/auth/unfollow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, unfollowId: id })
    });
    setIsFollowing(false);
    // Refresh profile
    const res = await fetch(`${API_BASE_URL}/api/auth/profile?id=${id}`);
    const data = await res.json();
    setProfile(data);
    setFollowLoading(false);
    if (setProfileInfo) setProfileInfo(data);
  };

  if (loading) return <div style={{ color: '#7fd7ff', textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (!profile) return <div style={{ color: '#ff7f7f', textAlign: 'center', marginTop: 40 }}>User not found</div>;

  return (
    <div>
      <h2>Public Profile</h2>
      <div className="profile-card" style={{ maxWidth: 420, margin: '0 auto', padding: 16, borderRadius: 16, background: '#23263a', boxShadow: '0 2px 16px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={profile.profilePic || '/default-avatar.jpeg'}
            alt="Profile"
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid #7fd7ff', background: '#181a20' }}
            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.jpeg'; }}
          />
          {user && user.id !== id && (
            isFollowing
              ? <button onClick={handleUnfollow} disabled={followLoading} style={{ marginBottom: 8, fontSize: 13, background: '#35384d', color: '#ff7f7f', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>Unfollow</button>
              : <button onClick={handleFollow} disabled={followLoading} style={{ marginBottom: 8, fontSize: 13, background: '#35384d', color: '#7fd7ff', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>Follow</button>
          )}
          <b style={{ color: '#7fd7ff', fontSize: '1.2em', marginBottom: 2 }}>{profile.name || profile.username}</b>
          <small style={{ color: '#aaa', marginBottom: 8 }}>Joined: {profile.joined ? new Date(profile.joined).toLocaleDateString() : ''}</small>
          <div style={{ marginTop: 4, marginBottom: 12, fontWeight: 500, color: '#a084ee', fontSize: 16, display: 'flex', gap: 16 }}>
            <span style={{ color: '#a084ee' }}>{profile.followers ? profile.followers.length : 0} Followers</span>
            <span style={{ color: '#aaa' }}>|</span>
            <span style={{ color: '#a084ee' }}>{profile.following ? profile.following.length : 0} Following</span>
          </div>
        </div>
        <div style={{ width: '100%', textAlign: 'right', marginBottom: 8 }}>
          <Link to={`/user/${id}/reviews`} style={{ textDecoration: 'none' }}>
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
        <div style={{ marginTop: '1em', width: '100%' }}>
          <h4 style={{ margin: '0.5em 0 0.2em 0', color: '#a084ee' }}>Favorite Artists</h4>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {(profile.favoriteArtists || []).map((artist, idx) => (
              <li key={idx} style={{ color: '#7fd7ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                {artistImages[artist.id] && <img src={artistImages[artist.id]} alt={artist.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                {artist && artist.id ? (
                  <Link to={`/artist/${encodeURIComponent(artist.id)}`} style={{ color: '#7fd7ff', fontWeight: 500 }}>{artist.name}</Link>
                ) : (
                  <span>{artist.name || artist}</span>
                )}
              </li>
            ))}
          </ul>
          <h4 style={{ margin: '1em 0 0.2em 0', color: '#a084ee' }}>Favorite Songs</h4>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {(profile.favoriteSongs || []).map((songObj, idx) => {
              const title = typeof songObj?.title === 'string' ? songObj.title : 'Unknown';
              let artist = 'Unknown';
              if (typeof songObj?.artist === 'string') {
                artist = songObj.artist;
              } else if (songObj?.artist && typeof songObj.artist.name === 'string') {
                artist = songObj.artist.name;
              }
              const key = songObj.title + ' - ' + songObj.artist;
              return (
                <li key={idx} style={{ color: '#7fd7ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {songImages[key] && <img src={songImages[key]} alt={title} style={{ width: 32, height: 32, borderRadius: 8 }} />}
                  <span>{title}</span>
                  <span style={{ color: '#aaa', fontSize: 13, marginLeft: 4 }}>
                    by {artist}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* Review Carousel */}
      <div>
        <h3>Ratings & Reviews</h3>
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
                        <Link to={`/album/${encodeURIComponent(item.albumId)}`} style={{ color: '#a084ee', fontWeight: 700 }}>{item.albumName}</Link>
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
                        Reviewed on {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : ''}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={handleNext} disabled={carouselIdx >= ((profile?.ratedAlbums?.length || 0) - reviewsPerView)} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx >= ((profile?.ratedAlbums?.length || 0) - reviewsPerView) ? 'not-allowed' : 'pointer', padding: 0, marginLeft: 8 }}>&rarr;</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, color: '#aaa', fontSize: 13 }}>
          Swipe or tap arrows to see more
        </div>
      </div>
    </div>
  );
};

export default PublicProfile; 