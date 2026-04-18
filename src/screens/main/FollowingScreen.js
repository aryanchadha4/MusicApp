import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { authAPI } from '../../services/api';

const FollowingScreen = ({ navigation }) => {
  const route = useRoute();
  const { userId } = route.params;
  
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile(userId, 'id');
      setFollowing(response.following || []);
    } catch (error) {
      console.error('Failed to load following:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFollowingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.followingItem}
      onPress={() => navigation.navigate('PublicProfile', { userId: item._id })}
    >
      <Image
        source={{ uri: item.profilePic || 'https://via.placeholder.com/50' }}
        style={styles.profileImage}
      />
      <View style={styles.followingInfo}>
        <Text style={styles.followingName}>{item.name}</Text>
        <Text style={styles.followingUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7fd7ff" />
        <Text style={styles.loadingText}>Loading following...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={following}
        renderItem={renderFollowingItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Not following anyone yet</Text>
          </View>
        }
      />
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
  followingItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  followingInfo: {
    flex: 1,
  },
  followingName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  followingUsername: {
    color: '#7fd7ff',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default FollowingScreen; 