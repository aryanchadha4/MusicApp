import { useCallback, useEffect, useState } from 'react';
import API_BASE_URL from './config';

export default function Lists({ user }) {
  const [openMenuListId, setOpenMenuListId] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newItemKind, setNewItemKind] = useState('album');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [addModalList, setAddModalList] = useState(null);
  const [addQuery, setAddQuery] = useState('');
  const [addResults, setAddResults] = useState({});
  const [addLoading, setAddLoading] = useState(false);
  const [addSavingId, setAddSavingId] = useState('');
  const [addError, setAddError] = useState('');

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
      const r = await fetch(`${API_BASE_URL}/api/lists?${params}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to load lists');
      setLists(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Could not load lists');
      setLists([]);
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
    if (!openMenuListId) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenuListId(null);
    };
    const onDown = (e) => {
      if (!e.target.closest?.('.lists-card-menu')) setOpenMenuListId(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [openMenuListId]);

  const kindBtnClass = (k) =>
    `diary-toolbar-btn${kindFilter === k ? ' diary-toolbar-btn--active' : ''}`;

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!user?.id || !newName.trim()) return;
    setCreateSaving(true);
    setCreateError('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newName.trim(),
          itemKind: newItemKind,
          displayMode: 'both',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Create failed');
      setCreateOpen(false);
      setNewName('');
      setNewItemKind('album');
      await load();
    } catch (err) {
      setCreateError(err.message || 'Create failed');
    }
    setCreateSaving(false);
  };

  const patchDisplayMode = async (listId, displayMode) => {
    if (!user?.id) return;
    try {
      const r = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, displayMode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setLists((prev) => prev.map((L) => (L._id === listId ? { ...L, ...data } : L)));
    } catch (e) {
      setError(e.message || 'Update failed');
    }
  };

  const removeItem = async (listId, item) => {
    if (!user?.id || !item?._id) return;
    const kindWord = item.kind === 'track' ? 'song' : 'album';
    const namePart = item.title?.trim() ? `"${item.title.trim()}"` : `this ${kindWord}`;
    if (!window.confirm(`Remove ${namePart} from this list?`)) return;
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/lists/${listId}/items/by-id/${item._id}?userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setLists((prev) => prev.map((L) => (L._id === listId ? { ...data } : L)));
    } catch (e) {
      setError(e.message || 'Remove failed');
    }
  };

  const deleteList = async (listId) => {
    if (!user?.id) return;
    if (!window.confirm('Delete this list and all its items?')) return;
    setOpenMenuListId(null); // close menu after confirm
    try {
      const r = await fetch(
        `${API_BASE_URL}/api/lists/${listId}?userId=${encodeURIComponent(user.id)}`,
        { method: 'DELETE' }
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setLists((prev) => prev.filter((L) => L._id !== listId));
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const closeAddModal = () => {
    setAddModalList(null);
    setAddQuery('');
    setAddResults({});
    setAddLoading(false);
    setAddSavingId('');
    setAddError('');
  };

  const runListSearch = async (e) => {
    e.preventDefault();
    if (!addModalList || !addQuery.trim()) return;
    const query = addQuery.trim();
    const type = addModalList.itemKind === 'track' ? 'track' : 'album';
    setAddLoading(true);
    setAddError('');

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
        `${API_BASE_URL}/api/diary/search?query=${encodeURIComponent(query)}&type=${type}`
      );

      if (
        !result.r.ok &&
        result.r.status === 404 &&
        typeof result.raw === 'string' &&
        result.raw.includes('Cannot GET /api/diary/search')
      ) {
        result = await fetchSearchJson(
          `${API_BASE_URL}/api/spotify/search?query=${encodeURIComponent(query)}&type=${type}`
        );
      }

      if (!result.r.ok) throw new Error(result.data?.message || 'Search failed');
      if (!result.data || typeof result.data !== 'object') {
        throw new Error('Search response was not valid JSON');
      }
      setAddResults(result.data);
    } catch (err) {
      setAddResults({});
      setAddError(err.message || 'Search failed');
    }
    setAddLoading(false);
  };

  const addSearchItemToList = async (list, rawItem) => {
    if (!user?.id || !list?._id || !rawItem?.id) return;
    const payload =
      list.itemKind === 'track'
        ? {
            kind: 'track',
            spotifyId: String(rawItem.id),
            title: String(rawItem.name || ''),
            image: rawItem.album?.images?.[0]?.url || '',
            primaryArtistName: rawItem.artists?.[0]?.name || '',
            albumName: rawItem.album?.name || '',
          }
        : {
            kind: 'album',
            spotifyId: String(rawItem.id),
            title: String(rawItem.name || ''),
            image: rawItem.images?.[0]?.url || '',
            primaryArtistName: rawItem.artists?.[0]?.name || '',
            albumName: '',
          };
    setAddSavingId(String(rawItem.id));
    setAddError('');
    try {
      const r = await fetch(`${API_BASE_URL}/api/lists/${list._id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: String(user.id),
          fromSearch: payload,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Add failed');
      setLists((prev) => prev.map((L) => (L._id === list._id ? { ...data } : L)));
    } catch (err) {
      setAddError(err.message || 'Add failed');
    }
    setAddSavingId('');
  };

  const renderListItem = (list, item) => {
    const mode = list.displayMode || 'both';
    const subtitle = [item.primaryArtistName, item.kind === 'track' ? item.albumName : null]
      .filter(Boolean)
      .join(' · ');

    if (mode === 'cover') {
      return (
        <div key={item._id} className="lists-item lists-item--cover-only">
          <img src={item.image || 'https://via.placeholder.com/64'} alt={item.title || 'Cover'} />
          <button
            type="button"
            className="lists-item-remove"
            onClick={() => removeItem(list._id, item)}
            aria-label="Remove from list"
          >
            ×
          </button>
        </div>
      );
    }
    if (mode === 'name') {
      return (
        <div key={item._id} className="search-result lists-item lists-item--name-only">
          <div className="lists-item-body">
            <div style={{ fontWeight: 700 }}>{item.title}</div>
            {subtitle && <div style={{ fontSize: 14, color: 'var(--color-fg-muted)' }}>{subtitle}</div>}
          </div>
          <button type="button" className="lists-item-remove" onClick={() => removeItem(list._id, item)}>
            Remove
          </button>
        </div>
      );
    }
    return (
      <div key={item._id} className="search-result lists-item lists-item--both">
        {item.image && <img src={item.image} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />}
        <div className="lists-item-body" style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{item.title}</div>
          {subtitle && <div style={{ fontSize: 14, color: 'var(--color-fg-muted)' }}>{subtitle}</div>}
        </div>
        <button type="button" className="lists-item-remove" onClick={() => removeItem(list._id, item)}>
          Remove
        </button>
      </div>
    );
  };

  return (
    <div className="search-form">
      <div className="diary-toolbar">
        {['all', 'album', 'track'].map((k) => (
          <button key={k} type="button" className={kindBtnClass(k)} onClick={() => setKindFilter(k)}>
            {k === 'all' ? 'All' : k === 'album' ? 'Album lists' : 'Track lists'}
          </button>
        ))}
        <button
          type="button"
          className={`diary-toolbar-btn diary-toolbar-btn--muted${sortKey === 'updated' ? ' diary-toolbar-btn--active' : ''}`}
          onClick={() => setSortKey('updated')}
        >
          Updated
        </button>
        <button
          type="button"
          className={`diary-toolbar-btn diary-toolbar-btn--muted${sortKey === 'name' ? ' diary-toolbar-btn--active' : ''}`}
          onClick={() => setSortKey('name')}
        >
          Name
        </button>
        <button
          type="button"
          className={`diary-toolbar-btn diary-toolbar-btn--muted${sortKey === 'created' ? ' diary-toolbar-btn--active' : ''}`}
          onClick={() => setSortKey('created')}
        >
          Created
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

      <div
        className={
          lists.length === 0 ? 'lists-new-wrap lists-new-wrap--spacious' : 'lists-new-wrap'
        }
      >
        <button
          type="button"
          className="lists-new-btn"
          onClick={() => setCreateOpen(true)}
          aria-label="New list"
        >
          +
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-danger)', textAlign: 'center' }}>{error}</p>}
      {loading && <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>Loading…</p>}

      {!loading && lists.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-fg-muted)' }}>
          No lists yet. Create one or add from your <strong>Diary</strong>.
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
        {lists.map((list) => (
          <li key={list._id} className="search-result lists-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="lists-card-menu lists-card-menu--corner">
              <button
                type="button"
                className="lists-card-menu-btn"
                aria-haspopup="menu"
                aria-expanded={openMenuListId === list._id}
                aria-label="List options"
                onClick={() => setOpenMenuListId((id) => (id === list._id ? null : list._id))}
              >
                ⋯
              </button>
              {openMenuListId === list._id && (
                <div className="lists-card-menu-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className="lists-card-menu-item lists-card-menu-item--danger"
                    onClick={() => deleteList(list._id)}
                  >
                    Delete list
                  </button>
                </div>
              )}
            </div>
            <div className="lists-card-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1em' }}>{list.name}</div>
                <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-fg-muted)', marginTop: 4 }}>
                  {list.itemKind} list · {(list.items || []).length} items
                </div>
              </div>
            </div>
            <div style={{ margin: '2px 0 8px' }}>
              <button
                type="button"
                className="search-result-add"
                aria-label={`Add ${list.itemKind === 'track' ? 'song' : 'album'} to ${list.name}`}
                onClick={() => {
                  setAddModalList(list);
                  setAddQuery('');
                  setAddResults({});
                  setAddError('');
                }}
              >
                +
              </button>
            </div>
            <div className="lists-display-toggle" role="group" aria-label="How to show items">
              <span style={{ fontSize: '0.9em', color: 'var(--color-fg-muted)', marginRight: 8 }}>Show:</span>
              {['both', 'name', 'cover'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`diary-toolbar-btn diary-toolbar-btn--muted${(list.displayMode || 'both') === mode ? ' diary-toolbar-btn--active' : ''}`}
                  style={{ width: 'auto', minWidth: '4.5rem', height: 40, fontSize: '0.8rem' }}
                  onClick={() => patchDisplayMode(list._id, mode)}
                >
                  {mode === 'both' ? 'Name + cover' : mode === 'name' ? 'Name' : 'Cover'}
                </button>
              ))}
            </div>
            <div className={`lists-items lists-items--${list.displayMode || 'both'}`}>
              {(list.items || []).length > 0 && (list.items || []).map((item) => renderListItem(list, item))}
            </div>
          </li>
        ))}
      </ul>

      {createOpen && (
        <div
          className="search-add-modal-overlay"
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
        >
          <div
            className="search-add-modal"
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>New list</h3>
            <form onSubmit={handleCreateList}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="List name" required />
              <fieldset style={{ border: 'none', margin: '12px 0', padding: 0 }}>
                <legend style={{ fontWeight: 600, marginBottom: 8 }}>List contains</legend>
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="itemKind"
                    checked={newItemKind === 'album'}
                    onChange={() => setNewItemKind('album')}
                  />{' '}
                  Albums
                </label>
                <label style={{ display: 'block' }}>
                  <input
                    type="radio"
                    name="itemKind"
                    checked={newItemKind === 'track'}
                    onChange={() => setNewItemKind('track')}
                  />{' '}
                  Songs
                </label>
              </fieldset>
              {createError && <p style={{ color: 'var(--color-danger)', fontSize: '0.9em' }}>{createError}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button type="submit" disabled={createSaving}>
                  {createSaving ? 'Creating…' : 'Create'}
                </button>
                <button
                  type="button"
                  style={{ background: 'var(--color-card-solid)', color: 'var(--color-fg)' }}
                  onClick={() => {
                    setCreateOpen(false);
                    setCreateError('');
                  }}
                  disabled={createSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addModalList && (
        <div
          className="search-add-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="list-add-search-title"
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
          onClick={closeAddModal}
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
                onClick={closeAddModal}
              >
                Back
              </button>
            </div>
            <h3 id="list-add-search-title" style={{ marginTop: 0, textAlign: 'center' }}>
              Add {addModalList.itemKind === 'track' ? 'Songs' : 'Albums'}
            </h3>
            <p style={{ marginTop: 0, textAlign: 'center', color: 'var(--color-fg-muted)' }}>
              {addModalList.name}
            </p>
            <div className="search-form--stacked">
              <form onSubmit={runListSearch}>
                <input
                  type="text"
                  placeholder={addModalList.itemKind === 'track' ? 'Search for a song…' : 'Search for an album…'}
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                />
                <button type="submit" disabled={addLoading}>
                  {addLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
            {addError && <p style={{ color: 'var(--color-danger)', marginBottom: 0 }}>{addError}</p>}
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {addModalList.itemKind === 'album' &&
                Array.isArray(addResults?.albums?.items) &&
                addResults.albums.items.map((album) => (
                  <li key={album.id} className="search-result search-result-row">
                    {album.images?.[0] && (
                      <img src={album.images[0].url} alt="" style={{ width: 56, height: 56, borderRadius: 8 }} />
                    )}
                    <div className="search-result-row__text">
                      <div style={{ fontWeight: 700 }}>{album.name}</div>
                      <div style={{ color: 'var(--color-fg-muted)' }}>{album.artists?.[0]?.name}</div>
                    </div>
                    <button
                      type="button"
                      className="search-result-add"
                      disabled={addSavingId === String(album.id)}
                      onClick={() => addSearchItemToList(addModalList, album)}
                    >
                      {addSavingId === String(album.id) ? '…' : '+'}
                    </button>
                  </li>
                ))}
              {addModalList.itemKind === 'track' &&
                Array.isArray(addResults?.tracks?.items) &&
                addResults.tracks.items.map((track) => (
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
                    <button
                      type="button"
                      className="search-result-add"
                      disabled={addSavingId === String(track.id)}
                      onClick={() => addSearchItemToList(addModalList, track)}
                    >
                      {addSavingId === String(track.id) ? '…' : '+'}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
