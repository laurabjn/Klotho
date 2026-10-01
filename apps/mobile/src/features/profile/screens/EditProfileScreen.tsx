import { Ionicons } from '@expo/vector-icons';
import {
  BIO_MAX,
  COLORS,
  STYLES,
  type ColorKey,
  type Style,
  type UserProfile,
} from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/brand/UserAvatar';
import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import { updateUser, useAuthStore } from '@/features/auth/store/auth.store';
import {
  toFields,
  useSaveStyleProfile,
  useStyleProfile,
} from '@/features/preferences/hooks/useStyleProfile';
import { photosApi } from '@/features/wardrobe/api/photos.api';
import { usePhotoSource } from '@/features/wardrobe/photos/usePhotoSource';
import type { LocalPhoto } from '@/features/wardrobe/photos/pick-photo';
import { useWeatherSettings } from '@/features/weather/hooks/useWeatherSettings';
import { errorMessageKey } from '@/lib/api/errors';
import { styleIcons } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

/** "Modifier mon profil", as on the mockup. */
export function EditProfileScreen() {
  const user = useAuthStore((state) => state.user);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {user && <ProfileForm user={user} />}
    </SafeAreaView>
  );
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { t } = useTranslation();
  const profile = useStyleProfile();
  const saveProfile = useSaveStyleProfile();
  const weather = useWeatherSettings();
  const [firstName, setFirstName] = useState(user.firstName);
  const [bio, setBio] = useState(user.bio ?? '');
  const [chosenStyles, setStyles] = useState<Style[] | null>(null);
  const fields = profile.data ? toFields(profile.data) : null;
  const preferredStyles = chosenStyles ?? fields?.preferredStyles ?? [];
  const preferredColors: ColorKey[] = fields?.preferredColors ?? [];
  const city = weather.data?.city?.name;

  const avatar = useMutation({
    mutationFn: async (photo: LocalPhoto | null) => {
      if (!photo) return authApi.removeAvatar();
      const { key } = await photosApi.upload(photo);
      return authApi.setAvatar(key);
    },
    onSuccess: updateUser,
  });
  const source = usePhotoSource((photo) => avatar.mutate(photo));

  const save = useMutation({
    mutationFn: async () => {
      const saved = await authApi.updateProfile({
        firstName: firstName.trim(),
        bio: bio.trim(),
      });
      if (fields && chosenStyles)
        await saveProfile.mutateAsync({
          ...fields,
          preferredStyles: chosenStyles,
        });
      return saved;
    },
    onSuccess: (saved) => {
      updateUser(saved);
      router.back();
    },
  });
  const error = save.error ?? avatar.error;

  // Favourite styles first, then the others.
  const styleOptions: Style[] = [
    ...preferredStyles,
    ...STYLES.filter((style) => !preferredStyles.includes(style)),
  ];

  return (
    <>
      <FormScrollView contentStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.editProfile.title')}
          overline={t('settings.editProfile.overline')}
        />

        <View style={styles.photoCard}>
          <View>
            <UserAvatar size={104} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.editProfile.choosePhoto')}
              onPress={source.open}
              hitSlop={6}
              style={styles.pencil}
            >
              <Ionicons name="pencil" size={14} color={colors.onPrimary} />
            </Pressable>
          </View>
          <View style={styles.photoText}>
            <AppText variant="heading" style={styles.photoTitle}>
              {t('settings.editProfile.photo')}
            </AppText>
            <AppText variant="overline">
              {t('settings.editProfile.photoOverline')}
            </AppText>
            <Button
              variant="secondary"
              icon="camera-outline"
              decorated={false}
              label={t('settings.editProfile.choosePhoto')}
              loading={avatar.isPending || source.busy}
              onPress={source.open}
            />
            {user.avatarUrl && (
              <Button
                variant="link"
                decorated={false}
                label={t('settings.editProfile.removePhoto')}
                onPress={() => avatar.mutate(null)}
              />
            )}
          </View>
        </View>

        <Field label={t('settings.editProfile.firstName')}>
          <TextField
            label={t('settings.editProfile.firstName')}
            icon="person-outline"
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
          />
        </Field>

        <Field label={t('settings.editProfile.bio')}>
          <View style={styles.bioBox}>
            <TextInput
              multiline
              value={bio}
              onChangeText={setBio}
              maxLength={BIO_MAX}
              placeholder={t('settings.editProfile.bioPlaceholder')}
              placeholderTextColor={colors.placeholder}
              accessibilityLabel={t('settings.editProfile.bio')}
              style={styles.bio}
            />
            <AppText variant="hint" style={styles.counter}>
              {`${bio.length}/${BIO_MAX}`}
            </AppText>
          </View>
        </Field>

        <Field label={t('settings.editProfile.email')}>
          <LinkRow
            icon="mail-outline"
            value={user.email}
            action={t('settings.editProfile.changeEmail')}
            onPress={() => router.push('/account/email')}
          />
        </Field>

        <Field label={t('settings.editProfile.city')}>
          <LinkRow
            icon="location-outline"
            value={city ?? t('settings.editProfile.cityNone')}
            onPress={() => router.push('/weather-settings')}
          />
        </Field>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('settings.editProfile.styles')}
            aside={t('settings.editProfile.seeAll')}
            onAside={() => router.push('/styles')}
          />
          <ChipGroup<Style>
            multiple
            tone="soft"
            options={styleOptions.map((style) => ({
              value: style,
              label: t(`wardrobe.styles.${style}`),
              icon: styleIcons[style],
            }))}
            value={preferredStyles}
            onChange={setStyles}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle
            variant="heading"
            title={t('settings.editProfile.colors')}
            aside={t('settings.editProfile.seeAll')}
            onAside={() => router.push('/palette')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.swatches}
          >
            {preferredColors.map((color) => (
              <View key={color} style={styles.swatchCell}>
                <View
                  style={[styles.swatch, { backgroundColor: COLORS[color] }]}
                />
                <AppText variant="hint" numberOfLines={1} center>
                  {t(`wardrobe.colors.${color}`)}
                </AppText>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.editProfile.add')}
              onPress={() => router.push('/palette')}
              style={styles.swatchCell}
            >
              <View style={[styles.swatch, styles.add]}>
                <Ionicons name="add" size={24} color={colors.title} />
              </View>
              <AppText variant="hint" center>
                {t('settings.editProfile.add')}
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            error ? t(errorMessageKey(error) as 'apiErrors.unknown') : null
          }
        />
        <Button
          label={t('settings.editProfile.save')}
          disabled={firstName.trim().length === 0}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
      {source.element}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {children}
    </View>
  );
}

/** A value that opens another screen (e-mail, city). */
function LinkRow({
  icon,
  value,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  action?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action ? `${value}, ${action}` : value}
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.muted} />
      <AppText numberOfLines={1} style={styles.linkValue}>
        {value}
      </AppText>
      {action ? (
        <AppText style={styles.linkAction}>{action}</AppText>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

const SWATCH = 52;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pencil: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  photoText: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  photoTitle: { fontSize: 21, lineHeight: 26 },
  field: { gap: spacing.xs },
  bioBox: {
    minHeight: 104,
    padding: spacing.md,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  bio: {
    flex: 1,
    minHeight: 64,
    padding: 0,
    textAlignVertical: 'top',
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.body,
  },
  counter: { alignSelf: 'flex-end' },
  linkRow: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
  linkValue: {
    flex: 1,
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.title,
  },
  linkAction: { fontFamily: fonts.serif, fontSize: 15, color: colors.link },
  section: { gap: spacing.sm },
  bleed: { marginHorizontal: -spacing.xl },
  swatches: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  swatchCell: { width: 68, alignItems: 'center', gap: spacing.xs },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
