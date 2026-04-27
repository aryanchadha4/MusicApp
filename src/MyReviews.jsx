import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sortReviewsByDate } from './domain/models';
import { StackScreen } from './lib/platform/web/app';
import { Button, Modal, TextField } from './lib/platform/web/ui';
import { musicClient } from './lib/api';
import { useProfileLookup } from './hooks/useProfileLookup';
import { buildAlbumPath, buildArtistPath } from './lib/navigation/appTabs';

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

const MyReviews = ({ user, profileInfo, isPublic, section = 'profile', backTo = '/profile' }) => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenuIdx, setShowMenuIdx] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editReview, setEditReview] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [showDeleteIdx, setShowDeleteIdx] = useState(null);
  const { profile: publicProfile, loading: publicLoading, error: publicError } = useProfileLookup({
    id,
    enabled: isPublic && Boolean(id),
  });

  useEffect(() => {
    if (isPublic) {
      setLoading(publicLoading);
      setError(publicError || '');
      const data = publicProfile;
      setReviews(sortReviewsByDate(data?.ratedAlbums || []));
      return;
    }

    setLoading(false);
    setError('');
    setReviews(sortReviewsByDate(profileInfo?.ratedAlbums || []));
  }, [isPublic, profileInfo, publicError, publicLoading, publicProfile]);

  const handleDelete = async (review) => {
    setShowDeleteIdx(review.albumId);
  };
  const confirmDelete = async (review) => {
    try {
      await musicClient.deleteReview({ userId: user.id, albumId: review.albumId });
      setReviews(reviews => reviews.filter(r => r.albumId !== review.albumId));
      setShowDeleteIdx(null);
    } catch {
      alert('Failed to delete review.');
      setShowDeleteIdx(null);
    }
  };
  const cancelDelete = () => setShowDeleteIdx(null);

  const handleEdit = (item, idx) => {
    setEditIdx(idx);
    setEditReview(item.review || '');
    setEditRating(item.rating || 5);
  };
  const saveEdit = async (item) => {
    try {
      await musicClient.editReview({ userId: user.id, albumId: item.albumId, review: editReview, rating: editRating });
      setReviews(reviews => reviews.map(r => r.albumId === item.albumId ? { ...r, review: editReview, rating: editRating } : r));
      setEditIdx(null);
    } catch {
      alert('Failed to edit review.');
    }
  };
  const cancelEdit = () => setEditIdx(null);

  if (loading) {
    return (
      <StackScreen backTo={backTo} eyebrow="Reviews" title={isPublic ? 'User reviews' : 'My reviews'} subtitle="Loading review history…">
        <p className="mobile-section-empty">Loading…</p>
      </StackScreen>
    );
  }

  if (error) {
    return (
      <StackScreen backTo={backTo} eyebrow="Reviews" title={isPublic ? 'User reviews' : 'My reviews'} subtitle="We could not load these reviews.">
        <p className="mobile-section-error">{error}</p>
      </StackScreen>
    );
  }

  if (!reviews.length) {
    return (
      <StackScreen backTo={backTo} eyebrow="Reviews" title={isPublic ? 'User reviews' : 'My reviews'} subtitle="Review history in one stack-ready list view.">
        <p className="mobile-section-empty">No reviews yet.</p>
      </StackScreen>
    );
  }

  return (
    <StackScreen
      backTo={backTo}
      eyebrow="Reviews"
      title={isPublic ? 'User reviews' : 'My reviews'}
      subtitle="Review history in one stack-ready list view."
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map((item, idx) => (
          <li key={item.reviewedAt + item.albumName + idx} style={{ background: '#23263a', borderRadius: 12, padding: 20, marginBottom: 18, boxShadow: '0 1px 8px #0002', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {item.image && <img src={item.image} alt={item.albumName} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <Link
                  to={buildAlbumPath(section, item.albumId)}
                  style={{ color: '#a084ee', fontWeight: 700, fontSize: 18 }}
                >
                  {item.albumName}
                </Link> by <Link to={buildArtistPath(section, item.artistId)} style={{ color: '#7fd7ff', fontWeight: 500, fontSize: 16 }}>{item.artist}</Link>: <b>{item.rating}/5</b>
                <div style={{ color: '#aaa', fontSize: 13, marginTop: 2 }}>Reviewed on {item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : ''}</div>
              </div>
              {!isPublic && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowMenuIdx(idx === showMenuIdx ? null : idx)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer', padding: 4, borderRadius: 8 }}>
                    &#8942;
                  </button>
                  {showMenuIdx === idx && (
                    <div style={{ position: 'absolute', right: 0, top: 32, background: '#23263a', border: '1px solid #7fd7ff', borderRadius: 8, zIndex: 10, minWidth: 100, boxShadow: '0 2px 12px #0004' }}>
                      <div style={{ padding: 8, cursor: 'pointer', color: '#7fd7ff' }} onClick={() => handleEdit(item, idx)}>Edit</div>
                      <div style={{ padding: 8, cursor: 'pointer', color: '#ff7f7f' }} onClick={() => handleDelete(item)}>Delete</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {item.review && (
              <div style={{ marginTop: 14, color: '#e0e6ed', fontSize: 16, fontStyle: 'italic' }}>
                "{item.review}"
              </div>
            )}
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(showDeleteIdx)}
        onClose={cancelDelete}
        presentation="sheet"
        eyebrow="Reviews"
        title="Delete review"
        description="Remove this review from your profile activity."
      >
        <div className="search-add-modal__content">
          <p className="search-add-modal__intro">Are you sure you want to delete this review?</p>
          <div className="search-add-modal__actions">
            <Button type="button" variant="danger" onClick={() => confirmDelete(reviews.find((r) => r.albumId === showDeleteIdx))}>
              Delete
            </Button>
            <Button type="button" variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={editIdx !== null}
        onClose={cancelEdit}
        presentation="sheet"
        eyebrow="Reviews"
        title="Edit review"
        description="Update your thoughts and rating in a compact review sheet."
      >
        <div className="search-add-modal__content">
          <TextField as="textarea" value={editReview} onChange={(e) => setEditReview(e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ color: 'var(--color-fg-muted)' }}>Rating</span>
            <StarRating value={editRating} onChange={setEditRating} />
            <span style={{ color: 'var(--color-fg-muted)' }}>/5</span>
          </div>
          <div className="search-add-modal__actions">
            <Button type="button" onClick={() => saveEdit(reviews[editIdx])}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </StackScreen>
  );
};

export default MyReviews; 
