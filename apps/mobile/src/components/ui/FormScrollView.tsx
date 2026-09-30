import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import {
  ScrollToFocusedInputContext,
  useScrollToFocusedInput,
} from './useScrollToFocusedInput';

/** Scrollable form that keeps the focused field above the keyboard. */
export function FormScrollView({
  children,
  contentStyle,
}: {
  children: ReactNode;
  contentStyle?: ViewStyle;
}) {
  const { scrollRef, contentRef, onFieldFocus } = useScrollToFocusedInput();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
        <View ref={contentRef} collapsable={false} style={contentStyle}>
          <ScrollToFocusedInputContext value={onFieldFocus}>
            {children}
          </ScrollToFocusedInputContext>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
