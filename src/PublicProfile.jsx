import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { getShortReview, getSongArtistName } from './domain/models';
import { StackScreen } from './lib/platform/web/app';
import { usePublicProfileController } from './features/social/usePublicProfileController';
import { buildAlbumPath, buildArtistPath, buildUserReviewsPath, getSectionRoot } from './lib/navigation/appTabs';

const PublicProfile = ({ user, setProfileInfo, section = 'network' }) => {
  const { id } = useParams();
  const {
    profile,
    loading,
    relationshipStatus,
    followLoading,
    follow,
    unfollow,
    actionLabel,
    actionMode,
    artistImages,
    songImages,
    ratings,
    visibleRatings,
    carouselIdx,
    showPreviousReviews,
    showNextReviews,
    reviewsPerView,
  } = usePublicProfileController({ profileId: id, user, onProfileChange: setProfileInfo });
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => showNextReviews(),
    onSwipedRight: () => showPreviousReviews(),
    trackMouse: true
  });

  if (loading) {
    return (
      <StackScreen backTo={getSectionRoot(section)} eyebrow="People" title="Profile" subtitle="Loading listener profile…">
        <p className="mobile-section-empty">Loading…</p>
      </StackScreen>
    );
  }

  if (!profile) {
    return (
      <StackScreen backTo={getSectionRoot(section)} eyebrow="People" title="Profile" subtitle="We could not find this user.">
        <p className="mobile-section-error">User not found</p>
      </StackScreen>
    );
  }

  return (
    <StackScreen
      backTo={getSectionRoot(section)}
      eyebrow="People"
      title={profile.name || profile.username || 'Profile'}
      subtitle="A stack-friendly public profile with network actions and recent reviews."
    >
      <div>
      <div className="profile-card" style={{ maxWidth: 420, margin: '0 auto', padding: 16, borderRadius: 16, background: '#23263a', boxShadow: '0 2px 16px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <img
            src={profile.profilePic || '/default-avatar.jpeg'}
            alt="Profile"
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 8, border: '3px solid #7fd7ff', background: '#181a20' }}
            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.jpeg'; }}
          />
          {user && user.id !== id && (
            <button
              onClick={actionMode === 'active' ? unfollow : follow}
              disabled={followLoading}
              style={{
                marginBottom: 8,
                fontSize: 13,
                background: '#35384d',
                color: actionMode === 'active' ? '#ffb07f' : '#7fd7ff',
                border: 'none',
                borderRadius: 8,
                padding: '4px 12px',
                cursor: 'pointer'
              }}
            >
              {followLoading ? 'Working...' : actionLabel}
            </button>
          )}
          <b style={{ color: '#7fd7ff', fontSize: '1.2em', marginBottom: 2 }}>{profile.name || profile.username}</b>
          <small style={{ color: '#aaa', marginBottom: 8 }}>Joined: {profile.joined ? new Date(profile.joined).toLocaleDateString() : ''}</small>
          <div style={{ marginTop: 4, marginBottom: 12, fontWeight: 500, color: '#a084ee', fontSize: 16, display: 'flex', gap: 16 }}>
            <span style={{ color: '#a084ee' }}>{profile.followers ? profile.followers.length : 0} Followers</span>
            <span style={{ color: '#aaa' }}>|</span>
            <span style={{ color: '#a084ee' }}>{profile.following ? profile.following.length : 0} Following</span>
          </div>
          {user && user.id !== id && relationshipStatus === 'outgoing_request' && (
            <small style={{ color: '#aaa', marginBottom: 8 }}>Friend request pending</small>
          )}
        </div>
        <div style={{ width: '100%', textAlign: 'right', marginBottom: 8 }}>
          <Link to={buildUserReviewsPath(section, id)} style={{ textDecoration: 'none' }}>
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
                  <Link to={buildArtistPath(section, artist.id)} style={{ color: '#7fd7ff', fontWeight: 500 }}>{artist.name}</Link>
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
              const artist = getSongArtistName(songObj) || 'Unknown';
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
          <button onClick={showPreviousReviews} disabled={carouselIdx === 0} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx === 0 ? 'not-allowed' : 'pointer', padding: 0, marginRight: 8 }}>&larr;</button>
          <div style={{ display: 'flex', gap: 16, flex: 1, justifyContent: 'center' }}>
            {visibleRatings.length === 0 && <div style={{ color: '#aaa', textAlign: 'center' }}>No ratings yet</div>}
            {visibleRatings.map((item, idx) => {
              const shortReview = getShortReview(item.review);
              return (
                <div key={item.reviewedAt + item.albumName + idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: 'column', textAlign: 'left', background: '#23263a', borderRadius: 10, padding: 16, minWidth: 220, maxWidth: 260, boxShadow: '0 1px 8px #0002', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {item.image && <img src={item.image} alt={item.albumName} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 16 }} />}
                    <div style={{ flex: 1 }}>
                      {item.artistId ? (
                        <Link to={buildAlbumPath(section, item.albumId)} style={{ color: '#a084ee', fontWeight: 700 }}>{item.albumName}</Link>
                      ) : (
                        <span style={{ color: '#a084ee', fontWeight: 700 }}>{item.albumName}</span>
                      )} by {item.artistId ? (
                        <Link to={buildArtistPath(section, item.artistId)} style={{ color: '#7fd7ff', fontWeight: 500 }}>{item.artist}</Link>
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
          <button onClick={showNextReviews} disabled={carouselIdx >= (ratings.length - reviewsPerView)} style={{ fontSize: 24, background: 'none', color: '#7fd7ff', border: 'none', cursor: carouselIdx >= (ratings.length - reviewsPerView) ? 'not-allowed' : 'pointer', padding: 0, marginLeft: 8 }}>&rarr;</button>
        </div>
      <div style={{ textAlign: 'center', marginTop: 8, color: '#aaa', fontSize: 13 }}>
          Swipe or tap arrows to see more
        </div>
      </div>
      </div>
    </StackScreen>
  );
};

export default PublicProfile; 
