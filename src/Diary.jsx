import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import API_BASE_URL from './config';
import { ReadOnlyStarRow } from './components/HalfStarRating';

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

export default function Diary({ user }) {
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

  return (
    <div className="search-form" style={{ maxWidth: 640 }}>
      <h2>Diary</h2>
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

      {error && <p style={{ color: 'var(--color-danger)', textAlign: 'center' }}>{error}</p>}
      {loading && <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
          Nothing logged yet. Use the <strong>Search</strong> tab to add music.
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
        {entries.map((item) => (
          <li key={item._id} className="search-result diary-entry-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button
              type="button"
              className="search-result-add diary-entry-add"
              aria-label="Add to list"
              onClick={() => openListModal(item)}
            >
              +
            </button>
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
            <button type="button" className="diary-delete-btn" onClick={() => handleDelete(item._id)}>
              Delete
            </button>
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
    </div>
  );
}
