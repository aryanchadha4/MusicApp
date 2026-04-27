import { apiRequest } from './httpClient';

export const profileClient = {
  getProfileById(id) {
    return apiRequest('/api/auth/profile', { query: { id } });
  },

  getProfileByEmail(email) {
    return apiRequest('/api/auth/profile', { query: { email } });
  },

  updateProfile(profileData) {
    return apiRequest('/api/auth/edit-profile', {
      method: 'PATCH',
      body: profileData,
      auth: true,
    });
  },

  changeCredentials(credentialsData) {
    return apiRequest('/api/auth/change-credentials', {
      method: 'PATCH',
      body: credentialsData,
      auth: true,
    });
  },
};
