import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppScreen from '../../components/native/AppScreen';
import NativeButton from '../../components/native/NativeButton';
import SectionCard from '../../components/native/SectionCard';
import { getListItemSubtitle } from '../../domain/models/lists';
import { listsClient } from '../../lib/api';
import { colors } from '../../theme/colors';
import { radii, spacing, typography } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

export default function ListsScreen() {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState('album');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await listsClient.getLists({ userId: user?.id, kind: 'all', sort: 'updated', order: 'desc' });
      setLists(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not load lists.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) load();
  }, [load, user?.id]);

  const createList = async () => {
    if (!newName.trim()) return;
    setBusy('create');
    try {
      await listsClient.createList({
        userId: user?.id,
        name: newName.trim(),
        itemKind: newKind,
        displayMode: 'both',
      });
      setCreateOpen(false);
      setNewName('');
      setNewKind('album');
      await load();
    } finally {
      setBusy('');
    }
  };

  const removeList = async (listId) => {
    setBusy(`delete:${listId}`);
    try {
      await listsClient.deleteList(listId, user?.id);
      await load();
    } finally {
      setBusy('');
    }
  };

  return (
    <AppScreen
      eyebrow="Library"
      title="Lists"
      subtitle="Browse and create lists in the native activity stack while we continue moving the fuller web list editor over."
      headerAccessory={<Text style={styles.headerPill}>Lists</Text>}
    >
      <SectionCard eyebrow="Create" title="Start a new list" subtitle="Album and song collections use the same backend as the web app.">
        <NativeButton title="New list" onPress={() => setCreateOpen(true)} />
      </SectionCard>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Saved" title="Your collections" subtitle="Current lists and the items already inside them.">
        {loading ? <Text style={styles.muted}>Loading lists…</Text> : null}
        {!loading && !lists.length ? <Text style={styles.muted}>No lists yet. Create one to get started.</Text> : null}
        {!loading &&
          lists.map((list) => (
            <View key={list._id} style={styles.listCard}>
              <View style={styles.listHeader}>
                <View style={styles.listHeaderCopy}>
                  <Text style={styles.listTitle}>{list.name}</Text>
                  <Text style={styles.listMeta}>
                    {list.itemKind === 'track' ? 'Songs' : 'Albums'} · {(list.items || []).length} items
                  </Text>
                </View>
                <NativeButton
                  title="Delete"
                  variant="secondary"
                  onPress={() => removeList(list._id)}
                  loading={busy === `delete:${list._id}`}
                  style={styles.deleteButton}
                />
              </View>
              {(list.items || []).slice(0, 4).map((item) => (
                <TouchableOpacity key={item._id} style={styles.listItem}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{getListItemSubtitle(item)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
      </SectionCard>

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New list</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="List name"
              placeholderTextColor={colors.foregroundMuted}
              style={styles.input}
            />
            <View style={styles.kindRow}>
              <NativeButton title="Albums" onPress={() => setNewKind('album')} variant={newKind === 'album' ? 'primary' : 'secondary'} style={styles.kindButton} />
              <NativeButton title="Songs" onPress={() => setNewKind('track')} variant={newKind === 'track' ? 'primary' : 'secondary'} style={styles.kindButton} />
            </View>
            <View style={styles.modalActions}>
              <NativeButton title="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} style={styles.kindButton} />
              <NativeButton title="Create" onPress={createList} loading={busy === 'create'} style={styles.kindButton} />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    minWidth: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(82, 121, 111, 0.16)',
    color: colors.accent,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
  },
  muted: {
    ...typography.muted,
  },
  listCard: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  listHeaderCopy: {
    flex: 1,
  },
  listTitle: {
    ...typography.cardTitle,
  },
  listMeta: {
    ...typography.muted,
  },
  deleteButton: {
    minWidth: 84,
  },
  listItem: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(202, 210, 197, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.18)',
  },
  itemTitle: {
    ...typography.cardTitle,
    fontSize: 15,
  },
  itemSubtitle: {
    ...typography.muted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.modalOverlay,
  },
  modalCard: {
    padding: spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.sectionTitle,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.lg,
    color: colors.foreground,
    fontSize: 15,
  },
  kindRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kindButton: {
    flex: 1,
  },
});
