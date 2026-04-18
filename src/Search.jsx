import React, { useState, useEffect, useCallback } from 'react';
import API_BASE_URL from './config';
import HalfStarRating from './components/HalfStarRating';

function buildDiaryBodyFromModal(modalKind, album, track, rating, notes) {
  if (modalKind === 'album' && album) {
    return {
      kind: 'album',
      spotifyId: album.id,
      title: album.name,
      image: album.images?.[0]?.url || '',
      primaryArtistName: album.artists?.[0]?.name || '',
      primaryArtistId: album.artists?.[0]?.id || '',
      albumName: '',
      albumId: '',
      rating,
      notes,
    };
  }
  if (modalKind === 'track' && track) {
    return {
      kind: 'track',
      spotifyId: track.id,
      title: track.name,
      image: track.album?.images?.[0]?.url || '',
      primaryArtistName: track.artists?.[0]?.name || '',
      primaryArtistId: track.artists?.[0]?.id || '',
      albumName: track.album?.name || '',
      albumId: track.album?.id || '',
      rating,
      notes,
    };
  }
  return null;
}

function buildFromSearchAlbum(album) {
  return {
    kind: 'album',
    spotifyId: album.id,
    title: album.name,
    image: album.images?.[0]?.url || '',
    primaryArtistName: album.artists?.[0]?.name || '',
    primaryArtistId: album.artists?.[0]?.id || '',
    albumName: '',
    albumId: '',
  };
}

function buildFromSearchTrack(track) {
  return {
    kind: 'track',
    spotifyId: track.id,
    title: track.name,
    image: track.album?.images?.[0]?.url || '',
    primaryArtistName: track.artists?.[0]?.name || '',
    primaryArtistId: track.artists?.[0]?.id || '',
    albumName: track.album?.name || '',
    albumId: track.album?.id || '',
  };
}

