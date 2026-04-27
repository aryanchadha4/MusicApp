import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppScreen from '../../components/native/AppScreen';
import MetricGrid from '../../components/native/MetricGrid';
import SectionCard from '../../components/native/SectionCard';
import NativeButton from '../../components/native/NativeButton';
import { getShortReview } from '../../domain/models/reviews';
import { sortReviewsByDate } from '../../domain/models/profile';
import { colors } from '../../theme/colors';
import { radii, spacing, typography } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';

export default function ActivityScreen({ navigation }) {
  const { profileInfo } = useAuth();
  const recentReviews = sortReviewsByDate(profileInfo?.ratedAlbums || []).slice(0, 4);

  return (
    <AppScreen
      eyebrow="Library"
      title="Activity"
      subtitle="Move between diary logging, lists, and your latest rating activity from one native section hub."
      headerAccessory={<Text style={styles.headerPill}>Activity</Text>}
    >
      <MetricGrid
        items={[
          { label: 'Diary entries', value: profileInfo?.ratedAlbums?.length || 0 },
          { label: 'Favorite artists', value: profileInfo?.favoriteArtists?.length || 0 },
          { label: 'Favorite songs', value: profileInfo?.favoriteSongs?.length || 0 },
          { label: 'Reviews', value: recentReviews.length || 0 },
        ]}
      />

      <SectionCard eyebrow="Tools" title="Your listening workspace" subtitle="Jump directly into the parts of the app where you log and organize music.">
        <View style={styles.buttonColumn}>
          <NativeButton title="Open diary" onPress={() => navigation.navigate('Diary')} />
          <NativeButton title="Open lists" variant="secondary" onPress={() => navigation.navigate('Lists')} />
        </View>
      </SectionCard>

      <SectionCard eyebrow="Recent" title="Latest review activity" subtitle="A short native feed of the albums you’ve rated recently.">
        {recentReviews.length ? (
          recentReviews.map((item) => (
            <TouchableOpacity
              key={`${item.albumId || item.reviewedAt}`}
              style={styles.reviewCard}
              onPress={() => navigation.navigate('AlbumPage', { albumId: item.albumId })}
            >
              <Text style={styles.reviewTitle}>{item.albumName}</Text>
              <Text style={styles.reviewSubtitle}>{item.artist}</Text>
              <Text style={styles.reviewMeta}>
                {item.rating}/5 · {item.review ? getShortReview(item.review, 16) : 'No note added'}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent review activity yet.</Text>
        )}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPill: {
    minWidth: 76,
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
  reviewCard: {
    paddingVertical: spacing.sm,
    gap: 2,
  },
  reviewTitle: {
    ...typography.cardTitle,
  },
  reviewSubtitle: {
    ...typography.muted,
  },
  reviewMeta: {
    ...typography.muted,
    fontSize: 13,
  },
  emptyText: {
    ...typography.muted,
  },
});
