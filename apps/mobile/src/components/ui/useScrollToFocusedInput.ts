import { createContext, useCallback, useEffect, useRef } from 'react';
import {
  Keyboard,
  ScrollView,
  TextInput,
  View,
  type HostInstance,
} from 'react-native';

/** Space kept above the focused field once scrolled. */
const TOP_MARGIN = 96;

/**
 * Lets a TextField ask its scrolling container to bring it into view when it
 * gains focus while the keyboard is already open (switching fields).
 */
export const ScrollToFocusedInputContext = createContext<(() => void) | null>(
  null,
);

/**
 * Keeps the focused field visible above the keyboard: scrolls when the
 * keyboard opens and when focus moves to another field.
 * (react-native-keyboard-controller does this better but is not in Expo Go.)
 */
export function useScrollToFocusedInput() {
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  const scrollToFocused = useCallback(() => {
    const input =
      TextInput.State.currentlyFocusedInput() as HostInstance | null;
    const content = contentRef.current;
    if (!input || !content) return;
    input.measureLayout(content, (_x, y) => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - TOP_MARGIN),
        animated: true,
      });
    });
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      scrollToFocused,
    );
    return () => subscription.remove();
  }, [scrollToFocused]);

  /** For TextField: only needed when the keyboard is already visible. */
  const onFieldFocus = useCallback(() => {
    if (Keyboard.isVisible()) scrollToFocused();
  }, [scrollToFocused]);

  return { scrollRef, contentRef, onFieldFocus };
}
