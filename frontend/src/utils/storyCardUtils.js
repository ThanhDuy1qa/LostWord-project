// src/utils/storyCardUtils.js
import { sanitizePathString } from './pathSanitizer';

export const getStoryCardImageUrl = (imageUrlRaw) => {
  if (!imageUrlRaw) return '/image/storycard/default.webp';

  const rawPath = String(imageUrlRaw).trim();
  const rawFileName = rawPath.split('/').pop().trim().replace(/\.webp$/i, '');

  // Lọc an toàn toàn bộ ký tự ?, !, #, :, v.v.
  const safeFileName = sanitizePathString(rawFileName);

  return `/image/storycard/${safeFileName}.webp`;
};