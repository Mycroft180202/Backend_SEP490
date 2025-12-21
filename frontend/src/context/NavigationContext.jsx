import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const NavigationContext = createContext(undefined);
const STORAGE_KEY = 'navigation:context';

const isEqual = (prevValue, nextValue) => {
  if (prevValue === nextValue) {
    return true;
  }
  if (typeof prevValue !== 'object' || typeof nextValue !== 'object' || !prevValue || !nextValue) {
    return false;
  }
  try {
    return JSON.stringify(prevValue) === JSON.stringify(nextValue);
  } catch (err) {
    console.error('Compare navigation context error', err);
    return false;
  }
};

const readStoredContext = () => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Read navigation context error', err);
    return {};
  }
};

const writeStoredContext = (value) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (err) {
    console.error('Persist navigation context error', err);
  }
};

export const NavigationProvider = ({ children }) => {
  const [contextMap, setContextMap] = useState(() => readStoredContext());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    writeStoredContext(contextMap);
  }, [contextMap]);

  const setContextValue = useCallback((key, value) => {
    if (!key) {
      return;
    }
    setContextMap((prev) => {
      const nextValue = typeof value === 'function' ? value(prev[key]) : value;
      if (nextValue === undefined || nextValue === null) {
        if (!(key in prev)) {
          return prev;
        }
        const clone = { ...prev };
        delete clone[key];
        return clone;
      }
      if (key in prev && isEqual(prev[key], nextValue)) {
        return prev;
      }
      return { ...prev, [key]: nextValue };
    });
  }, []);

  const removeContextValue = useCallback((key) => {
    if (!key) {
      return;
    }
    setContextMap((prev) => {
      if (!(key in prev)) {
        return prev;
      }
      const clone = { ...prev };
      delete clone[key];
      return clone;
    });
  }, []);

  const clearContext = useCallback(() => {
    setContextMap({});
  }, []);

  const getContextValue = useCallback((key) => contextMap[key], [contextMap]);

  const value = useMemo(() => ({
    context: contextMap,
    getContextValue,
    setContextValue,
    removeContextValue,
    clearContext,
  }), [clearContext, contextMap, getContextValue, removeContextValue, setContextValue]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return ctx;
};

export const NavigationKeys = {
  LAST_PRODUCT: 'lastProduct',
  LAST_PRODUCT_LIST: 'lastProductList',
  LAST_BLOG: 'lastBlog',
  LAST_BLOG_LIST: 'lastBlogList',
  LAST_STORY: 'lastStory',
  LAST_STORY_LIST: 'lastStoryList',
  LAST_COLLECTION: 'lastCollection',
  LAST_ORDER_DETAIL: 'lastOrderDetail',
  LAST_PROFILE_ENTRY: 'lastProfileEntry',
  LAST_PROFILE_NODE: 'lastProfileNode',
};