const Search = ({ user, onDiaryEntrySave, setProfileInfo }) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('album');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState(null);
  const [modalAlbum, setModalAlbum] = useState(null);
  const [modalTrack, setModalTrack] = useState(null);
  const [modalRating, setModalRating] = useState(0);
  const [modalReview, setModalReview] = useState('');
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);
  const [tracklists, setTracklists] = useState({});
  const [modalMessage, setModalMessage] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const [rowMenuKey, setRowMenuKey] = useState(null);
  const [listPicker, setListPicker] = useState(null);
  const [listChoices, setListChoices] = useState([]);
  const [listPickLoading, setListPickLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');
  const [listPickError, setListPickError] = useState('');
  const [listPickSaving, setListPickSaving] = useState(false);

  const placeholder =
    searchType === 'album' ? 'Search for an album…' : 'Search for a song…';

  useEffect(() => {
    if (!rowMenuKey) return;
    const close = (e) => {
      if (!e.target.closest?.('.search-result-add-wrap')) setRowMenuKey(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setRowMenuKey(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [rowMenuKey]);

  useEffect(() => {
    if (!listPicker || !user?.id) return;
    let cancelled = false;
    (async () => {
      setListPickLoading(true);
      setListPickError('');
      try {
        const params = new URLSearchParams({
          userId: user.id,
          kind: listPicker.kind,
          sort: 'name',
          order: 'asc',
        });
        const r = await fetch(`${API_BASE_URL}/api/lists?${params}`);
        const data = await r.json();
        if (!cancelled) setListChoices(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) {
          setListChoices([]);
          setListPickError('Could not load lists');
        }
      }
      if (!cancelled) setListPickLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listPicker, user?.id]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await fetch(
        `${API_BASE_URL}/api/spotify/search?query=${encodeURIComponent(query)}&type=${searchType}`
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Search failed');
      setResults(data);
      if (setProfileInfo && user?.id) {
        const pr = await fetch(`${API_BASE_URL}/api/auth/profile?id=${user.id}`);
        const profile = await pr.json();
        if (!profile.message) setProfileInfo(profile);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message);
      setResults({});
    }
    setLoading(false);
  };

  const openAddModalAlbum = (album) => {
    setModalKind('album');
    setModalAlbum(album);
    setModalTrack(null);
    setModalRating(0);
    setModalReview('');
    setModalMessage('');
    setModalOpen(true);
  };

  const openAddModalTrack = (track) => {
    setModalKind('track');
    setModalTrack(track);
    setModalAlbum(null);
    setModalRating(0);
    setModalReview('');
    setModalMessage('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalKind(null);
    setModalAlbum(null);
    setModalTrack(null);
    setModalRating(0);
    setModalReview('');
    setModalMessage('');
  };

  const closeListPicker = useCallback(() => {
    setListPicker(null);
    setListChoices([]);
    setSelectedListId('');
    setListPickError('');
  }, []);

  const handleReviewSave = async () => {
    if (!onDiaryEntrySave || !user?.id) {
      setModalMessage('You need to be signed in to save.');
      return;
    }
    if (modalRating <= 0) {
      setModalMessage('Choose a rating (tap or hover the stars).');
      return;
    }
    const body = buildDiaryBodyFromModal(modalKind, modalAlbum, modalTrack, modalRating, modalReview);
    if (!body) {
      setModalMessage('Nothing to save.');
      return;
    }
    setModalSaving(true);
    setModalMessage('');
    try {
      await onDiaryEntrySave(body);
      setModalMessage('Saved to your diary!');
      setTimeout(() => {
        setModalSaving(false);
        closeModal();
      }, 1000);
    } catch (err) {
      setModalMessage(err.message || 'Could not save.');
      setModalSaving(false);
      console.error('Diary save error:', err);
    }
  };

  const handleAlbumClick = async (album) => {
    if (expandedAlbumId === album.id) {
      setExpandedAlbumId(null);
      return;
    }
    setExpandedAlbumId(album.id);
    if (!tracklists[album.id]) {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/spotify/album/${album.id}`);
        const data = await resp.json();
        if (!resp.ok) {
          setTracklists((tl) => ({ ...tl, [album.id]: data.message || 'Failed to fetch tracklist.' }));
          return;
        }
        setTracklists((tl) => ({ ...tl, [album.id]: data.tracks ? data.tracks.items : [] }));
      } catch {
        setTracklists((tl) => ({ ...tl, [album.id]: 'Failed to fetch tracklist.' }));
      }
    }
  };

  const addSearchItemToList = async () => {
    if (!user?.id || !listPicker || !selectedListId) return;
    const fromSearch =
      listPicker.kind === 'album' ? buildFromSearchAlbum(listPicker.album) : buildFromSearchTrack(listPicker.track);
    setListPickSaving(true);
    setListPickError('');
    try {
      const payload = {
        userId: String(user.id),
        fromSearch: {
          kind: fromSearch.kind,
          spotifyId: String(fromSearch.spotifyId),
          title: String(fromSearch.title),
          image: fromSearch.image || '',
          primaryArtistName: fromSearch.primaryArtistName || '',
          albumName: fromSearch.albumName || '',
        },
      };
      const r = await fetch(`${API_BASE_URL}/api/lists/${selectedListId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Add failed');
      closeListPicker();
    } catch (e) {
      setListPickError(e.message || 'Add failed');
    }
    setListPickSaving(false);
  };

  const albumItems = results?.albums?.items;
  const trackItems = results?.tracks?.items;

  const modalTitle =
    modalKind === 'track' ? modalTrack?.name : modalKind === 'album' ? modalAlbum?.name : '';
  const modalSubtitle =
    modalKind === 'track'
      ? [modalTrack?.artists?.map((a) => a.name).join(', '), modalTrack?.album?.name].filter(Boolean).join(' · ')
      : modalKind === 'album'
        ? modalAlbum?.artists?.[0]?.name
        : '';

  const listPickTitle =
    listPicker?.kind === 'album' ? listPicker.album?.name : listPicker?.kind === 'track' ? listPicker.track?.name : '';

  const renderAddMenu = (rowKey, album, track) => (
    <div className="search-result-add-wrap">
      <button
        type="button"
        className="search-result-add"
        aria-expanded={rowMenuKey === rowKey}
        aria-haspopup="menu"
        aria-label="Add options"
        onClick={(e) => {
          e.stopPropagation();
          setRowMenuKey((k) => (k === rowKey ? null : rowKey));
        }}
      >
        +
      </button>
      {rowMenuKey === rowKey && (
        <div className="search-add-popover" role="menu" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            role="menuitem"
            className="search-add-popover__item"
            onClick={() => {
              setRowMenuKey(null);
              if (album) openAddModalAlbum(album);
              else openAddModalTrack(track);
            }}
          >
            Add to diary
          </button>
          <button
            type="button"
            role="menuitem"
            className="search-add-popover__item"
            onClick={() => {
              setRowMenuKey(null);
              setSelectedListId('');
              setListPickError('');
              if (album) setListPicker({ kind: 'album', album });
              else setListPicker({ kind: 'track', track });
            }}
          >
            Add to list
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <h2>Search Music</h2>
      <div className="search-form search-form--stacked">
        <form onSubmit={handleSearch}>
          <select
            className="search-type-select"
            value={searchType}
            onChange={(e) => {
              setSearchType(e.target.value);
              setResults({});
            }}
            aria-label="Search type"
          >
            <option value="album">Albums</option>
            <option value="track">Songs</option>
          </select>
          <input type="text" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>
      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1em', textAlign: 'center' }}>{error}</div>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {searchType === 'album' &&
          Array.isArray(albumItems) &&
          albumItems.map((album) => (
            <li key={album.id} className="search-result" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="search-result-row">
                {album.images && album.images[0] && (
                  <img src={album.images[0].url} alt="" style={{ width: 64, height: 64, borderRadius: 8 }} />
                )}
                <div className="search-result-row__text">
                  <button
                    type="button"
                    onClick={() => handleAlbumClick(album)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                    }}
                  >
                    {album.name}
                  </button>
                  <span style={{ color: 'var(--color-fg-muted)' }}> — {album.artists[0]?.name}</span>
                </div>
                {renderAddMenu(`album:${album.id}`, album, null)}
              </div>
              {expandedAlbumId === album.id && (
                <div
                  style={{
                    marginLeft: 80,
                    marginTop: 8,
                    background: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {Array.isArray(tracklists[album.id]) ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {tracklists[album.id].map((track) => (
                        <li key={track.id} style={{ marginBottom: 4 }}>
                          {track.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--color-danger)' }}>{tracklists[album.id]}</span>
                  )}
                </div>
              )}
            </li>
          ))}
        {searchType === 'track' &&
          Array.isArray(trackItems) &&
          trackItems.map((track) => (
            <li key={track.id} className="search-result">
              <div className="search-result-row">
                {track.album?.images?.[0] && (
                  <img src={track.album.images[0].url} alt="" style={{ width: 64, height: 64, borderRadius: 8 }} />
                )}
                <div className="search-result-row__text">
                  <div style={{ fontWeight: 700, color: 'var(--color-fg)' }}>{track.name}</div>
                  <div style={{ color: 'var(--color-fg-muted)', fontSize: '0.95em' }}>
                    {track.artists?.map((a) => a.name).join(', ')}
                    {track.album?.name ? ` · ${track.album.name}` : ''}
                  </div>
                </div>
                {renderAddMenu(`track:${track.id}`, null, track)}
              </div>
            </li>
          ))}
      </ul>
      {modalOpen && (
        <div
          className="search-add-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'var(--color-modal-overlay, rgba(47, 62, 70, 0.55))',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            boxSizing: 'border-box',
          }}
        >
          <div
            className="search-add-modal"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 420,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 2px 24px rgba(47, 62, 70, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 14,
              boxSizing: 'border-box',
            }}
          >
            <h3 style={{ margin: 0, textAlign: 'center' }}>Add to diary</h3>
            <div style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: 17, textAlign: 'center' }}>{modalTitle}</div>
            <div style={{ color: 'var(--color-fg-muted)', fontSize: '0.95em', textAlign: 'center' }}>{modalSubtitle}</div>
            <div style={{ textAlign: 'center' }}>
              <HalfStarRating value={modalRating} onChange={setModalRating} size={32} disabled={modalSaving} />
            </div>
            <textarea
              className="search-add-modal__notes"
              placeholder="Write as much as you want…"
              value={modalReview}
              onChange={(e) => setModalReview(e.target.value)}
              rows={10}
            />
            {modalMessage && (
              <div
                style={{
                  color: modalMessage.includes('Saved') ? 'var(--color-accent)' : 'var(--color-danger)',
                  textAlign: 'center',
                  fontSize: '0.95em',
                }}
              >
                {modalMessage}
              </div>
            )}
            <div className="search-add-modal__actions">
              <button type="button" onClick={handleReviewSave} disabled={modalSaving || modalRating <= 0}>
                Save to diary
              </button>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'var(--color-card-solid)', color: 'var(--color-fg)' }}
                disabled={modalSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {listPicker && (
        <div
          className="search-add-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-list-picker-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-modal-overlay, rgba(47, 62, 70, 0.55))',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={closeListPicker}
        >
          <div
            className="search-add-modal diary-list-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <h3 id="search-list-picker-title" style={{ marginTop: 0, textAlign: 'center' }}>
              Add to list
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)', marginTop: 0, fontSize: '0.95em' }}>
              <strong>{listPickTitle}</strong>
            </p>
            {listPickLoading && <p style={{ textAlign: 'center' }}>Loading lists…</p>}
            {!listPickLoading && (
              <>
                <label htmlFor="search-pick-list" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Choose list
                </label>
                <select
                  id="search-pick-list"
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  aria-label="Choose list"
                >
                  <option value="">Select a list…</option>
                  {listChoices.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {listChoices.length === 0 && (
                  <p style={{ color: 'var(--color-fg-muted)', fontSize: '0.9em', textAlign: 'center', margin: '8px 0' }}>
                    No lists yet. Create one on the <strong>Lists</strong> tab.
                  </p>
                )}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={addSearchItemToList}
                    disabled={listPickSaving || !selectedListId || listChoices.length === 0}
                  >
                    Add to list
                  </button>
                </div>
              </>
            )}
            {listPickError && (
              <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: 0 }}>{listPickError}</p>
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'var(--color-card-solid)', color: 'var(--color-fg)' }}
                onClick={closeListPicker}
                disabled={listPickSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
