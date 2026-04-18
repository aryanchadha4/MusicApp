import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from './config';

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

const MyReviews = ({ user, profileInfo, isPublic }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMenuIdx, setShowMenuIdx] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [editReview, setEditReview] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [showDeleteIdx, setShowDeleteIdx] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError('');
      try {
        let data;
        if (isPublic) {
          const res = await fetch(`${API_BASE_URL}/api/auth/profile?id=${id}`);
          data = await res.json();
        } else {
          data = profileInfo;
        }
        setReviews((data.ratedAlbums || []).slice().sort((a, b) => new Date(b.reviewedAt) - new Date(a.reviewedAt)));
      } catch (err) {
        setError('Failed to load reviews.');
      }
      setLoading(false);
    };
    fetchReviews();
    // eslint-disable-next-line
  }, [id, isPublic, profileInfo]);

  const handleDelete = async (review) => {
    setShowDeleteIdx(review.albumId);
  };
  const confirmDelete = async (review) => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/delete-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, albumId: review.albumId })
      });
      setReviews(reviews => reviews.filter(r => r.albumId !== review.albumId));
      setShowDeleteIdx(null);
    } catch (err) {
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
      await fetch(`${API_BASE_URL}/api/auth/edit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, albumId: item.albumId, review: editReview, rating: editRating })
      });
      setReviews(reviews => reviews.map(r => r.albumId === item.albumId ? { ...r, review: editReview, rating: editRating } : r));
      setEditIdx(null);
    } catch (err) {
      alert('Failed to edit review.');
    }
  };
  const cancelEdit = () => setEditIdx(null);

  const showBackButton = (
    <button onClick={() => navigate('/profile')} style={{ marginBottom: 16, background: 'linear-gradient(90deg, #7fd7ff 0%, #a084ee 100%)', color: '#181a20', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 8px #0002' }}>&larr; Back</button>
  );

  if (loading) return <div style={{ maxWidth: 600, margin: '2em auto' }}>{showBackButton}<div style={{ color: '#7fd7ff', textAlign: 'center', marginTop: 40 }}>Loading...</div></div>;
  if (error) return <div style={{ maxWidth: 600, margin: '2em auto' }}>{showBackButton}<div style={{ color: '#ff7f7f', textAlign: 'center', marginTop: 40 }}>{error}</div></div>;
  if (!reviews.length) return <div style={{ maxWidth: 600, margin: '2em auto' }}>{showBackButton}<div style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No reviews yet.</div></div>;

  return (
    <div style={{ maxWidth: 600, margin: '2em auto' }}>
      {showBackButton}
      <h2 style={{ color: '#7fd7ff', textAlign: 'center', marginBottom: 24 }}>{isPublic ? 'User Reviews' : 'My Reviews'}</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map((item, idx) => (
          <li key={item.reviewedAt + item.albumName + idx} style={{ background: '#23263a', borderRadius: 12, padding: 20, marginBottom: 18, boxShadow: '0 1px 8px #0002', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {item.image && <img src={item.image} alt={item.albumName} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />}
              <div style={{ flex: 1 }}>
                <Link
                  to={`/album/${encodeURIComponent(item.albumId)}`}
                  style={{ color: '#a084ee', fontWeight: 700, fontSize: 18 }}
                >
                  {item.albumName}
                </Link> by <Link to={`/artist/${encodeURIComponent(item.artistId)}`} style={{ color: '#7fd7ff', fontWeight: 500, fontSize: 16 }}>{item.artist}</Link>: <b>{item.rating}/5</b>
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

      {/* Delete confirmation modal */}
      {showDeleteIdx && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#23263a', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 2px 24px #0008', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h3 style={{ color: '#a084ee', margin: 0 }}>Delete Review</h3>
            <div style={{ color: '#e0e6ed', marginBottom: 8 }}>Are you sure you want to delete this review?</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <button onClick={() => confirmDelete(reviews.find(r => r.albumId === showDeleteIdx))} style={{ background: '#ff7f7f', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
              <button onClick={cancelDelete} style={{ background: '#35384d', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Edit review modal */}
      {editIdx !== null && ReactDOM.createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#23263a', borderRadius: 16, padding: 32, minWidth: 320, boxShadow: '0 2px 24px #0008', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h3 style={{ color: '#a084ee', margin: 0 }}>Edit Review</h3>
            <div style={{ color: '#e0e6ed', marginBottom: 8 }}>Edit your review and rating below:</div>
            <textarea
              value={editReview}
              onChange={e => setEditReview(e.target.value)}
              style={{ width: 240, minHeight: 60, borderRadius: 8, border: '1px solid #7fd7ff', padding: 8, marginTop: 8 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#aaa' }}>Rating:</span>
              <StarRating value={editRating} onChange={setEditRating} />
              <span style={{ color: '#aaa' }}>/5</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <button onClick={() => saveEdit(reviews[editIdx])} style={{ background: '#7fd7ff', color: '#181a20', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
              <button onClick={cancelEdit} style={{ background: '#35384d', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

export default MyReviews; 