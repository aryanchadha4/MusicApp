import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildLocationKey,
  getSectionFromPathname,
  getTabTargetPath,
  normalizeAppShellState,
  recordLocationInAppShellState,
  recordScrollPositionInAppShellState,
} from '../lib/appShell/mobileAppState';
import { APP_TABS } from '../lib/navigation/appTabs';
import { webAppShellStateStorage } from '../lib/platform/web/appStateStorageAdapter';

export function usePersistentWebAppShell({ enabled, tabs = APP_TABS }) {
  const location = useLocation();
  const routeKey = useMemo(() => buildLocationKey(location), [location]);
  const stateRef = useRef(normalizeAppShellState(webAppShellStateStorage.getStateSync(), tabs));
  const scrollFrameRef = useRef(0);

  const derivedState = useMemo(() => {
    return enabled
      ? recordLocationInAppShellState(stateRef.current, location, tabs)
      : normalizeAppShellState(stateRef.current, tabs);
  }, [enabled, location, tabs]);

  const persistSnapshot = useCallback((nextState) => {
    stateRef.current = normalizeAppShellState(nextState, tabs);
    void webAppShellStateStorage.setState(stateRef.current);
  }, [tabs]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    void webAppShellStateStorage.getState().then((storedState) => {
      if (cancelled) return;
      stateRef.current = normalizeAppShellState(storedState, tabs);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, tabs]);

  useEffect(() => {
    if (!enabled) return;
    persistSnapshot(derivedState);
  }, [derivedState, enabled, persistSnapshot]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const restoreScroll = () => {
      const storedY = derivedState.scrollPositions?.[routeKey] ?? 0;
      window.scrollTo({ top: storedY, left: 0, behavior: 'auto' });
    };

    const restoreId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(restoreScroll);
    });

    const saveScroll = () => {
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        persistSnapshot(recordScrollPositionInAppShellState(stateRef.current, routeKey, window.scrollY, tabs));
      });
    };

    window.addEventListener('scroll', saveScroll, { passive: true });
    window.addEventListener('beforeunload', saveScroll);

    return () => {
      window.cancelAnimationFrame(restoreId);
      window.removeEventListener('scroll', saveScroll);
      window.removeEventListener('beforeunload', saveScroll);

      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      persistSnapshot(recordScrollPositionInAppShellState(stateRef.current, routeKey, window.scrollY, tabs));
    };
  }, [derivedState, enabled, persistSnapshot, routeKey, tabs]);

  const tabTargets = useMemo(
    () => Object.fromEntries(tabs.map((tab) => [tab.key, getTabTargetPath(derivedState, tab)])),
    [derivedState, tabs]
  );

  return {
    activeTabKey: getSectionFromPathname(location.pathname),
    lastPath: derivedState.lastPath,
    tabTargets,
  };
}
