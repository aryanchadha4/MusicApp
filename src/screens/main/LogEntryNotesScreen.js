import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { diaryAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const LogEntryNotesScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { kind, rating, payload } = route.params || {};
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user?.id || !payload || !kind || rating == null) {
      Alert.alert('Error', 'Missing log data. Go back and try again.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        userId: user.id,
        kind,
        spotifyId: payload.spotifyId,
        title: payload.title,
        image: payload.image || '',
        primaryArtistName: payload.primaryArtistName || '',
        primaryArtistId: payload.primaryArtistId || '',
        albumName: payload.albumName || '',
        albumId: payload.albumId || '',
        rating,
        notes: notes.trim(),
      };

      const res = await diaryAPI.createEntry(body);
      if (res.message && !res._id) {
        throw new Error(res.message);
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                routes: [{ name: 'Diary' }, { name: 'Search' }],
                index: 0,
              },
            },
          ],
        })
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save diary entry');
    } finally {
      setSaving(false);
    }
  };

  if (!payload) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nothing to log.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Diary note</Text>
        <Text style={styles.title}>{payload.title}</Text>
        <Text style={styles.subtitle}>
          {payload.primaryArtistName}
          {kind === 'track' && payload.albumName ? ` · ${payload.albumName}` : ''}
        </Text>

        <View style={styles.artRow}>
          <Image
            source={{ uri: payload.image || 'https://via.placeholder.com/80' }}
            style={styles.art}
          />
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>{kind === 'album' ? 'Album' : 'Track'}</Text>
            <Text style={styles.metaValue}>Rated {rating} / 5</Text>
          </View>
        </View>

        <Text style={styles.label}>What stood out? (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="A few lines for your future self…"
          placeholderTextColor={colors.foregroundMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.secondaryText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <Text style={styles.primaryText}>Save to diary</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  kicker: {
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.foregroundMuted,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.foregroundMuted,
    marginBottom: 20,
  },
  artRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  art: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 14,
  },
  meta: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 16,
    color: colors.foreground,
    marginTop: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  input: {
    minHeight: 160,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  secondaryText: {
    color: colors.foreground,
    fontWeight: '600',
  },
  primary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  primaryText: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: colors.foreground,
    marginBottom: 12,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
  },
});

export default LogEntryNotesScreen;
