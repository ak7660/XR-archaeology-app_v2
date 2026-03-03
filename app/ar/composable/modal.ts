import { useCallback, useRef, useState } from "react";

/**
 * Modal state hook with per-ID dismissal tracking.
 * - `visible`: whether the modal is currently shown
 * - `show()`: open the modal
 * - `hide()`: close without dismissing (can be re-shown)
 * - `dismiss(id)`: close and remember this ID so it won't be shown again
 * - `isDismissed(id)`: check if an ID was previously dismissed
 */
export function useModal() {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(new Set<string>());

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);
  const dismiss = useCallback((id: string) => {
    dismissedRef.current.add(id);
    setVisible(false);
  }, []);
  const isDismissed = useCallback((id: string) => dismissedRef.current.has(id), []);

  return { visible, show, hide, dismiss, isDismissed };
}