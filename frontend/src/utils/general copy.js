import { CATEGORY_EMOJI } from '../constants/categories';
import { SIZE_OPTIONS } from '../constants/categories';
import { fetchUserItems, syncItemsWithDB } from "../api/itemApi";
import { fetchUserActions, syncActionsWithDB } from "../api/matchApi";
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

const ICON_SHEET_PATH = require('../assets/clothe-item-icon.png');
const ICON_GRID = [
  ['tops', 'jackets_sweaters', 'pants_shorts', 'dresses_skirts'],
  ['shoes', 'accessories', 'other', null],
];

// ---------- FIXED FUNCTION (Option 2: no hooks) ----------
const sheetImage = new Image();
sheetImage.src = ICON_SHEET_PATH;
const iconCache = {};

function cropIcon(row, col, img) {
  const totalMarginX = 2 * 5; // 4 icons + 1 extra margin
  const totalMarginY = 2 * 3; // 2 icons + 1 extra margin
  const iconW = (img.width - totalMarginX) / 4;
  const iconH = (img.height - totalMarginY) / 2;
  const sx = 2 + col * (iconW + 2);
  const sy = 2 + row * (iconH + 2);

  const canvas = document.createElement("canvas");
  canvas.width = iconW;
  canvas.height = iconH;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, iconW, iconH);
  ctx.drawImage(img, sx, sy, iconW, iconH, 0, 0, iconW, iconH);

  return canvas.toDataURL("image/png"); // preserve transparency
}

export function getCategoryIcon(category, size = 32) {
  let row = 0, col = 0;
  let found = false;

  for (let r = 0; r < ICON_GRID.length; r++) {
    for (let c = 0; c < ICON_GRID[r].length; c++) {
      if (ICON_GRID[r][c] === category) {
        row = r;
        col = c;
        found = true;
        break;
      }
    }
    if (found) break;
  }

  if (!found) { row = 1; col = 2; } // fallback

  const key = `${row}-${col}`;
  let dataUrl = iconCache[key];

  if (!dataUrl && sheetImage.complete) {
    dataUrl = cropIcon(row, col, sheetImage);
    iconCache[key] = dataUrl;
  }

  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt={category}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ---------- END FIXED FUNCTION ----------

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
