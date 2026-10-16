import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useGlobalShortcuts hook
 * Step 10.7:
 * - ⌘K palette
 * - / focus search
 * - g then o/r/p/w/m navigate
 * - n new receipt
 * - ? shortcut sheet
 * - Esc close
 * Shortcuts disabled while typing in inputs.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const pendingPrefixRef = useRef(null);
  const prefixTimerRef = useRef(null);

  useEffect(() => {
    const isTextInput = (target) => {
      if (!target) return false;
      const tag = target.tagName?.toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return true;
      if (target.isContentEditable) return true;
      if (target.getAttribute?.('role') === 'textbox') return true;
      return false;
    };

    const handleKeyDown = (e) => {
      // Never trigger when user is typing in an input
      if (isTextInput(e.target) || isTextInput(document.activeElement)) {
        return;
      }

      // Ignore if Cmd, Ctrl, or Alt is pressed (except for browser/system shortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key;

      // Handle '?' to open shortcut modal
      if (key === '?') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('billbox:open-shortcuts'));
        return;
      }

      // If we have a pending 'g' prefix
      if (pendingPrefixRef.current === 'g') {
        clearTimeout(prefixTimerRef.current);
        pendingPrefixRef.current = null;

        const lowerKey = key.toLowerCase();
        switch (lowerKey) {
          case 'o':
            e.preventDefault();
            navigate('/');
            return;
          case 'r':
            e.preventDefault();
            navigate('/receipts');
            return;
          case 'p':
            e.preventDefault();
            navigate('/products');
            return;
          case 'w':
            e.preventDefault();
            navigate('/warranties');
            return;
          case 'm':
            e.preventDefault();
            navigate('/stores');
            return;
          default:
            // Not a recognized sequence
            break;
        }
      }

      // Start 'g' prefix sequence
      if (key.toLowerCase() === 'g') {
        pendingPrefixRef.current = 'g';
        clearTimeout(prefixTimerRef.current);
        prefixTimerRef.current = setTimeout(() => {
          pendingPrefixRef.current = null;
        }, 1200);
        return;
      }

      // Single key 'n' for new receipt
      if (key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/receipts/new');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(prefixTimerRef.current);
    };
  }, [navigate]);
}

export default useGlobalShortcuts;
