import imageCompression from "browser-image-compression";
import { FastAverageColor } from 'fast-average-color';

/**
 * Compress an image file using browser-image-compression.
 * @param {File} file - The image file to compress.
 * @param {Object} options - Compression options.
 * @returns {Promise<File>} - The compressed image file.
 */
export async function compressImage(file, options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true }) {
  return await imageCompression(file, options);
}

/**
 * Get the average color (hex) from an image URL using fast-average-color.
 * @param {string} imageUrl - The object URL of the image.
 * @returns {Promise<string>} - The hex color string.
 */
export async function getAverageColorFromImage(imageUrl) {
  try {
    const fac = new FastAverageColor();
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const colorObj = fac.getColor(img);
    return colorObj.hex;
  } catch (err) {
    return '#cccccc'; // fallback color
  }
}
