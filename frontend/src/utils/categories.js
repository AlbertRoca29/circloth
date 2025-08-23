
export const CATEGORIES = [
  { key: 'tops', labelKey: 'category_tops' },
  { key: 'jackets_sweaters', labelKey: 'category_jackets_sweaters' },
  { key: 'pants_shorts', labelKey: 'category_pants_shorts' },
  { key: 'dresses_skirts', labelKey: 'category_dresses_skirts' },
  { key: 'shoes', labelKey: 'category_shoes' },
  { key: 'accessories', labelKey: 'category_accessories' },
  { key: 'other', labelKey: 'category_other' },
];

export function getSizeOptions(t) {
  return {
    tops: ['XS', 'S', 'M', 'L', 'XL', 'XXL', t('other')],
    jackets_sweaters: ['XS', 'S', 'M', 'L', 'XL', 'XXL', t('one_size'), t('other')],
    pants_shorts: ['28-30', '32-34', '36-38', '40-42', '44+', 'S', 'M', 'L', 'XL', t('other')],
    dresses_skirts: ['XS', 'S', 'M', 'L', 'XL', 'XXL', t('one_size'), t('other')],
    shoes: ['35-37', '38-40', '41-43', '44-46', '47+', t('other')],
    accessories: [t('one_size'), 'S', 'M', 'L', 'XL'],
    other: [t('one_size'), 'S', 'M', 'L', 'XL']
  };
}
