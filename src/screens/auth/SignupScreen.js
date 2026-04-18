import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { spotifyAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
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
  
  const { signup } = useAuth();

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

  const handleSignup = async () => {
    if (!formData.name.trim() || !formData.username.trim() || 
        !formData.email.trim() || !formData.password.trim()) {
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
      const userData = {
        ...formData,
        favoriteArtists: selectedArtists,
        favoriteSongs: selectedSongs,
      };

      const result = await signup(userData);
      if (result.success) {
        Alert.alert('Success', 'Account created successfully! Please login.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Signup Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Signup failed. Please try again.');
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Start your diary</Text>
          
          <View style={styles.form}>
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
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.foregroundMuted}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Favorite Artists Section */}
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

            {/* Favorite Songs Section */}
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
            
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
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
  sectionTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
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
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: colors.foregroundMuted,
    fontSize: 16,
  },
  loginLink: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen; 