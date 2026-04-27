import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { authAPI, spotifyAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const EditProfileScreen = ({ navigation }) => {
  const { user, profileInfo, updateProfileInfo } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [artistQuery, setArtistQuery] = useState('');
  const [songQuery, setSongQuery] = useState('');
  const [artistResults, setArtistResults] = useState([]);
  const [songResults, setSongResults] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [showArtistResults, setShowArtistResults] = useState(false);
  const [showSongResults, setShowSongResults] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    currentPassword: '',
    newPassword: '',
    newEmail: '',
  });

  useEffect(() => {
    if (profileInfo) {
      setFormData({
        name: profileInfo.name || '',
        username: profileInfo.username || '',
        email: profileInfo.email || '',
      });
      setSelectedArtists(profileInfo.favoriteArtists || []);
      setSelectedSongs(profileInfo.favoriteSongs || []);
    }
  }, [profileInfo]);

  // Search artists
  useEffect(() => {
    const searchArtists = async () => {
      if (artistQuery.trim().length > 2) {
        try {
          const response = await spotifyAPI.search(artistQuery, 'artist');
          setArtistResults(response.artists?.items || []);
          setShowArtistResults(true);
        } catch (error) {
          console.error('Artist search error:', error);
        }
      } else {
        setArtistResults([]);
        setShowArtistResults(false);
      }
    };

    const timeoutId = setTimeout(searchArtists, 500);
    return () => clearTimeout(timeoutId);
  }, [artistQuery]);

  // Search songs
  useEffect(() => {
    const searchSongs = async () => {
      if (songQuery.trim().length > 2) {
        try {
          const response = await spotifyAPI.search(songQuery, 'track');
          setSongResults(response.tracks?.items || []);
          setShowSongResults(true);
        } catch (error) {
          console.error('Song search error:', error);
        }
      } else {
        setSongResults([]);
        setShowSongResults(false);
      }
    };

    const timeoutId = setTimeout(searchSongs, 500);
    return () => clearTimeout(timeoutId);
  }, [songQuery]);

  const addArtist = (artist) => {
    if (selectedArtists.length >= 3) {
      Alert.alert('Limit Reached', 'You can only select up to 3 favorite artists.');
      return;
    }
    if (selectedArtists.find(a => a.id === artist.id)) {
      Alert.alert('Already Added', 'This artist is already in your favorites.');
      return;
    }
    setSelectedArtists([...selectedArtists, { name: artist.name, id: artist.id }]);
    setArtistQuery('');
    setShowArtistResults(false);
  };

  const addSong = (song) => {
    if (selectedSongs.length >= 3) {
      Alert.alert('Limit Reached', 'You can only select up to 3 favorite songs.');
      return;
    }
    if (selectedSongs.find(s => s.id === song.id)) {
      Alert.alert('Already Added', 'This song is already in your favorites.');
      return;
    }
    setSelectedSongs([...selectedSongs, { 
      title: song.name, 
      artist: song.artists[0].name, 
      artistId: song.artists[0].id 
    }]);
    setSongQuery('');
    setShowSongResults(false);
  };

  const removeArtist = (artistId) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId));
  };

  const removeSong = (songId) => {
    setSelectedSongs(selectedSongs.filter(s => s.id !== songId));
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (selectedArtists.length === 0) {
      Alert.alert('Error', 'Please select at least one favorite artist');
      return;
    }

    if (selectedSongs.length === 0) {
      Alert.alert('Error', 'Please select at least one favorite song');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        favoriteArtists: selectedArtists,
        favoriteSongs: selectedSongs,
      };

      await authAPI.editProfile(profileData);
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Refresh profile info
      const updatedProfile = await authAPI.getProfile(user.email);
      updateProfileInfo(updatedProfile);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCredentials = async () => {
    if (!credentialsData.currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!credentialsData.newPassword.trim() && !credentialsData.newEmail.trim()) {
      Alert.alert('Error', 'Please enter a new password or email');
      return;
    }

    setLoading(true);
    try {
      const data = {
        email: formData.email || user.email,
        currentPassword: credentialsData.currentPassword,
      };

      if (credentialsData.newPassword.trim()) {
        data.newPassword = credentialsData.newPassword;
      }

      if (credentialsData.newEmail.trim()) {
        data.newEmail = credentialsData.newEmail;
      }

      await authAPI.changeCredentials(data);
      Alert.alert('Success', 'Credentials updated successfully!');
      setShowCredentialsModal(false);
      setCredentialsData({
        currentPassword: '',
        newPassword: '',
        newEmail: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  const renderArtistItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => addArtist(item)}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || 'https://via.placeholder.com/50' }}
        style={styles.resultImage}
      />
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>Artist</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSongItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => addSong(item)}
    >
      <Image
        source={{ uri: item.album?.images?.[0]?.url || 'https://via.placeholder.com/50' }}
        style={styles.resultImage}
      />
      <View style={styles.resultText}>
        <Text style={styles.resultTitle}>{item.name}</Text>
        <Text style={styles.resultSubtitle}>{item.artists?.[0]?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={colors.foregroundMuted}
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.foregroundMuted}
          value={formData.username}
          onChangeText={(text) => setFormData({...formData, username: text})}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.foregroundMuted}
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      </View>

      {/* Credentials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password / Email</Text>
        <TouchableOpacity
          style={styles.credentialsButton}
          onPress={() => setShowCredentialsModal(true)}
        >
          <Text style={styles.credentialsButtonText}>Change Password or Email</Text>
        </TouchableOpacity>
      </View>

      {/* Favorite Artists */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Artists (Required)</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for artists..."
          placeholderTextColor={colors.foregroundMuted}
          value={artistQuery}
          onChangeText={setArtistQuery}
        />
        
        {showArtistResults && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={artistResults}
              renderItem={renderArtistItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
            />
          </View>
        )}

        {selectedArtists.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>Selected Artists:</Text>
            {selectedArtists.map((artist) => (
              <View key={artist.id} style={styles.selectedItem}>
                <Text style={styles.selectedText}>{artist.name}</Text>
                <TouchableOpacity onPress={() => removeArtist(artist.id)}>
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Favorite Songs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Songs (Required)</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for songs..."
          placeholderTextColor={colors.foregroundMuted}
          value={songQuery}
          onChangeText={setSongQuery}
        />
        
        {showSongResults && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={songResults}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
            />
          </View>
        )}

        {selectedSongs.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>Selected Songs:</Text>
            {selectedSongs.map((song, index) => (
              <View key={index} style={styles.selectedItem}>
                <Text style={styles.selectedText}>{song.title} - {song.artist}</Text>
                <TouchableOpacity onPress={() => removeSong(song.id)}>
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      {/* Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCredentialsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password / Email</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor={colors.foregroundMuted}
              value={credentialsData.currentPassword}
              onChangeText={(text) => setCredentialsData({...credentialsData, currentPassword: text})}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password (optional)"
              placeholderTextColor={colors.foregroundMuted}
              value={credentialsData.newPassword}
              onChangeText={(text) => setCredentialsData({...credentialsData, newPassword: text})}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Email (optional)"
              placeholderTextColor={colors.foregroundMuted}
              value={credentialsData.newEmail}
              onChangeText={(text) => setCredentialsData({...credentialsData, newEmail: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCredentialsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleChangeCredentials}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.foreground,
    margin: 20,
    marginBottom: 10,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 16,
  },
  credentialsButton: {
    backgroundColor: colors.inputBg,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  credentialsButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    alignItems: 'center',
  },
  resultImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  resultSubtitle: {
    color: colors.foregroundMuted,
    fontSize: 14,
  },
  selectedContainer: {
    marginBottom: 15,
  },
  selectedTitle: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    padding: 10,
    borderRadius: 6,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  selectedText: {
    color: colors.foreground,
    fontSize: 14,
    flex: 1,
  },
  removeButton: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.inputBg,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen; 
