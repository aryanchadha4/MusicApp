import API_BASE_URL from '../utils/config';

export const AUTH_TOKEN_STORAGE_KEY = 'music_diary_token';

const getAuthHeaders = (includeJson = true) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const headers = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

// Authentication APIs
export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  me: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getAuthHeaders(false),
    });
    return response.json();
  },

  // Signup
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Get user profile
  getProfile: async (identifier, type = 'email') => {
    const param = type === 'email' ? 'email' : 'id';
    const response = await fetch(`${API_BASE_URL}/api/auth/profile?${param}=${encodeURIComponent(identifier)}`);
    return response.json();
  },

  // Edit profile
  editProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/edit-profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return response.json();
  },

  // Change credentials
  changeCredentials: async (credentialsData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-credentials`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentialsData),
    });
    return response.json();
  },
};

// User interaction APIs
export const userAPI = {
  // Search users
  searchUsers: async (query) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/search-users?query=${encodeURIComponent(query)}`);
    return response.json();
  },

  // Follow user
  followUser: async (userId, followId) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, followId }),
    });
    return response.json();
  },

  // Unfollow user
  unfollowUser: async (userId, unfollowId) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/unfollow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, unfollowId }),
    });
    return response.json();
  },

  // Get friends feed
  getFriendsFeed: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/friends-feed?userId=${userId}`);
    return response.json();
  },
};

// Music APIs
export const musicAPI = {
  // Rate album
  rateAlbum: async (albumData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/rate-album`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(albumData),
    });
    return response.json();
  },

  // Edit review
  editReview: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/edit-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return response.json();
  },

  // Delete review
  deleteReview: async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/delete-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData),
    });
    return response.json();
  },

  // Get album reviews
  getAlbumReviews: async (albumId) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/album-reviews?albumId=${albumId}`);
    return response.json();
  },
};

// Diary (append-only listen log)
export const diaryAPI = {
  createEntry: async (body) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  getEntries: async ({ userId, kind = 'all', sort = 'date', order = 'desc' }) => {
    const params = new URLSearchParams({
      userId,
      kind,
      sort,
      order,
    });
    const response = await fetch(`${API_BASE_URL}/api/diary/entries?${params}`);
    return response.json();
  },

  updateEntry: async (entryId, body) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/entries/${entryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json();
  },

  deleteEntry: async (entryId, userId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/diary/entries/${entryId}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    return response.json();
  },
};

// Spotify APIs
export const spotifyAPI = {
  // Search
  search: async (query, type) => {
    const response = await fetch(`${API_BASE_URL}/api/diary/search?query=${encodeURIComponent(query)}&type=${type}`);
    return response.json();
  },

  // Get album details
  getAlbum: async (albumId) => {
    const response = await fetch(`${API_BASE_URL}/api/spotify/album/${albumId}`);
    return response.json();
  },

  // Get artist details
  getArtist: async (artistId) => {
    const response = await fetch(`${API_BASE_URL}/api/spotify/artist/${artistId}`);
    return response.json();
  },

  // Get top albums
  getTopAlbums: async () => {
    const response = await fetch(`${API_BASE_URL}/api/spotify/top-albums`);
    return response.json();
  },
}; 
