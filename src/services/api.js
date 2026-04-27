import API_BASE_URL from '../utils/config';
import {
  AUTH_TOKEN_STORAGE_KEY,
  authClient,
  diaryClient,
  listsClient,
  musicClient,
  profileClient,
  socialClient,
  spotifyClient,
} from '../lib/api';
import { configurePlatformApiRuntime } from '../lib/session';
import { nativeSessionStorage } from '../lib/platform/native/sessionStorageAdapter';

configurePlatformApiRuntime({
  baseUrl: API_BASE_URL,
  sessionStorage: nativeSessionStorage,
});

export { AUTH_TOKEN_STORAGE_KEY };

export const authAPI = {
  login: authClient.login,
  me: authClient.me,
  signup: authClient.signup,
  getProfile: (identifier, type = 'email') =>
    type === 'id'
      ? profileClient.getProfileById(identifier)
      : profileClient.getProfileByEmail(identifier),
  editProfile: profileClient.updateProfile,
  changeCredentials: profileClient.changeCredentials,
};

export const userAPI = {
  searchUsers: socialClient.searchUsers,
  getFriendRequests: socialClient.getFriendRequests,
  getFriends: socialClient.getFriends,
  getRelationshipState: socialClient.getRelationshipState,
  followUser: socialClient.followUser,
  unfollowUser: socialClient.unfollowUser,
  getFriendsFeed: socialClient.getFriendsFeed,
};

export const musicAPI = {
  rateAlbum: musicClient.rateAlbum,
  editReview: musicClient.editReview,
  deleteReview: musicClient.deleteReview,
  getAlbumReviews: musicClient.getAlbumReviews,
};

export const diaryAPI = {
  createEntry: diaryClient.createEntry,
  getEntries: diaryClient.getEntries,
  updateEntry: diaryClient.updateEntry,
  deleteEntry: diaryClient.deleteEntry,
};

export const listsAPI = {
  getLists: listsClient.getLists,
  getList: listsClient.getList,
  createList: listsClient.createList,
  updateList: listsClient.updateList,
  deleteList: listsClient.deleteList,
  addItem: listsClient.addItem,
  removeItem: listsClient.removeItem,
};

export const spotifyAPI = {
  search: spotifyClient.search.bind(spotifyClient),
  searchItems: spotifyClient.searchItems.bind(spotifyClient),
  lookupImage: spotifyClient.lookupImage.bind(spotifyClient),
  getAlbum: spotifyClient.getAlbum,
  getArtist: spotifyClient.getArtist,
  getArtistDetails: spotifyClient.getArtistDetails,
  getTopAlbums: spotifyClient.getTopAlbums,
};
