import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, profileInfo, logout, updateProfileInfo, authDisabled } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const p = profileInfo || {};

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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Header */}
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
          {joined ? (
            <Text style={styles.joinDate}>Joined {new Date(joined).toLocaleDateString()}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.diaryHint}>
        <Text style={styles.diaryHintText}>
          Your listens live on the Diary tab. Use Search to find music on Spotify and save a rating and note.
          {authDisabled ? ' Sign-in is currently off.' : ''}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, authDisabled && styles.editButtonFull]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        {!authDisabled && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Favorite Artists */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Artists</Text>
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
      </View>

      {/* Favorite Songs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Songs</Text>
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
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.foregroundMuted,
    fontSize: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  editButtonFull: {
    marginRight: 0,
  },
  editButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.foreground,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    paddingHorizontal: 20,
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