import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { diaryAPI } from '../../services/api';
import StarRating from '../../components/StarRating';
import { colors } from '../../theme/colors';

const DiaryScreen = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kindFilter, setKindFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [editEntry, setEditEntry] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await diaryAPI.getEntries({
        userId: user.id,
        kind: kindFilter,
        sort: sortKey,
        order: sortOrder,
      });
      if (Array.isArray(data)) {
        setEntries(data);
      } else {
        setEntries([]);
      }
    } catch (e) {
      console.error(e);
      setEntries([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id, kindFilter, sortKey, sortOrder])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openEdit = (item) => {
    setEditEntry(item);
    setEditRating(item.rating);
    setEditNotes(item.notes || '');
  };

  const saveEdit = async () => {
    if (!editEntry || !user?.id) return;
    if (editRating === 0) {
      Alert.alert('Rating', 'Please choose a rating');
      return;
    }
    setSaving(true);
    try {
      const res = await diaryAPI.updateEntry(editEntry._id, {
        userId: user.id,
        rating: editRating,
        notes: editNotes,
      });
      if (res.message && !res._id) {
        throw new Error(res.message);
      }
      setEditEntry(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert('Delete entry', 'Remove this line from your diary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await diaryAPI.deleteEntry(item._id, user.id);
            await load();
          } catch (e) {
            Alert.alert('Error', 'Could not delete');
          }
        },
      },
    ]);
  };

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/56' }}
          style={styles.thumb}
        />
        <View style={styles.cardBody}>
          <Text style={styles.kindBadge}>{item.kind === 'album' ? 'Album' : 'Track'}</Text>
          <Text style={styles.entryTitle}>{item.title}</Text>
          <Text style={styles.entryArtist}>{item.primaryArtistName}</Text>
          {item.kind === 'track' && item.albumName ? (
            <Text style={styles.entryAlbum}>{item.albumName}</Text>
          ) : null}
        </View>
        <StarRating value={item.rating} disabled size={18} />
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      <Text style={styles.dateLine}>
        {new Date(item.loggedAt).toLocaleString()}
      </Text>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openEdit(item)}>
          <Text style={styles.actionLink}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item)}>
          <Text style={styles.deleteLink}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && entries.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.hint}>Opening your diary…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {['all', 'album', 'track'].map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, kindFilter === k && styles.chipActive]}
              onPress={() => setKindFilter(k)}
            >
              <Text style={[styles.chipText, kindFilter === k && styles.chipTextActive]}>
                {k === 'all' ? 'All' : k === 'album' ? 'Albums' : 'Tracks'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.chip, sortKey === 'date' && styles.chipActive]}
            onPress={() => setSortKey('date')}
          >
            <Text style={[styles.chipText, sortKey === 'date' && styles.chipTextActive]}>Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, sortKey === 'rating' && styles.chipActive]}
            onPress={() => setSortKey('rating')}
          >
            <Text style={[styles.chipText, sortKey === 'rating' && styles.chipTextActive]}>Rating</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.orderBtn} onPress={toggleSortOrder}>
            <Text style={styles.orderText}>{sortOrder === 'desc' ? '↓' : '↑'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={entries.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing logged yet. Use the Search tab to add music.</Text>
        }
      />

      <Modal visible={!!editEntry} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit entry</Text>
            <Text style={styles.modalLabel}>Rating</Text>
            <StarRating value={editRating} onChange={setEditRating} size={28} />
            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={styles.modalInput}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              placeholderTextColor={colors.foregroundMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondary} onPress={() => setEditEntry(null)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primary} onPress={saveEdit} disabled={saving}>
                <Text style={styles.primaryText}>{saving ? '…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  hint: {
    marginTop: 12,
    color: colors.foregroundMuted,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.foreground,
  },
  orderBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  orderText: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  kindBadge: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.foregroundMuted,
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
  entryArtist: {
    fontSize: 14,
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  entryAlbum: {
    fontSize: 13,
    color: colors.foregroundMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  notes: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: colors.foreground,
    fontStyle: 'italic',
  },
  dateLine: {
    marginTop: 10,
    fontSize: 12,
    color: colors.foregroundMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  actionLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  deleteLink: {
    color: colors.danger,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: colors.foregroundMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 16,
  },
  modalLabel: {
    color: colors.foregroundMuted,
    marginBottom: 8,
    marginTop: 8,
  },
  modalInput: {
    minHeight: 100,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 12,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondary: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  secondaryText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  primary: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  primaryText: {
    color: colors.foreground,
    fontWeight: '700',
  },
});

export default DiaryScreen;
