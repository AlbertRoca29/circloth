import { CATEGORY_EMOJI } from '../constants/categories';
import { SIZE_OPTIONS } from '../constants/categories';
import { fetchUserItems, syncItemsWithDB } from "../api/itemApi";
import { syncActionsWithDB } from "../api/matchApi";
import React from 'react';



export function getCategoryEmoji(category) {
  if (!category) return CATEGORY_EMOJI.other;
  let key = category;
  if (typeof category === 'object' && category.category) {
    key = category.category;
  }
  key = String(key).toLowerCase().replace(/\s|\//g, '_');
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.other;
}


// Returns the path to the SVG icon for a given category
// React component to render the SVG icon for a given category
export function CategoryIcon({ category, style = {}, ...props }) {
  let key = category;
  if (!category) key = 'other';
  if (typeof category === 'object' && category.category) {
    key = category.category;
  }
  key = String(key).toLowerCase().replace(/\s|\//g, '_');
  let iconSrc;
  try {
    iconSrc = require(`../assets/${key}.svg`);
  } catch (e) {
    iconSrc = require('../assets/other.svg');
  }
  return (
    <img
      src={iconSrc}
      alt={key + ' icon'}
      style={{ width: 46, height: 46, verticalAlign: 'bottom', ...style }}
      {...props}
    />
  );
}


export function getSizeOptions(t) {
  const translate = (key) => t ? t(key) : key;
  const result = {};
  for (const [cat, opts] of Object.entries(SIZE_OPTIONS)) {
    result[cat] = opts.map(translate);
  }
  return result;
}

// Re-export localStorage utilities from localStorage.js for backward compatibility
export {
  getItemsFromLocalStorage,
  setItemsToLocalStorage,
  clearLocalStorage,
  getActionsFromLocalStorage,
  setActionsToLocalStorage,
  clearActionsFromLocalStorage,
  getMatchesCacheFromLocalStorage,
  setMatchesCacheToLocalStorage,
  clearMatchesCacheFromLocalStorage
} from './localStorage';
