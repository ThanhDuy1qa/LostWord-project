const express = require('express');
const router = express.Router();
const { 
  getAllStoryCards, addStoryCard, updateStoryCard, updateSortOrder, deleteStoryCard,
  getEffectDictionary, getStoryCardEffects, getStoryCardStats 
} = require('../controllers/storycardController');

// 1. CÁC ROUTE TĨNH PHẢI NẰM TRÊN CÙNG
router.get('/dictionary/effects', getEffectDictionary);
router.get('/', getAllStoryCards);
router.post('/', addStoryCard);

// 2. CÁC ROUTE CÓ BIẾN /:id NẰM BÊN DƯỚI
router.get('/:id/effects', getStoryCardEffects);
router.get('/:id/stats', getStoryCardStats);
router.put('/:id', updateStoryCard);
router.patch('/:id/order', updateSortOrder);
router.delete('/:id', deleteStoryCard);

module.exports = router;