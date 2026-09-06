// src/utils/storyCardUtils.js

export const getStoryCardImageUrl = (imageUrlRaw) => {
  if (!imageUrlRaw) return '/image/storycard/default.webp';

  const rawPath = String(imageUrlRaw).trim();
  let fileName = rawPath.split('/').pop().trim();

  // Bỏ đuôi .webp nếu lỡ dính sẵn trong DB
  fileName = fileName.replace(/\.webp$/i, '');

  // 🌟 Chuyển dấu '#' thành '_hash_' an toàn 100%
  const safeFileName = fileName.replaceAll('#', 'hash_'); 
  // (Nếu file bạn đặt là Report_hash_1.webp thì thay '#' thành 'hash_')
  // (Nếu file bạn đặt là Report__hash_1.webp thì thay '#' thành '_hash_')

  return `/image/storycard/${safeFileName}.webp`;
};