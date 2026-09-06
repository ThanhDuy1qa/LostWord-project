// src/utils/characterUtils.js
import { sanitizePathString } from './pathSanitizer';

export const getCharacterImageUrl = (universeRaw, imageUrlRaw) => {
  const universe = universeRaw ? String(universeRaw).replace(/\s+/g, '') : "B3";
  const rawPath = imageUrlRaw ? String(imageUrlRaw).trim() : "";
  const rawFileName = rawPath.split('/').pop().trim().replace(/\.webp$/i, '');

  // Áp dụng quy tắc an toàn đồng bộ cho cả Folder và File name
  const folderName = sanitizePathString(universe);
  const fileName = sanitizePathString(rawFileName);

  return `/image/friend/${folderName}/${fileName}.webp`;
};

export const getRoleIconUrl = (role) => {
  const roleMap = {
    'Attack': 'ATK',
    'Defense': 'DEF',
    'Support': 'SUPP',
    'Heal': 'HEAL',
    'Speed': 'SPD',
    'Destroy': 'DEST',
    'Technical': 'TEC',
    'Debuff': 'DBF'
  };
  const shortRole = roleMap[role] || role;
  return `/image/role/${shortRole}_icon.png`;
};