import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getDiarySearchItems } from './domain/models';
import { useDiaryController } from './features/diary/useDiaryController';
import HalfStarRating, { ReadOnlyStarRow } from './components/HalfStarRating';
import { ScreenMetrics, ScreenShell } from './lib/platform/web/app';
import { Button, Modal } from './lib/platform/web/ui';

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
  const {
    entries,
    kindFilter,
    setKindFilter,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    loading,
    error,
    setError,
    load,
    deleteEntry,
    listChoices,
    listModalLoading,
    selectedListId,
    setSelectedListId,
    listModalError,
    listModalSaving,
    openListPicker,
    resetListPicker,
    addEntryToSelectedList,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    searchLoading,
    searchError,
    searchCatalog,
    resetSearch,
    saveEntry,
  } = useDiaryController({ userId: user?.id, onCreateEntry: onDiaryEntrySave });
  const [listModalEntry, setListModalEntry] = useState(null);
  const [openEntryMenuId, setOpenEntryMenuId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalKind, setSaveModalKind] = useState(null);
  const [saveModalAlbum, setSaveModalAlbum] = useState(null);
  const [saveModalTrack, setSaveModalTrack] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saveModalRating, setSaveModalRating] = useState(0);
  const [saveModalNotes, setSaveModalNotes] = useState('');
  const [saveModalMessage, setSaveModalMessage] = useState('');
  const [saveModalSaving, setSaveModalSaving] = useState(false);

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
      await deleteEntry(id);
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const kindBtnClass = (k) =>
    `diary-toolbar-btn${kindFilter === k ? ' diary-toolbar-btn--active' : ''}`;

  const closeSearchModal = () => {
    setSearchOpen(false);
    resetSearch();
  };

  const closeListModal = () => {
    setListModalEntry(null);
    resetListPicker();
  };

  const openListModal = async (entry) => {
    if (!user?.id) return;
    setListModalEntry(entry);
    await openListPicker(entry);
  };

  const addToExistingList = async () => {
    if (!user?.id || !listModalEntry || !selectedListId) return;
    try {
      const didAdd = await addEntryToSelectedList(listModalEntry._id);
      if (didAdd) {
        closeListModal();
      }
    } catch (e) {
      setError(e.message || 'Add failed');
    }
  };

  const runSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await searchCatalog(searchQuery);
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
      await saveEntry({
        editingEntry,
        modalKind: saveModalKind,
        album: saveModalAlbum,
        track: saveModalTrack,
        rating: saveModalRating,
        notes: saveModalNotes,
      });
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

  const albumItems = getDiarySearchItems(searchResults, 'album');
  const trackItems = getDiarySearchItems(searchResults, 'track');
  const kindLabel = kindFilter === 'all' ? 'All' : kindFilter === 'album' ? 'Albums' : 'Tracks';
  const sortLabel = sortKey === 'date' ? 'Date' : 'Rating';

  return (
    <ScreenShell
      eyebrow="Library"
      title="Diary"
      subtitle="Log albums and songs, then revisit them with a layout that feels at home on smaller screens."
      actions={
        <Button type="button" onClick={() => setSearchOpen(true)}>
          Add music
        </Button>
      }
    >
      <ScreenMetrics
        items={[
          { label: 'Entries', value: entries.length },
          { label: 'View', value: kindLabel },
          { label: 'Sort', value: sortLabel },
        ]}
      />

      <div className="screen-shell__stack">
        <section className="mobile-section-card">
          <div className="mobile-section-card__header">
            <div>
              <p className="mobile-section-card__eyebrow">Controls</p>
              <h3 className="mobile-section-card__heading">Filter your diary</h3>
            </div>
          </div>
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
        </section>

      <Modal
        open={searchOpen}
        onClose={closeSearchModal}
        presentation="fullscreen"
        eyebrow="Diary"
        title="Search music"
        description="Find an album or song, then save it to your diary without leaving the activity stack."
      >
        <div className="search-add-modal__content">
          <div className="search-form--stacked">
            <form onSubmit={runSearch}>
              <select
                className="search-type-select"
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  resetSearch();
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
          <ul className="search-add-modal__list">
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
      </Modal>

      {error && <p className="mobile-section-error" style={{ textAlign: 'center' }}>{error}</p>}

      <section className="mobile-section-card">
        <div className="mobile-section-card__header">
          <div>
            <p className="mobile-section-card__eyebrow">Entries</p>
            <h3 className="mobile-section-card__heading">Recent diary logs</h3>
          </div>
        </div>
      {loading && <p className="mobile-section-empty" style={{ textAlign: 'center' }}>Loading…</p>}

      {!loading && entries.length === 0 && (
        <p className="mobile-section-empty" style={{ textAlign: 'center' }}>
          Nothing logged yet. Use the Add music button above to search and save your first entry.
        </p>
      )}

      <ul className="screen-entry-list" style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
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
      </section>

      <Modal
        open={Boolean(listModalEntry)}
        onClose={closeListModal}
        presentation="sheet"
        eyebrow="Lists"
        title="Add to list"
        description={listModalEntry ? `${listModalEntry.title} · ${listModalEntry.kind === 'album' ? 'Album lists' : 'Song lists'}` : ''}
      >
        <div className="search-add-modal__content">
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
              <div className="search-add-modal__actions">
                <Button type="button" onClick={addToExistingList} loading={listModalSaving} disabled={!selectedListId || listModalSaving}>
                  Add to list
                </Button>
                <Button type="button" variant="secondary" onClick={closeListModal} disabled={listModalSaving}>
                  Cancel
                </Button>
              </div>
            </>
          )}
          {listModalError && (
            <p style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: 0 }}>{listModalError}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={saveModalOpen}
        onClose={closeSaveModal}
        presentation="sheet"
        eyebrow="Diary"
        title={editingEntry ? 'Edit diary entry' : 'Add to diary'}
        description={
          editingEntry
            ? [editingEntry.title, editingEntry.primaryArtistName].filter(Boolean).join(' · ')
            : saveModalKind === 'album'
              ? saveModalAlbum?.name
              : saveModalTrack?.name
        }
      >
        <div className="search-add-modal__content">
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
            <Button type="button" onClick={submitSaveModal} loading={saveModalSaving} disabled={saveModalSaving || saveModalRating <= 0}>
              {editingEntry ? 'Save changes' : 'Save to diary'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeSaveModal} disabled={saveModalSaving}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </ScreenShell>
  );
}
