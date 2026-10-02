import type { CreateWardrobeItemInput, WardrobeItem } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { errorMessageKey, NetworkError } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import {
  SECTION_FIELDS,
  SECTION_ORDER,
  SECTIONS,
  useWardrobeItemForm,
  type SectionKey,
} from '../form/WardrobeItemFormSections';
import { useCreateWardrobeItemWithPhotos } from '../hooks/useWardrobe';
import { LocalPhotoGrid } from '../photos/LocalPhotoGrid';
import type { LocalPhoto } from '../photos/pick-photo';
import { UploadStateView } from '../photos/UploadStateView';

type Step = 'photo' | SectionKey;

/** Stepper as on the mockup: Photo (optional), Infos, Couleurs, Style, Saison. */
const STEPS: Step[] = ['photo', ...SECTION_ORDER];

/** Once the form is sent with photos, the screen follows their upload. */
type Upload =
  | { phase: 'sending'; share: number; total: number }
  | { phase: 'success'; item: WardrobeItem }
  | {
      phase: 'error';
      body: CreateWardrobeItemInput;
      /** Null when the piece itself could not be created. */
      item: WardrobeItem | null;
      photos: LocalPhoto[];
    };

export function AddWardrobeItemScreen() {
  const { t } = useTranslation();
  const form = useWardrobeItemForm();
  const create = useCreateWardrobeItemWithPhotos();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [upload, setUpload] = useState<Upload | null>(null);

  const key = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const stepLabel = t('wardrobe.form.step', {
    current: step + 1,
    total: STEPS.length,
  });

  const next = async () => {
    if (key !== 'photo' && !(await form.trigger(SECTION_FIELDS[key]))) return;
    if (!isLast) return setStep(step + 1);
    await form.handleSubmit((body) => {
      if (photos.length === 0) {
        create.mutate(
          { body, photos },
          { onSuccess: ({ item }) => router.replace(`/piece/${item.id}`) },
        );
      } else {
        send(body, photos);
      }
    })();
  };

  const send = (
    body: CreateWardrobeItemInput,
    toSend: LocalPhoto[],
    existing?: WardrobeItem,
  ) => {
    const total = toSend.length;
    setUpload({ phase: 'sending', share: 0, total });
    create.mutate(
      {
        body,
        photos: toSend,
        existing,
        onProgress: (share) => setUpload({ phase: 'sending', share, total }),
      },
      {
        onSuccess: ({ item, failedPhotos }) =>
          setUpload(
            failedPhotos.length > 0
              ? { phase: 'error', body, item, photos: failedPhotos }
              : { phase: 'success', item },
          ),
        // Without connection the upload screen offers to try again; any
        // other refusal of the piece is explained on the form.
        onError: (error) =>
          setUpload(
            error instanceof NetworkError
              ? { phase: 'error', body, item: null, photos: toSend }
              : null,
          ),
      },
    );
  };

  const addAnother = () => {
    form.reset();
    setPhotos([]);
    setStep(0);
    setUpload(null);
    create.reset();
  };

  if (upload) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <AppHeader />
          <ScreenHeader
            back={false}
            title={t('states.upload.title')}
            overline={t('wardrobe.form.addOverline')}
          />
        </View>
        <FormScrollView contentStyle={styles.form}>
          {upload.phase === 'sending' ? (
            <UploadStateView state={upload} photo={photos[0]} />
          ) : upload.phase === 'success' ? (
            <UploadStateView
              state={upload}
              photo={photos[0]}
              primary={{
                label: t('states.upload.details'),
                onPress: () => router.replace(`/piece/${upload.item.id}/edit`),
              }}
              secondary={{
                label: t('states.upload.another'),
                onPress: addAnother,
              }}
            />
          ) : (
            <UploadStateView
              state={upload}
              photo={upload.photos[0]}
              primary={{
                label: t('states.upload.retry'),
                onPress: () =>
                  send(upload.body, upload.photos, upload.item ?? undefined),
              }}
              secondary={{
                label: t('states.upload.cancel'),
                // The piece stays, without the photos that failed.
                onPress: () =>
                  upload.item
                    ? router.replace(
                        `/piece/${upload.item.id}?photosFailed=${upload.photos.length}`,
                      )
                    : setUpload(null),
              }}
            />
          )}
        </FormScrollView>
      </SafeAreaView>
    );
  }

  const Section = key === 'photo' ? null : SECTIONS[key];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <AppHeader />
        <ScreenHeader
          title={t('wardrobe.form.addTitle')}
          overline={t('wardrobe.form.addOverline')}
          onBack={() => (step > 0 ? setStep(step - 1) : router.back())}
        />
        <StepIndicator
          steps={STEPS.map((s) => t(`wardrobe.form.steps.${s}`))}
          current={step}
          accessibilityLabel={stepLabel}
        />
      </View>
      <FormScrollView contentStyle={styles.form}>
        {Section ? (
          <Section form={form} />
        ) : (
          <LocalPhotoGrid photos={photos} onChange={setPhotos} />
        )}
      </FormScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            create.error
              ? t(errorMessageKey(create.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={
            isLast ? t('wardrobe.form.create') : t('wardrobe.form.continue')
          }
          loading={create.isPending}
          onPress={() => void next()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: {
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  form: { gap: spacing.xxl, padding: spacing.xl },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
