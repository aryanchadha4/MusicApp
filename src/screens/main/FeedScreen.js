import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { userAPI, spotifyAPI } from '../../services/api';
import StarRating from '../../components/StarRating';

const FeedScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [friendsFeed, setFriendsFeed] = useState([]);
  const [popularAlbums, setPopularAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    setLoading(true);
    try {
      // Load friends feed
      const feedResponse = await userAPI.getFriendsFeed(user.id);
      setFriendsFeed(feedResponse || []);

      // Load popular albums
      const albumsResponse = await spotifyAPI.getTopAlbums();
      setPopularAlbums(albumsResponse || []);
    } catch (error) {
      console.error('Failed to load feed data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedData();
    setRefreshing(false);
  };

  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderFriendReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ 
            uri: item.profilePic || 'https://via.placeholder.com/40' 
          }}
          style={styles.profilePic}
        />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewerName}>{item.user}</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.reviewedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <StarRating value={item.rating} disabled size={16} />
        </View>
      </View>
      
      <View style={styles.albumInfo}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/60' }}
          style={styles.albumImage}
        />
        <View style={styles.albumDetails}>
          <Text style={styles.albumTitle}>{item.album}</Text>
          <Text style={styles.artistName}>{item.artist}</Text>
        </View>
      </View>
      
      <Text style={styles.reviewText}>{truncateText(item.review)}</Text>
    </View>
  );

  const renderPopularAlbum = ({ item }) => (
    <TouchableOpacity 
      style={styles.albumCard}
      onPress={() => navigation.navigate('AlbumPage', { albumId: item.id })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/120' }}
        style={styles.popularAlbumImage}
      />
      <Text style={styles.popularAlbumTitle} numberOfLines={2}>
        {item.album}
      </Text>
      <Text style={styles.popularArtistName} numberOfLines={1}>
        {item.artist}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7fd7ff" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Friends Feed Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Friends' Recent Reviews</Text>
        {friendsFeed.length > 0 ? (
          <FlatList
            data={friendsFeed}
            renderItem={renderFriendReview}
            keyExtractor={(item, index) => `${item.userId}-${item.albumId}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No reviews from friends yet</Text>
            <Text style={styles.emptySubtext}>Follow some users to see their reviews here</Text>
          </View>
        )}
      </View>

      {/* Popular Albums Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Albums</Text>
        {popularAlbums.length > 0 ? (
          <FlatList
            data={popularAlbums}
            renderItem={renderPopularAlbum}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No popular albums available</Text>
          </View>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  carouselContainer: {
    paddingHorizontal: 20,
  },
  reviewCard: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    color: '#7fd7ff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewDate: {
    color: '#aaa',
    fontSize: 12,
  },
  ratingContainer: {
    marginLeft: 'auto',
  },
  albumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  albumImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
  },
  albumDetails: {
    flex: 1,
  },
  albumTitle: {
    color: '#a084ee',
    fontSize: 14,
    fontWeight: '600',
  },
  artistName: {
    color: '#7fd7ff',
    fontSize: 12,
  },
  reviewText: {
    color: '#e0e6ed',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  albumCard: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    width: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularAlbumImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  popularAlbumTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  popularArtistName: {
    color: '#7fd7ff',
    fontSize: 11,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default FeedScreen; 
