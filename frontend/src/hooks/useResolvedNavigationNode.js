import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useNavigationContext } from '../context/NavigationContext';

const isValidNode = (node) => (
  node
  && typeof node === 'object'
  && typeof node.label === 'string'
  && node.label.trim().length > 0
  && typeof node.href === 'string'
  && node.href.trim().length > 0
);

const useResolvedNavigationNode = ({ locationKey, contextKey, fallback = null }) => {
  const location = useLocation();
  const { context } = useNavigationContext();

  return useMemo(() => {
    const locationState = locationKey ? location.state : undefined;
    if (locationKey && locationState && isValidNode(locationState[locationKey])) {
      return locationState[locationKey];
    }
    if (contextKey && isValidNode(context[contextKey])) {
      return context[contextKey];
    }
    return fallback;
  }, [context, contextKey, fallback, location, locationKey]);
};

export default useResolvedNavigationNode;
