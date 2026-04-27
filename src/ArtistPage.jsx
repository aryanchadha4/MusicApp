import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { spotifyClient } from './lib/api';
import { StackScreen } from './lib/platform/web/app';
import { Button, Modal, TextField } from './lib/platform/web/ui';
import { buildAlbumPath, getSectionRoot } from './lib/navigation/appTabs';

const StarRating = ({ value, onChange }) => {
  return (
    <span>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{
            cursor: 'pointer',
            color: star <= value ? '#ffd700' : '#888',
            fontSize: 28,
            marginRight: 2
          }}
          onClick={() => onChange(star)}
        >
          ★
        </span>
      ))}
    </span>
  );
};

const ArtistPage = ({ onAlbumRated, section = 'search' }) => {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightAlbumId = params.get('album');
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [tab, setTab] = useState('albums');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAlbum, setModalAlbum] = useState(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalReview, setModalReview] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await spotifyClient.getArtistDetails(id);
        setArtist(data.artist);
        setAlbums(data.albums);
        setFeatured(data.featuredOn);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchArtist();
  }, [id]);

  const openReviewModal = (album) => {
    setModalAlbum(album);
    setModalRating(5);
    setModalReview('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalAlbum(null);
    setModalRating(5);
    setModalReview('');
    setModalMessage('');
  };

  const handleReviewSave = async () => {
    if (!onAlbumRated || !modalAlbum) return;
    setModalSaving(true);
    setModalMessage('');
    try {
      await onAlbumRated({
        albumId: modalAlbum.id,
        albumName: modalAlbum.name,
        artist: artist.name,
        image: modalAlbum.images[0]?.url,
        rating: modalRating,
        review: modalReview
      });
      setModalMessage('Review saved!');
      setTimeout(() => {
        setModalSaving(false);
        closeModal();
      }, 1200);
    } catch (err) {
      setModalMessage('Error saving review.');
      setModalSaving(false);
      console.error('Review save error:', err);
    }
  };

  return (
    <StackScreen
      backTo={getSectionRoot(section)}
      eyebrow="Details"
      title={artist?.name || 'Artist'}
      subtitle="Browse albums, featured appearances, and jump straight into rating from the same stack."
    >
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {loading && <div className="mobile-section-empty">Loading…</div>}
      {error && <div className="mobile-section-error">{error}</div>}
      {artist && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            {artist.images && artist.images[0] && (
              <img src={artist.images[0].url} alt={artist.name} style={{ width: 120, height: 120, borderRadius: 16, objectFit: 'cover' }} />
            )}
            <div>
              <h2 style={{ margin: 0, color: '#a084ee' }}>{artist.name}</h2>
              <div style={{ color: '#aaa', marginTop: 8, fontSize: 16 }}>{artist.genres && artist.genres.length > 0 ? artist.genres.join(', ') : 'No genres listed.'}</div>
              <div style={{ color: '#e0e6ed', marginTop: 12, fontSize: 15 }}>{artist.description || 'No description available.'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <button onClick={() => setTab('albums')} style={{ background: tab === 'albums' ? '#7fd7ff' : '#23263a', color: tab === 'albums' ? '#181a20' : '#7fd7ff', border: 'none', borderRadius: 8, padding: '0.5em 1.5em', fontWeight: 600, cursor: 'pointer' }}>Albums</button>
            <button onClick={() => setTab('featured')} style={{ background: tab === 'featured' ? '#7fd7ff' : '#23263a', color: tab === 'featured' ? '#181a20' : '#7fd7ff', border: 'none', borderRadius: 8, padding: '0.5em 1.5em', fontWeight: 600, cursor: 'pointer' }}>Featured On</button>
          </div>
          {tab === 'albums' && (
            <div>
              <h3 style={{ color: '#a084ee' }}>Albums</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {albums.map(album => (
                  <li
                    key={album.id}
                    style={{
                      background: highlightAlbumId === album.id ? 'linear-gradient(90deg, #ffd70033 0%, #23263a 100%)' : '#23263a',
                      border: highlightAlbumId === album.id ? '2px solid #ffd700' : 'none',
                      borderRadius: 10,
                      padding: 16,
                      minWidth: 180,
                      textAlign: 'center',
                      boxShadow: '0 1px 8px #0002',
                      transition: 'border 0.2s, background 0.2s'
                    }}
                  >
                    {album.images && album.images[0] && <img src={album.images[0].url} alt={album.name} style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />}
                    <Link to={buildAlbumPath(section, album.id)} style={{ color: '#a084ee', fontWeight: 700, cursor: 'pointer' }}>{album.name}</Link>
                    <div style={{ color: '#7fd7ff', fontSize: 13 }}>{album.release_date}</div>
                    <button onClick={() => openReviewModal(album)} style={{ marginTop: 8 }}>Review</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'featured' && (
            <div>
              <h3 style={{ color: '#a084ee' }}>Featured On</h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                {featured.map(album => (
                  <li key={album.id} style={{ background: '#23263a', borderRadius: 10, padding: 16, minWidth: 180, textAlign: 'center', boxShadow: '0 1px 8px #0002' }}>
                    {album.images && album.images[0] && <img src={album.images[0].url} alt={album.name} style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />}
                    <Link to={buildAlbumPath(section, album.id)} style={{ color: '#a084ee', fontWeight: 700, cursor: 'pointer' }}>{album.name}</Link>
                    <div style={{ color: '#7fd7ff', fontSize: 13 }}>{album.release_date}</div>
                    <button onClick={() => openReviewModal(album)} style={{ marginTop: 8 }}>Review</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Modal
            open={modalOpen}
            onClose={closeModal}
            presentation="sheet"
            eyebrow="Review"
            title={modalAlbum?.name || 'Review album'}
            description={artist?.name || 'Add your rating and a few thoughts.'}
          >
            <div className="search-add-modal__content">
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StarRating value={modalRating} onChange={setModalRating} />
              </div>
              <TextField
                as="textarea"
                placeholder="Write a review..."
                value={modalReview}
                onChange={(e) => setModalReview(e.target.value)}
              />
              {modalMessage ? (
                <div style={{ color: modalMessage.includes('saved') ? 'var(--color-accent)' : 'var(--color-danger)', textAlign: 'center' }}>
                  {modalMessage}
                </div>
              ) : null}
              <div className="search-add-modal__actions">
                <Button type="button" onClick={handleReviewSave} loading={modalSaving} disabled={modalSaving}>
                  Save review
                </Button>
                <Button type="button" variant="secondary" onClick={closeModal} disabled={modalSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
      </div>
    </StackScreen>
  );
};

export default ArtistPage; 
