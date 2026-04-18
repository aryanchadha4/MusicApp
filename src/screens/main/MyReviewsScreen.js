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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI, musicAPI } from '../../services/api';
import StarRating from '../../components/StarRating';

const MyReviewsScreen = ({ navigation }) => {
  const { user, profileInfo, updateProfileInfo } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const updatedProfile = await authAPI.getProfile(user.email);
      updateProfileInfo(updatedProfile);
      setReviews(updatedProfile.ratedAlbums || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditText(review.review || '');
    setShowEditModal(true);
  };

  const handleDeleteReview = (review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const submitEdit = async () => {
    if (editRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const editData = {
        userId: user.id,
        albumId: selectedReview.albumId,
        rating: editRating,
        review: editText,
      };

      await musicAPI.editReview(editData);
      Alert.alert('Success', 'Review updated successfully!');
      setShowEditModal(false);
      loadReviews(); // Refresh reviews
    } catch (error) {
      Alert.alert('Error', 'Failed to update review');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      const deleteData = {
        userId: user.id,
        albumId: selectedReview.albumId,
      };

      await musicAPI.deleteReview(deleteData);
      Alert.alert('Success', 'Review deleted successfully!');
      setShowDeleteModal(false);
      loadReviews(); // Refresh reviews
    } catch (error) {
      Alert.alert('Error', 'Failed to delete review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.albumImage || 'https://via.placeholder.com/60' }}
          style={styles.albumImage}
        />
        <View style={styles.reviewInfo}>
          <Text style={styles.albumTitle}>{item.albumName}</Text>
          <Text style={styles.artistName}>{item.artistName}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <StarRating value={item.rating} disabled size={16} />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditReview(item)}
            >
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteReview(item)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>My Reviews</Text>
        
        {reviews.length > 0 ? (
          <FlatList
            data={reviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => `${item.albumId}-${item.userId}`}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews yet</Text>
            <Text style={styles.emptySubtext}>
              Start rating albums to see your reviews here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            
            {selectedReview && (
              <View style={styles.albumInfo}>
                <Image
                  source={{ uri: selectedReview.albumImage || 'https://via.placeholder.com/60' }}
                  style={styles.modalAlbumImage}
                />
                <View style={styles.modalAlbumDetails}>
                  <Text style={styles.modalAlbumTitle}>{selectedReview.albumName}</Text>
                  <Text style={styles.modalArtistName}>{selectedReview.artistName}</Text>
                </View>
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <StarRating
                value={editRating}
                onChange={setEditRating}
                size={32}
              />
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write your review..."
              placeholderTextColor="#aaa"
              value={editText}
              onChangeText={setEditText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={submitEdit}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Updating...' : 'Update Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Review</Text>
            
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete your review for "{selectedReview?.albumName}"?
            </Text>
            
            <Text style={styles.deleteWarning}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteConfirmButton, submitting && styles.submitButtonDisabled]}
                onPress={confirmDelete}
                disabled={submitting}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {submitting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  scrollContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    margin: 20,
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  albumImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  albumTitle: {
    color: '#a084ee',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistName: {
    color: '#7fd7ff',
    fontSize: 14,
  },
  actionsContainer: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#7fd7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#181a20',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff7f7f',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23263a',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  albumInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAlbumImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  modalAlbumDetails: {
    flex: 1,
  },
  modalAlbumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalArtistName: {
    color: '#7fd7ff',
    fontSize: 14,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: '#181a20',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#7fd7ff',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#181a20',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteWarning: {
    color: '#ff7f7f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ff7f7f',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyReviewsScreen; 