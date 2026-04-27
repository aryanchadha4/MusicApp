import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppScreen from '../../components/native/AppScreen';
import MetricGrid from '../../components/native/MetricGrid';
import NativeAvatar from '../../components/native/NativeAvatar';
import NativeButton from '../../components/native/NativeButton';
import SectionCard from '../../components/native/SectionCard';
import StarRating from '../../components/StarRating';
import { getProfileDisplayName, sortReviewsByDate } from '../../domain/models/profile';
import { socialClient, spotifyClient } from '../../lib/api';
import { colors } from '../../theme/colors';
import { radii, spacing, typography } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user, profileInfo } = useAuth();
  const [friendFeed, setFriendFeed] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const latestRatings = sortReviewsByDate(profileInfo?.ratedAlbums || []).slice(0, 3);
  const displayName = getProfileDisplayName(profileInfo || user || {});

  const load = useCallback(async () => {
    try {
      const [feedItems, popular] = await Promise.all([
        user?.id ? socialClient.getFriendsFeed(user.id) : Promise.resolve([]),
        spotifyClient.getTopAlbums(),
      ]);

      setFriendFeed(Array.isArray(feedItems) ? feedItems : []);
      setPopularAlbums(Array.isArray(popular) ? popular : []);
    } catch (error) {
      console.error('Failed to load native home data:', error);
      setFriendFeed([]);
      setPopularAlbums([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <AppScreen
      eyebrow="Start"
      title={`Hey, ${displayName}`}
      subtitle="Track recent listening, jump back into your diary, and keep your music network in view from one native home screen."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      headerAccessory={<Text style={styles.headerPill}>Home</Text>}
    >
      <MetricGrid
        items={[
          { label: 'Reviews', value: profileInfo?.ratedAlbums?.length || 0 },
          { label: 'Friends', value: friendFeed.length || 0 },
          { label: 'Lists', value: profileInfo?.lists?.length || 0 },
          { label: 'Popular', value: popularAlbums.length || 0 },
        ]}
      />

      <SectionCard eyebrow="Jump Back In" title="Quick actions" subtitle="Move through your most-used flows without leaving the home stack.">
        <View style={styles.buttonColumn}>
          <NativeButton title="Open diary" onPress={() => navigation.navigate('Diary')} />
          <NativeButton title="Open lists" variant="secondary" onPress={() => navigation.navigate('Lists')} />
          <NativeButton title="Go to network" variant="ghost" onPress={() => navigation.navigate('NetworkTab')} />
        </View>
      </SectionCard>

      <SectionCard eyebrow="Recent" title="Your latest ratings" subtitle="A compact view of the music you logged most recently.">
        {latestRatings.length ? (
          latestRatings.map((item) => (
            <TouchableOpacity
              key={`${item.albumId || item.reviewedAt}`}
              style={styles.row}
              onPress={() => navigation.navigate('AlbumPage', { albumId: item.albumId })}
            >
              {item.image ? <Image source={{ uri: item.image }} style={styles.cover} /> : <View style={[styles.cover, styles.coverFallback]} />}
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{item.albumName}</Text>
                <Text style={styles.rowSubtitle}>{item.artist}</Text>
                <Text style={styles.rowMeta}>{item.review ? `"${item.review.split(' ').slice(0, 10).join(' ')}..."` : 'No note added'}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No ratings yet. Use Search to add your first album or track review.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Network" title="Friend activity" subtitle="Reviews from people you’ve connected with.">
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : friendFeed.length ? (
          friendFeed.slice(0, 4).map((item) => (
            <View key={item.id || `${item.userId}-${item.albumId}`} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <NativeAvatar uri={item.profilePic} name={item.user} size={42} />
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{item.user}</Text>
                  <Text style={styles.rowSubtitle}>
                    {item.album} · {item.artist}
                  </Text>
                </View>
                <StarRating value={item.rating} disabled size={16} />
              </View>
              {item.review ? <Text style={styles.activityReview}>{item.review}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No friend activity yet. Head to Network to add friends and start seeing reviews here.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Discover" title="Popular albums" subtitle="A quick native landing view for albums people are talking about right now.">
        <View style={styles.popularGrid}>
          {popularAlbums.slice(0, 4).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.popularCard}
              onPress={() => navigation.navigate('AlbumPage', { albumId: item.id })}
            >
              {item.image ? <Image source={{ uri: item.image }} style={styles.popularImage} /> : <View style={[styles.popularImage, styles.coverFallback]} />}
              <Text style={styles.popularTitle} numberOfLines={2}>
                {item.album}
              </Text>
              <Text style={styles.popularSubtitle} numberOfLines={1}>
                {item.artist}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    minWidth: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(82, 121, 111, 0.16)',
    color: colors.accent,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
  },
  buttonColumn: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
  },
  coverFallback: {
    backgroundColor: colors.card,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...typography.cardTitle,
  },
  rowSubtitle: {
    ...typography.muted,
  },
  rowMeta: {
    ...typography.muted,
    fontSize: 13,
  },
  emptyText: {
    ...typography.muted,
  },
  activityCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(202, 210, 197, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(82, 121, 111, 0.18)',
    gap: spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityReview: {
    ...typography.body,
    fontStyle: 'italic',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  popularCard: {
    width: '47%',
    gap: spacing.sm,
  },
  popularImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
  },
  popularTitle: {
    ...typography.cardTitle,
    fontSize: 15,
  },
  popularSubtitle: {
    ...typography.muted,
  },
});
