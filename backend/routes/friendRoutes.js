const express = require('express');
const router = express.Router();
const { getAllFriends, addFriend, updateSortOrder, updateFriend, deleteFriend } = require('../controllers/friendController');

router.get('/', getAllFriends);
router.post('/', addFriend);

router.put('/:id', updateFriend); 
router.patch('/:id/order', updateSortOrder);

router.delete('/:id', deleteFriend);
module.exports = router;