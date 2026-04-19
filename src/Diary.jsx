import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import API_BASE_URL from './config';
import HalfStarRating, { ReadOnlyStarRow } from './components/HalfStarRating';

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

function CollapsibleDiaryNotes({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [needsMore, setNeedsMore] = useState(false);
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !text) {
      setNeedsMore(false);
      return;
    }
    if (expanded) return;

    const measure = () => {
      const node = ref.current;
      if (!node || expanded) return;
      setNeedsMore(node.scrollHeight > node.clientHeight + 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div className="diary-notes-block">
      <p ref={ref} className={expanded ? 'diary-notes diary-notes--expanded' : 'diary-notes'}>
        {text}
      </p>
      {!expanded && needsMore && (
        <button type="button" className="diary-notes-toggle" onClick={() => setExpanded(true)}>
          More
        </button>
      )}
      {expanded && (
        <button type="button" className="diary-notes-toggle" onClick={() => setExpanded(false)}>
          Less
        </button>
      )}
    </div>
  );
}

export default function Diary({ user, onDiaryEntrySave }) {
  const [entries, setEntries] = useState([]);
  const [kindFilter, setKindFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [listModalEntry, setListModalEntry] = useState(null);
  const [listChoices, setListChoices] = useState([]);
  const [listModalLoading, setListModalLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');
  const [listModalError, setListModalError] = useState('');
  const [listModalSaving, setListModalSaving] = useState(false);
  const [openEntryMenuId, setOpenEntryMenuId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('album');
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalKind, setSaveModalKind] = useState(null);
  const [saveModalAlbum, setSaveModalAlbum] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saveModalRating, setSaveModalRating] = useState(0);
  const [saveModalNotes, setSaveModalNotes] = useState('');
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [saveModalSaving, setSaveModalSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError('');
    try {
      const params = new URLSearchParams({
        userId: user.id,
        kind: kindFilter,
        sort: sortKey,
        order: sortOrder,
      });
      const r = await fetch(`${API_BASE_URL}/api/diary/entries?${params}`);
      const data = await r.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Could not load diary');
      setEntries([]);
    }
  }, [user?.id, kindFilter, sortKey, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!openEntryMenuId) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenEntryMenuId(null);
    };
    const onDown = (e) => {
      if (!e.target.closest?.('.diary-entry-menu')) setOpenEntryMenuId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [openEntryMenuId]);

  const handleDelete = async (id) => {
    if (!user?.id) return;
    if (!window.confirm('Remove this entry from your diary?')) return;
    try {
      await fetch(
        `${API_BASE_URL}/api/diary/entries/${id}?userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      );
      await load();
    } catch {
      setError('Delete failed');
    }
  };

  const kindBtnClass = (k) =>
    `diary-toolbar-btn${kindFilter === k ? ' diary-toolbar-btn--active' : ''}`;

  const closeListModal = () => {
    setListModalEntry(null);
    setListChoices([]);
    setSelectedListId('');
    setListModalError('');
  };

  const openListModal = async (entry) => {
    if (!user?.id) return;
    setListModalEntry(entry);
    setSelectedListId('');
    setListModalError('');
    setListModalLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.id,
        kind: entry.kind,
        sort: 'name',
        order: 'asc',
      });
      const r = await fetch(`${API_BASE_URL}/api/lists?${params}`);
      const data = await r.json();
      setListChoices(Array.isArray(data) ? data : []);
    } catch {
      setListChoices([]);
      setListModalError('Could not load lists');
    }
    setListModalLoading(false);
  };

  const addToExistingList = async () => {
    if (!user?.id || !listModalEntry || !selectedListId) return;
    setListModalSaving(true);
    setListModalError('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/lists/${selectedListId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, diaryEntryId: listModalEntry._id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Add failed');
      closeListModal();
    } catch (e) {
      setListModalError(e.message || 'Add failed');
    }
    setListModalSaving(false);
  };

  const runSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    const query = searchQuery.trim();

    const fetchSearchJson = async (url) => {
      const r = await fetch(url);
      const raw = await r.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = null;
      }
      return { r, data, raw };
    };

    try {
      let result = await fetchSearchJson(
        `${API_BASE_URL}/api/diary/search?query=${encodeURIComponent(query)}&type=${searchType}`
      );

      // Backward compatibility when backend is still serving old /api/spotify/search.
      if (
        !result.r.ok &&
        result.r.status === 404 &&
        typeof result.raw === 'string' &&
        result.raw.includes('Cannot GET /api/diary/search')
      ) {
        result = await fetchSearchJson(
          `${API_BASE_URL}/api/spotify/search?query=${encodeURIComponent(query)}&type=${searchType}`
        );
      }

      if (!result.r.ok) {
        throw new Error(result.data?.message || 'Search failed');
      }
      if (!result.data || typeof result.data !== 'object') {
        throw new Error('Search response was not valid JSON');
      }
      setSearchResults(result.data);
    } catch (err) {
      setSearchResults({});
      setSearchError(err.message || 'Search failed');
    }
    setSearchLoading(false);
  };

  const openSaveModalAlbum = (album) => {
    setEditingEntry(null);
    setSaveModalKind('album');
    setSaveModalAlbum(album);
    setSaveModalTrack(null);
    setSaveModalRating(0);
    setSaveModalNotes('');
    setSaveModalMessage('');
    setSaveModalOpen(true);
  };

  const openSaveModalTrack = (track) => {
    setEditingEntry(null);
    setSaveModalKind('track');
    setSaveModalTrack(track);
    setSaveModalAlbum(null);
    setSaveModalRating(0);
    setSaveModalNotes('');
    setSaveModalMessage('');
    setSaveModalOpen(true);
  };

  const closeSaveModal = () => {
    setSaveModalOpen(false);
    setEditingEntry(null);
    setSaveModalKind(null);
    setSaveModalAlbum(null);
    setSaveModalTrack(null);
    setSaveModalRating(0);
    setSaveModalNotes('');
    setSaveModalMessage('');
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setSaveModalKind(entry.kind);
    setSaveModalAlbum(null);
    setSaveModalTrack(null);
    setSaveModalRating(Number(entry.rating) || 0);
    setSaveModalNotes(entry.notes || '');
    setSaveModalMessage('');
    setSaveModalOpen(true);
  };

  const submitSaveModal = async () => {
    if (!user?.id) {
      setSaveModalMessage('You need to be signed in to save.');
      return;
    }
    if (saveModalRating <= 0) {
      setSaveModalMessage('Choose a rating first.');
      return;
    }
    setSaveModalSaving(true);
    setSaveModalMessage('');
    try {
      if (editingEntry?._id) {
        const r = await fetch(`${API_BASE_URL}/api/diary/entries/${editingEntry._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            rating: saveModalRating,
            notes: saveModalNotes,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Save failed');
      } else {
        if (!onDiaryEntrySave) {
          throw new Error('You need to be signed in to save.');
        }
        const body = buildDiaryBodyFromModal(
          saveModalKind,
          saveModalAlbum,
          saveModalTrack,
          saveModalRating,
          saveModalNotes
        );
        if (!body) throw new Error('Save failed');
        await onDiaryEntrySave(body);
      }
      await load();
      setSaveModalMessage('Saved to your diary.');
      setTimeout(() => {
        setSaveModalSaving(false);
        closeSaveModal();
      }, 700);
    } catch (err) {
      setSaveModalMessage(err.message || 'Save failed');
      setSaveModalSaving(false);
    }
  };

  const albumItems = searchResults?.albums?.items;
  const trackItems = searchResults?.tracks?.items;

  return (
    <div className="search-form">
      <div className="diary-toolbar">
        {['all', 'album', 'track'].map((k) => (
          <button key={k} type="button" className={kindBtnClass(k)} onClick={() => setKindFilter(k)}>
            {k === 'all' ? 'All' : k === 'album' ? 'Albums' : 'Tracks'}
          </button>
        ))}
        <button
          type="button"
          className={`diary-toolbar-btn diary-toolbar-btn--muted${sortKey === 'date' ? ' diary-toolbar-btn--active' : ''}`}
          onClick={() => setSortKey('date')}
        >
          Date
        </button>
        <button
          type="button"
          className={`diary-toolbar-btn diary-toolbar-btn--muted${sortKey === 'rating' ? ' diary-toolbar-btn--active' : ''}`}
          onClick={() => setSortKey('rating')}
        >
          Rating
        </button>
        <button
          type="button"
          className="diary-toolbar-btn diary-toolbar-btn--muted"
          onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
        >
          Order: {sortOrder === 'desc' ? '↓' : '↑'}
        </button>
        <button type="button" className="diary-toolbar-btn diary-toolbar-btn--muted" onClick={() => load()}>
          Refresh
        </button>
      </div>

      <div className="diary-search-launch-wrap">
        <button
          type="button"
          className="lists-new-btn"
          aria-label="Search to add diary entry"
          onClick={() => setSearchOpen((v) => !v)}
        >
          +
        </button>
      </div>

      {searchOpen && (
        <div
          className="search-add-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-search-modal-title"
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
          onClick={() => {
            setSearchOpen(false);
            setSearchResults({});
            setSearchError('');
          }}
        >
          <div
            className="search-add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 520,
              width: '100%',
              maxHeight: '88vh',
              overflow: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div className="diary-search-popout__header">
              <button
                type="button"
                className="diary-toolbar-btn diary-toolbar-btn--muted diary-search-popout__back"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchResults({});
                  setSearchError('');
                }}
              >
                Back
              </button>
            </div>
            <h3 id="diary-search-modal-title" style={{ marginTop: 0, textAlign: 'center' }}>
              Search Music
            </h3>
            <div className="search-form--stacked">
              <form onSubmit={runSearch}>
                <select
                  className="search-type-select"
                  value={searchType}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setSearchResults({});
                  }}
                  aria-label="Search type"
                >
                  <option value="album">Albums</option>
                  <option value="track">Songs</option>
                </select>
                <input
                  type="text"
                  placeholder={searchType === 'album' ? 'Search for an album…' : 'Search for a song…'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
            {searchError && <p style={{ color: 'var(--color-danger)', marginBottom: 0 }}>{searchError}</p>}
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {searchType === 'album' &&
                Array.isArray(albumItems) &&
                albumItems.map((album) => (
                  <li key={album.id} className="search-result search-result-row">
                    {album.images?.[0] && (
                      <img src={album.images[0].url} alt="" style={{ width: 56, height: 56, borderRadius: 8 }} />
                    )}
                    <div className="search-result-row__text">
                      <div style={{ fontWeight: 700 }}>{album.name}</div>
                      <div style={{ color: 'var(--color-fg-muted)' }}>{album.artists?.[0]?.name}</div>
                    </div>
                    <button type="button" className="search-result-add" onClick={() => openSaveModalAlbum(album)}>
                      +
                    </button>
                  </li>
                ))}
              {searchType === 'track' &&
                Array.isArray(trackItems) &&
                trackItems.map((track) => (
                  <li key={track.id} className="search-result search-result-row">
                    {track.album?.images?.[0] && (
                      <img src={track.album.images[0].url} alt="" style={{ width: 56, height: 56, borderRadius: 8 }} />
                    )}
                    <div className="search-result-row__text">
                      <div style={{ fontWeight: 700 }}>{track.name}</div>
                      <div style={{ color: 'var(--color-fg-muted)' }}>
                        {[track.artists?.map((a) => a.name).join(', '), track.album?.name].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button type="button" className="search-result-add" onClick={() => openSaveModalTrack(track)}>
                      +
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'var(--color-danger)', textAlign: 'center' }}>{error}</p>}
      {loading && <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
          Nothing logged yet. Use the + button above to search and add music.
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
        {entries.map((item) => (
          <li key={item._id} className="search-result diary-entry-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="lists-card-menu diary-entry-menu">
              <button
                type="button"
                className="lists-card-menu-btn"
                aria-haspopup="menu"
                aria-expanded={openEntryMenuId === item._id}
                aria-label="Entry options"
                onClick={() => setOpenEntryMenuId((id) => (id === item._id ? null : item._id))}
              >
                ⋯
              </button>
              {openEntryMenuId === item._id && (
                <div className="lists-card-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="lists-card-menu-item"
                    onClick={() => {
                      setOpenEntryMenuId(null);
                      openEditModal(item);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="lists-card-menu-item"
                    onClick={() => {
                      setOpenEntryMenuId(null);
                      openListModal(item);
                    }}
                  >
                    Add to list
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="lists-card-menu-item lists-card-menu-item--danger"
                    onClick={() => {
                      setOpenEntryMenuId(null);
                      handleDelete(item._id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img
                src={item.image || 'https://via.placeholder.com/56'}
                alt=""
                style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-fg-muted)' }}>
                  {item.kind}
                </div>
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: 14, color: 'var(--color-fg-muted)' }}>{item.primaryArtistName}</div>
                {item.kind === 'track' && item.albumName && (
                  <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-fg-muted)' }}>{item.albumName}</div>
                )}
                <div style={{ marginTop: 6 }}>
                  <ReadOnlyStarRow value={item.rating} size={20} />
                </div>
                {item.notes && <CollapsibleDiaryNotes text={item.notes} />}
                <div style={{ fontSize: 12, color: 'var(--color-fg-muted)', marginTop: 8 }}>
                  {new Date(item.loggedAt).toLocaleString()}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {listModalEntry && (
        <div
          className="search-add-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-list-modal-title"
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
          onClick={closeListModal}
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
            <h3 id="diary-list-modal-title" style={{ marginTop: 0, textAlign: 'center' }}>
              Add to list
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)', marginTop: 0, fontSize: '0.95em' }}>
              <strong>{listModalEntry.title}</strong>
              <br />
              {listModalEntry.kind === 'album' ? 'Album lists' : 'Song lists'}
            </p>
            {listModalLoading && <p style={{ textAlign: 'center' }}>Loading lists…</p>}
            {!listModalLoading && (
              <>
                <label htmlFor="diary-pick-list" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Existing list
                </label>
                <select
                  id="diary-pick-list"
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
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <button type="button" onClick={addToExistingList} disabled={listModalSaving || !selectedListId}>
                    Add to list
                  </button>
                </div>
              </>
            )}
            {listModalError && (
              <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: 0 }}>{listModalError}</p>
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                type="button"
                style={{ background: 'var(--color-card-solid)', color: 'var(--color-fg)' }}
                onClick={closeListModal}
                disabled={listModalSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {saveModalOpen && (
        <div
          className="search-add-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-save-modal-title"
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
          onClick={closeSaveModal}
        >
          <div
            className="search-add-modal"
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
            <h3 id="diary-save-modal-title" style={{ marginTop: 0, textAlign: 'center' }}>
              {editingEntry ? 'Edit diary entry' : 'Add to Diary'}
            </h3>
            <p style={{ textAlign: 'center', marginTop: 0, color: 'var(--color-fg-muted)' }}>
              <strong>
                {editingEntry
                  ? editingEntry.title
                  : saveModalKind === 'album'
                    ? saveModalAlbum?.name
                    : saveModalTrack?.name}
              </strong>
              {editingEntry?.primaryArtistName && (
                <>
                  <br />
                  {editingEntry.primaryArtistName}
                </>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <HalfStarRating value={saveModalRating} onChange={setSaveModalRating} size={34} />
            </div>
            <textarea
              className="search-add-modal__notes"
              placeholder="Add a note (optional)"
              value={saveModalNotes}
              onChange={(e) => setSaveModalNotes(e.target.value)}
            />
            {saveModalMessage && (
              <div style={{ marginTop: 10, textAlign: 'center', color: saveModalMessage.includes('Saved') ? 'var(--color-accent)' : 'var(--color-danger)' }}>
                {saveModalMessage}
              </div>
            )}
            <div className="search-add-modal__actions" style={{ marginTop: 12 }}>
              <button type="button" onClick={submitSaveModal} disabled={saveModalSaving || saveModalRating <= 0}>
                {editingEntry ? 'Save changes' : 'Save to diary'}
              </button>
              <button type="button" onClick={closeSaveModal} disabled={saveModalSaving} style={{ background: 'var(--color-card-solid)', color: 'var(--color-fg)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
