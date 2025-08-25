export const SIZE_OPTIONS = {
  tops: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'other'],
  jackets_sweaters: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'one_size', 'other'],
  pants_shorts: ['28-30', '32-34', '36-38', '40-42', '44+', 'S', 'M', 'L', 'XL', 'other'],
  dresses_skirts: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'one_size', 'other'],
  shoes: ['35-37', '38-40', '41-43', '44-46', '47+', 'other'],
  accessories: ['one_size', 'S', 'M', 'L', 'XL'],
  other: ['one_size', 'S', 'M', 'L', 'XL']
};

export const CATEGORIES = [
  { key: 'tops', labelKey: 'category_tops' },
  { key: 'jackets_sweaters', labelKey: 'category_jackets_sweaters' },
  { key: 'pants_shorts', labelKey: 'category_pants_shorts' },
  { key: 'dresses_skirts', labelKey: 'category_dresses_skirts' },
  { key: 'shoes', labelKey: 'category_shoes' },
  { key: 'accessories', labelKey: 'category_accessories' },
  { key: 'other', labelKey: 'category_other' }
];

export const CATEGORY_EMOJI = {
  tops: "👕",
  jackets_sweaters: "🧥",
  pants_shorts: "👖",
  dresses_skirts: "👗",
  shoes: "👟",
  accessories: "👜",
  other: "✨"
};
