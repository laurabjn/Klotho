import type { WardrobeItem } from '@klotho/shared';
import type { TFunction } from 'i18next';

/** Sub-categories are free text: known keys are translated, anything else is shown as typed. */
export function subcategoryLabel(t: TFunction, subcategory: string): string {
  return t(
    `wardrobe.subcategories.${subcategory}` as 'wardrobe.subcategories.blouse',
    {
      defaultValue: subcategory,
    },
  );
}

/** Display name: the given name, else the sub-category, else the category. */
export function itemTitle(
  t: TFunction,
  item: Pick<WardrobeItem, 'name' | 'subcategory' | 'category'>,
) {
  if (item.name) return item.name;
  if (item.subcategory) return subcategoryLabel(t, item.subcategory);
  return t(`wardrobe.category.${item.category}`);
}
