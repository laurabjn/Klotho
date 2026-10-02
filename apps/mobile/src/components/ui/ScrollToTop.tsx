import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type HostInstance,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { ScrollToFocusedInputContext } from './useScrollToFocusedInput';

/** Shown once the page has scrolled more than this (dp). */
const SHOW_AFTER = 500;

/** Something that can scroll back to the top (ScrollView or FlatList). */
interface Scrollable {
  scrollTo?: ScrollView['scrollTo'];
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
}

/** Wires a long page to the "back to top" button. */
export function useScrollToTop<T extends Scrollable>() {
  const scrollRef = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      setVisible(event.nativeEvent.contentOffset.y > SHOW_AFTER),
    [],
  );
  const scrollToTop = useCallback(() => {
    const target = scrollRef.current;
    if (target?.scrollToOffset)
      target.scrollToOffset({ offset: 0, animated: true });
    else target?.scrollTo?.({ y: 0, animated: true });
  }, []);

  return { scrollRef, onScroll, showTop: visible, scrollToTop };
}

/** Round button floating at the bottom right of a long page. */
export function ScrollToTopButton({
  visible,
  onPress,
  bottom = spacing.xl,
  right = spacing.xl,
}: {
  visible: boolean;
  onPress: () => void;
  /** Distance from the bottom, to stay above a footer or another button. */
  bottom?: number;
  right?: number;
}) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.backToTop')}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { bottom, right },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    opacity: 0.92,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pressed: { opacity: 0.7 },
  page: { flex: 1 },
});

/** A long page's ScrollView, with the "back to top" button over it. */
export function ScrollPage({ onScroll, ...props }: ScrollViewProps) {
  const {
    scrollRef,
    onScroll: track,
    showTop,
    scrollToTop,
  } = useScrollToTop<ScrollView>();

  // A field of the page (a note…) stays visible above the keyboard.
  const frameRef = useRef<View>(null);
  const offset = useRef(0);
  const scrollToFocused = useCallback(() => {
    const input =
      TextInput.State.currentlyFocusedInput() as HostInstance | null;
    const frame = frameRef.current;
    if (!input || !frame) return;
    frame.measureInWindow((_fx, frameY) =>
      input.measureInWindow((_x, inputY) =>
        scrollRef.current?.scrollTo({
          y: Math.max(0, offset.current + inputY - frameY - FOCUSED_TOP_MARGIN),
          animated: true,
        }),
      ),
    );
  }, [scrollRef]);
  useEffect(() => {
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      scrollToFocused,
    );
    return () => subscription.remove();
  }, [scrollToFocused]);
  const onFieldFocus = useCallback(() => {
    if (Keyboard.isVisible()) scrollToFocused();
  }, [scrollToFocused]);

  return (
    <KeyboardAvoidingView style={styles.page} behavior="padding">
      <View ref={frameRef} collapsable={false} style={styles.page}>
        <ScrollView
          {...props}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={100}
          onScroll={(event) => {
            offset.current = event.nativeEvent.contentOffset.y;
            track(event);
            onScroll?.(event);
          }}
        >
          <ScrollToFocusedInputContext value={onFieldFocus}>
            {props.children}
          </ScrollToFocusedInputContext>
        </ScrollView>
      </View>
      <ScrollToTopButton visible={showTop} onPress={scrollToTop} />
    </KeyboardAvoidingView>
  );
}

/** Space kept above the focused field once scrolled. */
const FOCUSED_TOP_MARGIN = 96;
