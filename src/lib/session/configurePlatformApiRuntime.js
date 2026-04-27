import { configureApiRuntime } from '../api';

export function configurePlatformApiRuntime({ baseUrl, sessionStorage }) {
  configureApiRuntime({
    baseUrl,
    getToken: () => sessionStorage.getToken(),
    setToken: (token) => sessionStorage.setToken(token),
    clearToken: () => sessionStorage.clearToken(),
  });
}
