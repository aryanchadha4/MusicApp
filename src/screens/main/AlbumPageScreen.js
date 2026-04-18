import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { spotifyAPI, musicAPI } from '../../services/api';
import StarRating from '../../components/StarRating';

const AlbumPageScreen = ({ navigation }) => {
  const route = useRoute();
  const { albumId } = route.params;
  
  const [albumInfo, setAlbumInfo] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [histogram, setHistogram] = useState([0, 0, 0, 0, 0]);
  const [averageScore, setAverageScore] = useState(0);
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    loadAlbumData();
  }, [albumId]);

  const loadAlbumData = async () => {
    setLoading(true);
    try {
      // Load album info
      const albumResponse = await spotifyAPI.getAlbum(albumId);
      setAlbumInfo(albumResponse);

      // Load reviews
      const reviewsResponse = await musicAPI.getAlbumReviews(albumId);
      setReviews(reviewsResponse || []);

      // Calculate histogram and average
      const hist = [0, 0, 0, 0, 0];
      let totalRating = 0;
      for (const review of reviewsResponse || []) {
        if (review.rating >= 1 && review.rating <= 5) {
          hist[review.rating - 1]++;
          totalRating += review.rating;
        }
      }
      setHistogram(hist);
      setAverageScore(reviewsResponse?.length > 0 ? (totalRating / reviewsResponse.length).toFixed(1) : 0);
    } catch (error) {
      console.error('Failed to load album data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHistogramBar = (count, index) => {
    const maxCount = Math.max(...histogram);
    const barHeight = maxCount > 0 ? (count / maxCount) * 80 : 0;
    
    return (
      <View key={index} style={styles.histogramBarContainer}>
        <TouchableOpacity
          style={[
            styles.histogramBar,
            {
              height: barHeight,
              backgroundColor: count > 0 ? '#a084ee' : '#333',
            },
          ]}
          onPress={() => setHoveredBar(hoveredBar === index ? null : index)}
        />
        <Text style={styles.histogramLabel}>{index + 1}</Text>
        {hoveredBar === index && count > 0 && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              {count} review{count === 1 ? '' : 's'} with {index + 1} star{index === 0 ? '' : 's'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <TouchableOpacity
          onPress={() => navigation.navigate('PublicProfile', { userId: item.userId })}
        >
          <Text style={styles.reviewerName}>{item.user}</Text>
        </TouchableOpacity>
        <View style={styles.ratingContainer}>
          <StarRating value={item.rating} disabled size={16} />
        </View>
      </View>
      <Text style={styles.reviewText}>{item.review}</Text>
      <Text style={styles.reviewDate}>
        {new Date(item.reviewedAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7fd7ff" />
        <Text style={styles.loadingText}>Loading album...</Text>
      </View>
    );
  }

  if (!albumInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load album information</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Album Header */}
      <View style={styles.albumHeader}>
        <Image
          source={{ uri: albumInfo.images?.[0]?.url || 'https://via.placeholder.com/200' }}
          style={styles.albumImage}
        />
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{albumInfo.name}</Text>
          <View style={styles.artistContainer}>
            {albumInfo.artists?.map((artist, index) => (
              <TouchableOpacity
                key={artist.id}
                onPress={() => navigation.navigate('ArtistPage', { artistId: artist.id })}
              >
                <Text style={styles.artistName}>
                  {artist.name}
                  {index < albumInfo.artists.length - 1 ? ', ' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.albumDetails}>
            {albumInfo.release_date?.split('-')[0]} • {albumInfo.total_tracks} tracks
          </Text>
        </View>
      </View>

      {/* Review Distribution */}
      <View style={styles.distributionSection}>
        <Text style={styles.sectionTitle}>Review Distribution</Text>
        
        <View style={styles.distributionHeader}>
          <View style={styles.averageContainer}>
            <Text style={styles.averageScore}>{averageScore}</Text>
            <Text style={styles.averageLabel}>Average</Text>
          </View>
          
          <View style={styles.histogramContainer}>
            {histogram.map((count, index) => renderHistogramBar(count, index))}
          </View>
        </View>
        
        <Text style={styles.totalReviews}>
          {reviews.length} total review{reviews.length === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Recent Reviews */}
      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {reviews.length > 0 ? (
          <FlatList
            data={reviews.slice(0, 10)}
            renderItem={renderReviewItem}
            keyExtractor={(item, index) => `${item.userId}-${item.albumId}-${index}`}
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
  albumHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  albumImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 15,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  artistContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  artistName: {
    color: '#7fd7ff',
    fontSize: 16,
    fontWeight: '600',
  },
  albumDetails: {
    color: '#aaa',
    fontSize: 14,
  },
  distributionSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  averageContainer: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  averageScore: {
    color: '#a084ee',
    fontSize: 28,
    fontWeight: 'bold',
  },
  averageLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  histogramContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 8,
  },
  histogramBarContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  histogramBar: {
    width: '100%',
    borderRadius: 6,
    marginBottom: 4,
    minHeight: 4,
  },
  histogramLabel: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltip: {
    position: 'absolute',
    top: -40,
    backgroundColor: '#23263a',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 10,
  },
  tooltipText: {
    color: '#e0e6ed',
    fontSize: 12,
    fontWeight: '500',
  },
  totalReviews: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  reviewsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  reviewItem: {
    backgroundColor: '#23263a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    color: '#a084ee',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewText: {
    color: '#e0e6ed',
    fontSize: 14,
    lineHeight: 20,
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
  },
});

export default AlbumPageScreen; 