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
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../services/api';
import StarRating from '../../components/StarRating';

const PublicProfileScreen = ({ navigation }) => {
  const route = useRoute();
  const { userId } = route.params;
  const { user } = useAuth();
  
  const [profileInfo, setProfileInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile(userId, 'id');
      setProfileInfo(response);
      setIsFollowing(response.followers?.includes(user.id) || false);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(user.id, userId);
        setIsFollowing(false);
      } else {
        await userAPI.followUser(user.id, userId);
        setIsFollowing(true);
      }
      // Refresh profile data
      loadProfileData();
    } catch (error) {
      Alert.alert('Error', 'Failed to follow/unfollow user');
    }
  };

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.albumImage || 'https://via.placeholder.com/40' }}
          style={styles.albumImage}
        />
        <View style={styles.reviewInfo}>
          <Text style={styles.albumTitle}>{item.albumName}</Text>
          <Text style={styles.artistName}>{item.artistName}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <StarRating value={item.rating} disabled size={16} />
        </View>
      </View>
      <Text style={styles.reviewText}>{truncateText(item.review)}</Text>
      <Text style={styles.reviewDate}>
        {new Date(item.reviewedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7fd7ff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ 
            uri: profileInfo.profilePic || 'https://via.placeholder.com/100' 
          }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{profileInfo.name}</Text>
          <Text style={styles.username}>@{profileInfo.username}</Text>
          <Text style={styles.joinDate}>
            Joined {new Date(profileInfo.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Follow Button */}
      {user.id !== userId && (
        <View style={styles.followSection}>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Followers', { userId })}
        >
          <Text style={styles.statNumber}>{profileInfo.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Following', { userId })}
        >
          <Text style={styles.statNumber}>{profileInfo.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* Favorite Artists */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Artists</Text>
        {profileInfo.favoriteArtists && profileInfo.favoriteArtists.length > 0 ? (
          <FlatList
            data={profileInfo.favoriteArtists}
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
          <Text style={styles.emptyText}>No favorite artists</Text>
        )}
      </View>

      {/* Favorite Songs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Songs</Text>
        {profileInfo.favoriteSongs && profileInfo.favoriteSongs.length > 0 ? (
          <FlatList
            data={profileInfo.favoriteSongs}
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
          <Text style={styles.emptyText}>No favorite songs</Text>
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {profileInfo.ratedAlbums && profileInfo.ratedAlbums.length > 0 ? (
          <FlatList
            data={profileInfo.ratedAlbums.slice(0, 5)}
            renderItem={renderReviewItem}
            keyExtractor={(item) => `${item.albumId}-${item.userId}`}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No reviews yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181a20',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181a20',
  },
  loadingText: {
    color: '#7fd7ff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181a20',
  },
  errorText: {
    color: '#ff7f7f',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    color: '#7fd7ff',
    fontSize: 16,
    marginBottom: 4,
  },
  joinDate: {
    color: '#aaa',
    fontSize: 14,
  },
  followSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  followButton: {
    backgroundColor: '#7fd7ff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#666',
  },
  followButtonText: {
    color: '#181a20',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: '#23263a',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  statNumber: {
    color: '#7fd7ff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },
  artistCard: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 100,
    alignItems: 'center',
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  artistName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  songCard: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 100,
    alignItems: 'center',
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  songArtist: {
    color: '#7fd7ff',
    fontSize: 10,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: '#23263a',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  albumImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  albumTitle: {
    color: '#a084ee',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistName: {
    color: '#7fd7ff',
    fontSize: 12,
  },
  ratingContainer: {
    marginLeft: 'auto',
  },
  reviewText: {
    color: '#e0e6ed',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reviewDate: {
    color: '#aaa',
    fontSize: 12,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
});

export default PublicProfileScreen; 