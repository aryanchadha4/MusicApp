import { useCallback, useEffect, useState } from 'react';
import { buildDiaryEntryPayloadFromSelection } from '../../domain/models';
import { diaryClient, listsClient, spotifyClient } from '../../lib/api';

export function useDiaryController({ userId, onCreateEntry }) {
  const [entries, setEntries] = useState([]);
  const [kindFilter, setKindFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [listChoices, setListChoices] = useState([]);
  const [listModalLoading, setListModalLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');
  const [listModalError, setListModalError] = useState('');
  const [listModalSaving, setListModalSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('album');
  const [searchResults, setSearchResults] = useState({});
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setError('');
    try {
      const data = await diaryClient.getEntries({
        userId,
        kind: kindFilter,
        sort: sortKey,
        order: sortOrder,
      });
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load diary');
      setEntries([]);
    }
  }, [kindFilter, sortKey, sortOrder, userId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [load]);

  const deleteEntry = useCallback(
    async (entryId) => {
      if (!userId) return false;
      await diaryClient.deleteEntry(entryId, userId);
      await load();
      return true;
    },
    [load, userId]
  );

  const openListPicker = useCallback(
    async (entry) => {
      if (!userId || !entry?.kind) return [];
      setSelectedListId('');
      setListModalError('');
      setListModalLoading(true);

      try {
        const data = await listsClient.getLists({
          userId,
          kind: entry.kind,
          sort: 'name',
          order: 'asc',
        });
        const nextChoices = Array.isArray(data) ? data : [];
        setListChoices(nextChoices);
        return nextChoices;
      } catch (err) {
        setListChoices([]);
        setListModalError(err.message || 'Could not load lists');
        return [];
      } finally {
        setListModalLoading(false);
      }
    },
    [userId]
  );

  const resetListPicker = useCallback(() => {
    setListChoices([]);
    setSelectedListId('');
    setListModalError('');
    setListModalSaving(false);
  }, []);

  const addEntryToSelectedList = useCallback(
    async (entryId) => {
      if (!userId || !entryId || !selectedListId) return false;
      setListModalSaving(true);
      setListModalError('');

      try {
        await listsClient.addItem(selectedListId, {
          userId,
          diaryEntryId: entryId,
        });
        return true;
      } catch (err) {
        setListModalError(err.message || 'Add failed');
        return false;
      } finally {
        setListModalSaving(false);
      }
    },
    [selectedListId, userId]
  );

  const searchCatalog = useCallback(
    async (query) => {
      const trimmedQuery = String(query || searchQuery).trim();
      if (!trimmedQuery) return {};

      setSearchLoading(true);
      setSearchError('');

      try {
        const result = await spotifyClient.search(trimmedQuery, searchType);
        setSearchResults(result);
        return result;
      } catch (err) {
        setSearchResults({});
        setSearchError(err.message || 'Search failed');
        return {};
      } finally {
        setSearchLoading(false);
      }
    },
    [searchQuery, searchType]
  );

  const resetSearch = useCallback(() => {
    setSearchResults({});
    setSearchError('');
  }, []);

  const saveEntry = useCallback(
    async ({ editingEntry, modalKind, album, track, rating, notes }) => {
      if (!userId) {
        throw new Error('You need to be signed in to save.');
      }
      if (Number(rating) <= 0) {
        throw new Error('Choose a rating first.');
      }

      if (editingEntry?._id) {
        await diaryClient.updateEntry(editingEntry._id, {
          userId,
          rating,
          notes,
        });
      } else {
        if (!onCreateEntry) {
          throw new Error('You need to be signed in to save.');
        }
        const body = buildDiaryEntryPayloadFromSelection(modalKind, album, track, rating, notes);
        if (!body) {
          throw new Error('Save failed');
        }
        await onCreateEntry(body);
      }

      await load();
      return true;
    },
    [load, onCreateEntry, userId]
  );

  return {
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
  };
}
