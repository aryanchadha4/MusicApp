import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_SHELL_STATE_STORAGE_KEY } from '../../appShell/constants';
import { createAppShellStateStorage } from '../../appShell/createAppShellStateStorage';

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

export const nativeAppShellStateStorage = createAppShellStateStorage({
  key: APP_SHELL_STATE_STORAGE_KEY,
  storage: asyncStorage,
});
