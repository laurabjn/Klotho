import type { ImageSource } from 'expo-image';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

import { StateView } from './StateView';

interface Action {
  label: string;
  onPress: () => void;
}

/**
 * Our explanation before a system permission (photos, location), full
 * screen with its illustration as on the mockups. The back button is the
 * "later" choice.
 */
export function PermissionScreen({
  visible,
  image,
  title,
  body,
  primary,
  secondary,
  onClose,
}: {
  visible: boolean;
  image: ImageSource;
  title: string;
  body: string;
  primary: Action;
  secondary: Action;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <StateView
            image={image}
            title={title}
            body={body}
            primary={primary}
            link={secondary}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
