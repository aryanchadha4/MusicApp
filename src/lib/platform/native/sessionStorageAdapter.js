import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_SESSION_STORAGE_KEY } from '../../session/constants';
import { createSessionStorageAdapter } from '../../session/createSessionStorageAdapter';

const asyncStorage = {
  async getItem(key) {
    return (await AsyncStorage.getItem(key)) || '';
  },

  async setItem(key, value) {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key) {
    await AsyncStorage.removeItem(key);
  },
};

export const nativeSessionStorage = createSessionStorageAdapter({
  key: AUTH_SESSION_STORAGE_KEY,
  storage: asyncStorage,
});
