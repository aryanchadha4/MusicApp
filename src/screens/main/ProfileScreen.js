import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  RefreshControl,
  View,
} from 'react-native';
import AppScreen from '../../components/native/AppScreen';
import MetricGrid from '../../components/native/MetricGrid';
import NativeButton from '../../components/native/NativeButton';
import SectionCard from '../../components/native/SectionCard';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { colors } from '../../theme/colors';
import { getProfileDisplayName, sortReviewsByDate } from '../../domain/models/profile';
import { radii, spacing } from '../../theme/tokens';

const ProfileScreen = ({ navigation }) => {
  const { user, profileInfo, logout, updateProfileInfo, authDisabled } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const p = profileInfo || {};
  const recentReviews = sortReviewsByDate(p.ratedAlbums || []).slice(0, 3);

  const onRefresh = async () => {
    if (!user?.email) return;
    setRefreshing(true);
    try {
      const updatedProfile = await authAPI.getProfile(user.email);
      updateProfileInfo(updatedProfile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    if (authDisabled) return;
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const joined = p.joined || p.createdAt;

  return (
    <AppScreen
      eyebrow="You"
      title={getProfileDisplayName(p || user || {})}
      subtitle="Profile, favorites, and account controls stay in one native section with the same tone as the web app."
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      headerAccessory={<Text style={styles.headerPill}>Profile</Text>}
    >
      <MetricGrid
        items={[
          { label: 'Reviews', value: p.ratedAlbums?.length || 0 },
          { label: 'Artists', value: p.favoriteArtists?.length || 0 },
          { label: 'Songs', value: p.favoriteSongs?.length || 0 },
          { label: 'Recent', value: recentReviews.length || 0 },
        ]}
      />

      <SectionCard eyebrow="Identity" title={p.username ? `@${p.username}` : 'Listener'} subtitle={joined ? `Joined ${new Date(joined).toLocaleDateString()}` : 'New listener'}>
        <View style={styles.profileHeader}>
          <Image
            source={{
              uri: p.profilePic || 'https://via.placeholder.com/100',
            }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{p.name || user?.username || 'Listener'}</Text>
            <Text style={styles.username}>@{p.username || user?.username || '—'}</Text>
          </View>
        </View>
        <Text style={styles.diaryHintText}>
          Your listens live on the Activity tab. Use Search to find music on Spotify and save a rating and note.
          {authDisabled ? ' Sign-in is currently off.' : ''}
        </Text>
        <View style={styles.actionButtons}>
          <NativeButton title="Edit profile" onPress={() => navigation.navigate('EditProfile')} style={styles.actionButton} />
          {!authDisabled ? (
            <NativeButton title="Logout" variant="danger" onPress={handleLogout} style={styles.actionButton} />
          ) : null}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Taste" title="Favorite artists">
        {p.favoriteArtists && p.favoriteArtists.length > 0 ? (
          <FlatList
            data={p.favoriteArtists}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item }) => (
              <View style={styles.artistCard}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                  style={styles.artistImage}
                />
                <Text style={styles.artistName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
          />
        ) : (
          <Text style={styles.emptyText}>No favorite artists yet</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Taste" title="Favorite songs">
        {p.favoriteSongs && p.favoriteSongs.length > 0 ? (
          <FlatList
            data={p.favoriteSongs}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
            renderItem={({ item }) => (
              <View style={styles.songCard}>
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/80' }}
                  style={styles.songImage}
                />
                <Text style={styles.songTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
            )}
            keyExtractor={(item, index) => `${item.title}-${index}`}
          />
        ) : (
          <Text style={styles.emptyText}>No favorite songs yet</Text>
        )}
      </SectionCard>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  headerPill: {
    minWidth: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(82, 121, 111, 0.16)',
    color: colors.accent,
    fontWeight: '700',
    overflow: 'hidden',
    textAlign: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: colors.accent,
    fontSize: 16,
    marginBottom: 4,
  },
  joinDate: {
    color: colors.foregroundMuted,
    fontSize: 14,
  },
  diaryHint: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  diaryHintText: {
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  carouselContainer: {
    paddingTop: spacing.xs,
  },
  artistCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  artistName: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  songCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  songTitle: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  songArtist: {
    color: colors.accent,
    fontSize: 10,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.foregroundMuted,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

export default ProfileScreen; 
