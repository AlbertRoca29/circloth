// utils/general.js
// General utility and shared data for the frontend

export const categoryEmoji = {
  tops: "👕",
  jackets_sweaters: "🧥",
  pants_shorts: "👖",
  dresses_skirts: "👗",
  shoes: "👟",
  accessories: "👜",
  other: "✨"
};

export function getCategoryEmoji(category) {
  if (!category) return categoryEmoji.other;
  let key = category;
  if (typeof category === 'object' && category.category) {
    key = category.category;
  }
  key = String(key).toLowerCase().replace(/\s|\//g, '_');
  return categoryEmoji[key] || categoryEmoji.other;
}

// You can add more general utilities or shared data here
