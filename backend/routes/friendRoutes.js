const express = require('express');
const router = express.Router();
const { 
  getAllFriends, 
  addFriend, 
  updateSortOrder, 
  updateFriend, 
  deleteFriend, 
  getRarities,
  getFriendSuggestions,
  getFriendJsonData,
  getFriendById,
  updateFriendDetails
} = require('../controllers/friendController');

// 1. Lấy tất cả nhân vật & Thêm mới
router.get('/', getAllFriends);
router.post('/', addFriend);

// 2. Lấy danh sách độ hiếm (Rarity)
router.get('/rarities', getRarities);

// 3. Gợi ý Universe & Name
router.get('/suggestions', getFriendSuggestions);

// 4. Tìm & Đọc file JSON từ thư mục public/data/friends
router.get('/json/:filename', getFriendJsonData);

// 5. [BỔ SUNG] Lấy chi tiết & Lưu thuộc tính nâng cao cho useEditFriendDetail.js
router.get('/:id/details', getFriendById);
router.put('/:id/details', updateFriendDetails);
router.post('/:id/save', updateFriendDetails); // Giữ dự phòng cho request POST nếu có

// 6. Cập nhật thông tin cơ bản / Thứ tự / Xóa (Cho useEditCharacter.js)
router.get('/:id', getFriendById);
router.put('/:id', updateFriend); 
router.patch('/:id/order', updateSortOrder);
router.delete('/:id', deleteFriend);

module.exports = router;