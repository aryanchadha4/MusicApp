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
import { spotifyAPI } from '../../services/api';

const ArtistPageScreen = ({ navigation }) => {
  const route = useRoute();
  const { artistId } = route.params;
  
  const [artistInfo, setArtistInfo] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtistData();
  }, [artistId]);

  const loadArtistData = async () => {
    setLoading(true);
    try {
      // Load artist info
      const artistResponse = await spotifyAPI.getArtist(artistId);
      setArtistInfo(artistResponse);

      // Load artist albums (including EPs)
      const albumsResponse = await spotifyAPI.getArtist(artistId);
      if (albumsResponse.albums) {
        setAlbums(albumsResponse.albums);
      }
    } catch (error) {
      console.error('Failed to load artist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity
      style={styles.albumItem}
      onPress={() => navigation.navigate('AlbumPage', { albumId: item.id })}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/120' }}
        style={styles.albumImage}
      />
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.albumType}>
          {item.album_type === 'single' ? 'EP' : item.album_type === 'album' ? 'Album' : 'Single'}
        </Text>
        <Text style={styles.albumYear}>
          {item.release_date?.split('-')[0]}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7fd7ff" />
        <Text style={styles.loadingText}>Loading artist...</Text>
      </View>
    );
  }

  if (!artistInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load artist information</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Artist Header */}
      <View style={styles.artistHeader}>
        <Image
          source={{ uri: artistInfo.images?.[0]?.url || 'https://via.placeholder.com/200' }}
          style={styles.artistImage}
        />
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artistInfo.name}</Text>
          <Text style={styles.artistStats}>
            {artistInfo.followers?.toLocaleString()} followers
          </Text>
          {artistInfo.genres && artistInfo.genres.length > 0 && (
            <Text style={styles.artistGenres}>
              {artistInfo.genres.slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Albums Section */}
      <View style={styles.albumsSection}>
        <Text style={styles.sectionTitle}>Albums & EPs</Text>
        {albums.length > 0 ? (
          <FlatList
            data={albums}
            renderItem={renderAlbumItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.albumsList}
          />
        ) : (
          <Text style={styles.emptyText}>No albums available</Text>
        )}
      </View>

      {/* Popular Tracks (if available) */}
      {artistInfo.popularity && (
        <View style={styles.popularitySection}>
          <Text style={styles.sectionTitle}>Popularity</Text>
          <View style={styles.popularityBar}>
            <View 
              style={[
                styles.popularityFill, 
                { width: `${artistInfo.popularity}%` }
              ]} 
            />
          </View>
          <Text style={styles.popularityText}>
            {artistInfo.popularity}/100 popularity score
          </Text>
        </View>
      )}
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
  artistHeader: {
    padding: 20,
    alignItems: 'center',
  },
  artistImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  artistInfo: {
    alignItems: 'center',
  },
  artistName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistStats: {
    color: '#7fd7ff',
    fontSize: 16,
    marginBottom: 8,
  },
  artistGenres: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  albumsSection: {
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
  albumsList: {
    paddingRight: 20,
  },
  albumItem: {
    width: 120,
    marginRight: 15,
  },
  albumImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  albumInfo: {
    alignItems: 'center',
  },
  albumTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  albumType: {
    color: '#7fd7ff',
    fontSize: 12,
    marginBottom: 2,
  },
  albumYear: {
    color: '#aaa',
    fontSize: 12,
  },
  popularitySection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  popularityBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 8,
  },
  popularityFill: {
    height: '100%',
    backgroundColor: '#a084ee',
    borderRadius: 4,
  },
  popularityText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default ArtistPageScreen; 