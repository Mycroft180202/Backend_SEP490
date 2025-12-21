import { useEffect } from 'react';
import { useNavigationContext } from '../context/NavigationContext';

const useNavigationNode = (key, node, options = {}) => {
  const { setContextValue } = useNavigationContext();
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled || !key || !node) {
      return;
    }
    const hasLabel = typeof node.label === 'string' && node.label.trim().length > 0;
    const hasHref = typeof node.href === 'string' && node.href.trim().length > 0;
    if (!hasLabel || !hasHref) {
      return;
    }
    setContextValue(key, node);
  }, [enabled, key, node, setContextValue]);
};

export default useNavigationNode;
