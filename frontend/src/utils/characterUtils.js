// src/utils/characterUtils.js

export const getCharacterImageUrl = (universeRaw, imageUrlRaw) => {
  const universe = universeRaw ? String(universeRaw).replace(/\s+/g, '') : "B3";
  const rawPath = imageUrlRaw ? String(imageUrlRaw).trim() : "";
  const fileName = rawPath.split('/').pop().trim();
  
  // ÁNH XẠ NGƯỢC (REVERSE MAPPING): 
  // Biến các ký tự đẹp từ DB trở lại thành dấu gạch dưới để khớp với thư mục vật lý
  let folderName = universe
    .replaceAll(':', '___')
    .replaceAll('>', '__')
    .replaceAll('<', '_');

  // Giữ lại đoạn code fix lỗi dấu # của bạn lúc nãy
  folderName = folderName.replaceAll('#', '%'); 
  
  // Gắn folderName đã được dịch ngược vào đường dẫn ảnh
  return encodeURI(`/image/friend/${folderName}/${fileName}.webp`);
};

// ... (Hàm getRoleIconUrl giữ nguyên bên dưới)

// Hàm lấy đường dẫn icon Role (Giữ nguyên)
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
  return encodeURI(`/image/role/${shortRole}_icon.png`);
};