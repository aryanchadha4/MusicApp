import { useEffect, useState } from 'react';
import { getListItemSubtitle } from './domain/models';
import { useListsController } from './features/lists/useListsController';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Button, Modal } from './lib/platform/web/ui';

export default function Lists({ user }) {
  const {
    lists,
    loading,
    error,
    setError,
    kindFilter,
    setKindFilter,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    load,
    createSaving,
    createError,
    setCreateError,
    createList,
    updateDisplayMode,
    removeListItem,
    deleteList: deleteListById,
    addResults,
    setAddResults,
    addLoading,
    addSavingId,
    addError,
    setAddError,
    searchCatalog,
    resetCatalogSearch,
    addSearchItemToList: addSearchItem,
  } = useListsController({ userId: user?.id });
  const [openMenuListId, setOpenMenuListId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newItemKind, setNewItemKind] = useState('album');
  const [addModalList, setAddModalList] = useState(null);
  const [addQuery, setAddQuery] = useState('');

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
    const didCreate = await createList({ name: newName, itemKind: newItemKind });
    if (didCreate) {
      setCreateOpen(false);
      setNewName('');
      setNewItemKind('album');
    }
  };

  const patchDisplayMode = async (listId, displayMode) => {
    if (!user?.id) return;
    try {
      await updateDisplayMode(listId, displayMode);
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
      await removeListItem(listId, item._id);
    } catch (e) {
      setError(e.message || 'Remove failed');
    }
  };

  const deleteList = async (listId) => {
    if (!user?.id) return;
    if (!window.confirm('Delete this list and all its items?')) return;
    setOpenMenuListId(null); // close menu after confirm
    try {
      await deleteListById(listId);
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const closeAddModal = () => {
    setAddModalList(null);
    setAddQuery('');
    resetCatalogSearch();
  };

  const runListSearch = async (e) => {
    e.preventDefault();
    if (!addModalList || !addQuery.trim()) return;
    await searchCatalog(addQuery, addModalList.itemKind);
  };

  const handleAddSearchItemToList = async (list, rawItem) => {
    if (!user?.id || !list?._id || !rawItem?.id) return;
    try {
      await addSearchItem(list, rawItem);
    } catch (err) {
      setAddError(err.message || 'Add failed');
    }
  };

  const renderListItem = (list, item) => {
    const mode = list.displayMode || 'both';
    const subtitle = getListItemSubtitle(item);

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

  const kindLabel = kindFilter === 'all' ? 'All' : kindFilter === 'album' ? 'Albums' : 'Tracks';
  const sortLabel =
    sortKey === 'updated' ? 'Updated' : sortKey === 'created' ? 'Created' : 'Name';

  return (
    <ScreenShell
      eyebrow="Collections"
      title="Lists"
      subtitle="Organize favorites into touch-friendly collections that can scale cleanly into a future native app."
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New list
        </Button>
      }
    >
      <ScreenMetrics
        items={[
          { label: 'Lists', value: lists.length },
          { label: 'Filter', value: kindLabel },
          { label: 'Sort', value: sortLabel },
        ]}
      />

      <div className="screen-shell__stack">
        <section className="mobile-section-card">
          <div className="mobile-section-card__header">
            <div>
              <p className="mobile-section-card__eyebrow">Controls</p>
              <h3 className="mobile-section-card__heading">Shape your list view</h3>
            </div>
          </div>
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
        </section>

      {error && <p className="mobile-section-error" style={{ textAlign: 'center' }}>{error}</p>}

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Collections</p>
            <h3 className="mobile-section-card__heading">Your lists</h3>
          </div>
        </div>
      {loading && <p className="mobile-section-empty" style={{ textAlign: 'center' }}>Loading…</p>}

      {!loading && lists.length === 0 && (
        <p className="mobile-section-empty" style={{ textAlign: 'center' }}>
          No lists yet. Create one or add from your <strong>Diary</strong>.
        </p>
      )}

      <ul className="screen-entry-list" style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
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
      </section>

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError('');
        }}
        presentation="sheet"
        eyebrow="Lists"
        title="New list"
        description="Create a list with a short mobile-friendly setup flow."
      >
        <form onSubmit={handleCreateList} className="search-add-modal__form">
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Name</label>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="List name" required />
          <fieldset className="search-add-modal__fieldset">
            <legend style={{ fontWeight: 600, marginBottom: 8 }}>List contains</legend>
            <label className="search-add-modal__radio">
              <input
                type="radio"
                name="itemKind"
                checked={newItemKind === 'album'}
                onChange={() => setNewItemKind('album')}
              />
              Albums
            </label>
            <label className="search-add-modal__radio">
              <input
                type="radio"
                name="itemKind"
                checked={newItemKind === 'track'}
                onChange={() => setNewItemKind('track')}
              />
              Songs
            </label>
          </fieldset>
          {createError && <p style={{ color: 'var(--color-danger)', fontSize: '0.9em' }}>{createError}</p>}
          <div className="search-add-modal__actions">
            <Button type="submit" loading={createSaving} disabled={createSaving}>
              Create
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateOpen(false);
                setCreateError('');
              }}
              disabled={createSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(addModalList)}
        onClose={closeAddModal}
        presentation="fullscreen"
        eyebrow="Lists"
        title={addModalList ? `Add ${addModalList.itemKind === 'track' ? 'songs' : 'albums'}` : 'Add items'}
        description={addModalList?.name || 'Search and add items to this list.'}
      >
        {addModalList ? (
          <div className="search-add-modal__content">
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
            <ul className="search-add-modal__list">
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
                      onClick={() => handleAddSearchItemToList(addModalList, album)}
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
                      onClick={() => handleAddSearchItemToList(addModalList, track)}
                    >
                      {addSavingId === String(track.id) ? '…' : '+'}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Modal>
      </div>
    </ScreenShell>
  );
}
