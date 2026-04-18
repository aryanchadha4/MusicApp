import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { spotifyAPI } from '../../services/api';
import StarRating from '../../components/StarRating';
import { colors } from '../../theme/colors';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('album');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await spotifyAPI.search(searchQuery, searchType);
      if (searchType === 'album') {
        setResults(response.albums?.items || []);
      } else {
        setResults(response.tracks?.items || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openRateModal = (item) => {
    setSelectedItem(item);
    setReviewRating(0);
    setShowRateModal(true);
  };

  const goToNotes = () => {
    if (reviewRating === 0 || !selectedItem) return;

    if (searchType === 'album') {
      const album = selectedItem;
      navigation.navigate('LogEntryNotes', {
        kind: 'album',
        rating: reviewRating,
        payload: {
          spotifyId: album.id,
          title: album.name,
          image: album.images?.[0]?.url || '',
          primaryArtistName: album.artists?.[0]?.name || '',
          primaryArtistId: album.artists?.[0]?.id || '',
          albumName: '',
          albumId: '',
        },
      });
    } else {
      const track = selectedItem;
      navigation.navigate('LogEntryNotes', {
        kind: 'track',
        rating: reviewRating,
        payload: {
          spotifyId: track.id,
          title: track.name,
          image: track.album?.images?.[0]?.url || '',
          primaryArtistName: track.artists?.[0]?.name || '',
          primaryArtistId: track.artists?.[0]?.id || '',
          albumName: track.album?.name || '',
          albumId: track.album?.id || '',
        },
      });
    }

    setShowRateModal(false);
    setSelectedItem(null);
    setReviewRating(0);
  };

  const closeModal = () => {
    setShowRateModal(false);
    setSelectedItem(null);
    setReviewRating(0);
  };

  const renderAlbumItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => openRateModal(item)}>
      <Image
        source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/60' }}
        style={styles.resultImage}
      />
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>{item.artists?.[0]?.name}</Text>
        <Text style={styles.resultMeta}>{item.release_date?.split('-')[0]}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrackItem = ({ item }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => openRateModal(item)}>
      <Image
        source={{ uri: item.album?.images?.[0]?.url || 'https://via.placeholder.com/60' }}
        style={styles.resultImage}
      />
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>{item.artists?.[0]?.name}</Text>
        <Text style={styles.resultMeta}>{item.album?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search albums or tracks…"
          placeholderTextColor={colors.foregroundMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.searchTabs}>
          <TouchableOpacity
            style={[styles.tab, searchType === 'album' && styles.activeTab]}
            onPress={() => setSearchType('album')}
          >
            <Text style={[styles.tabText, searchType === 'album' && styles.activeTabText]}>Albums</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, searchType === 'track' && styles.activeTab]}
            onPress={() => setSearchType('track')}
          >
            <Text style={[styles.tabText, searchType === 'track' && styles.activeTabText]}>Tracks</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={searchType === 'album' ? renderAlbumItem : renderTrackItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          ListEmptyComponent={
            searchQuery.trim().length > 2 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Type at least 3 characters to search Spotify</Text>
              </View>
            )
          }
        />
      )}

      <Modal visible={showRateModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate this {searchType === 'album' ? 'album' : 'track'}</Text>

              {selectedItem && searchType === 'album' && (
                <View style={styles.rowInfo}>
                  <Image
                    source={{ uri: selectedItem.images?.[0]?.url || 'https://via.placeholder.com/80' }}
                    style={styles.modalArt}
                  />
                  <View style={styles.modalTextCol}>
                    <Text style={styles.modalName}>{selectedItem.name}</Text>
                    <Text style={styles.modalSub}>{selectedItem.artists?.[0]?.name}</Text>
                  </View>
                </View>
              )}

              {selectedItem && searchType === 'track' && (
                <View style={styles.rowInfo}>
                  <Image
                    source={{
                      uri: selectedItem.album?.images?.[0]?.url || 'https://via.placeholder.com/80',
                    }}
                    style={styles.modalArt}
                  />
                  <View style={styles.modalTextCol}>
                    <Text style={styles.modalName}>{selectedItem.name}</Text>
                    <Text style={styles.modalSub}>{selectedItem.artists?.[0]?.name}</Text>
                    <Text style={styles.modalAlbum}>{selectedItem.album?.name}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.ratingLabel}>Stars</Text>
              <StarRating value={reviewRating} onChange={setReviewRating} size={36} />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextButton, reviewRating === 0 && styles.nextDisabled]}
                  onPress={goToNotes}
                  disabled={reviewRating === 0}
                >
                  <Text style={styles.nextButtonText}>Next — add note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    padding: 15,
    color: colors.foreground,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  searchTabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.foregroundMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.foreground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.foregroundMuted,
    marginTop: 10,
    fontSize: 16,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    alignItems: 'center',
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
    marginBottom: 2,
  },
  resultMeta: {
    color: colors.foregroundMuted,
    fontSize: 12,
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.foregroundMuted,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalArt: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 14,
  },
  modalTextCol: {
    flex: 1,
  },
  modalName: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '600',
  },
  modalSub: {
    color: colors.foregroundMuted,
    fontSize: 14,
    marginTop: 4,
  },
  modalAlbum: {
    color: colors.foregroundMuted,
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  ratingLabel: {
    color: colors.foreground,
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 14,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  nextDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SearchScreen;
