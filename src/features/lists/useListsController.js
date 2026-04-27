import { useCallback, useEffect, useState } from 'react';
import { buildListSearchPayload } from '../../domain/models';
import { listsClient, spotifyClient } from '../../lib/api';

export function useListsController({ userId }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [sortOrder, setSortOrder] = useState('desc');

  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [addResults, setAddResults] = useState({});
  const [addLoading, setAddLoading] = useState(false);
  const [addSavingId, setAddSavingId] = useState('');
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setError('');
    try {
      const data = await listsClient.getLists({
        userId,
        kind: kindFilter,
        sort: sortKey,
        order: sortOrder,
      });
      setLists(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load lists');
      setLists([]);
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

  const createList = useCallback(
    async ({ name, itemKind }) => {
      if (!userId || !String(name || '').trim()) return false;
      setCreateSaving(true);
      setCreateError('');
      try {
        await listsClient.createList({
          userId,
          name: String(name).trim(),
          itemKind,
          displayMode: 'both',
        });
        await load();
        return true;
      } catch (err) {
        setCreateError(err.message || 'Create failed');
        return false;
      } finally {
        setCreateSaving(false);
      }
    },
    [load, userId]
  );

  const updateDisplayMode = useCallback(
    async (listId, displayMode) => {
      if (!userId) return false;
      const data = await listsClient.updateList(listId, { userId, displayMode });
      setLists((current) => current.map((list) => (list._id === listId ? { ...list, ...data } : list)));
      return true;
    },
    [userId]
  );

  const removeListItem = useCallback(
    async (listId, itemId) => {
      if (!userId || !itemId) return false;
      const data = await listsClient.removeItem(listId, itemId, userId);
      setLists((current) => current.map((list) => (list._id === listId ? { ...data } : list)));
      return true;
    },
    [userId]
  );

  const deleteList = useCallback(
    async (listId) => {
      if (!userId) return false;
      await listsClient.deleteList(listId, userId);
      setLists((current) => current.filter((list) => list._id !== listId));
      return true;
    },
    [userId]
  );

  const searchCatalog = useCallback(async (query, itemKind) => {
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery) return {};
    setAddLoading(true);
    setAddError('');
    try {
      const result = await spotifyClient.search(trimmedQuery, itemKind === 'track' ? 'track' : 'album');
      setAddResults(result);
      return result;
    } catch (err) {
      setAddResults({});
      setAddError(err.message || 'Search failed');
      return {};
    } finally {
      setAddLoading(false);
    }
  }, []);

  const resetCatalogSearch = useCallback(() => {
    setAddResults({});
    setAddLoading(false);
    setAddSavingId('');
    setAddError('');
  }, []);

  const addSearchItemToList = useCallback(
    async (list, rawItem) => {
      if (!userId || !list?._id || !rawItem?.id) return false;
      const payload = buildListSearchPayload(list, rawItem);
      if (!payload) return false;
      setAddSavingId(String(rawItem.id));
      setAddError('');

      try {
        const data = await listsClient.addItem(list._id, {
          userId: String(userId),
          fromSearch: payload,
        });
        setLists((current) => current.map((entry) => (entry._id === list._id ? { ...data } : entry)));
        return true;
      } catch (err) {
        setAddError(err.message || 'Add failed');
        return false;
      } finally {
        setAddSavingId('');
      }
    },
    [userId]
  );

  return {
    lists,
    setLists,
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
    deleteList,
    addResults,
    setAddResults,
    addLoading,
    addSavingId,
    addError,
    setAddError,
    searchCatalog,
    resetCatalogSearch,
    addSearchItemToList,
  };
}
