import { useState, useEffect } from 'react';
import axios from 'axios';
// 🌟 1. Import hàm chuyển đổi URL ảnh an toàn
import { getStoryCardImageUrl } from '../utils/storyCardUtils';

export const useManageStoryCards = () => {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('order');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/storycards');
      setCards(response.data);
    } catch (error) {
      setMessage('❌ Không thể tải danh sách Story Card.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa Story Card "${name}" không?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/storycards/${id}`);
        setMessage(`✅ Đã xóa thẻ "${name}" thành công.`);
        fetchCards();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('❌ Có lỗi xảy ra khi xóa thẻ.');
      }
    }
  };

  const handleOrderChangeLocal = (id, newOrder) => {
    setCards(cards.map(card => 
      card.storycard_id === id ? { ...card, sort_order: newOrder } : card
    ));
  };

  const handleOrderBlur = async (id, newOrder) => {
    try {
      await axios.patch(`http://localhost:5000/api/storycards/${id}/order`, { 
        sort_order: newOrder === '' ? 999 : (Number(newOrder) ?? 999) 
      });
    } catch (error) {
      setMessage('❌ Không thể lưu thứ tự!');
    }
  };

  // 🌟 2. Lọc an toàn (tránh lỗi crash khi field bị null/undefined)
  let filteredCards = cards.filter(card => 
    (card.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🌟 3. Sắp xếp chính xác (sử dụng ?? thay cho || để không nuốt mất số 0)
  filteredCards = filteredCards.sort((a, b) => {
    if (sortOption === 'id') {
      return a.storycard_id - b.storycard_id;
    } else if (sortOption === 'name') {
      return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
    } else { 
      const orderA = a.sort_order ?? 999;
      const orderB = b.sort_order ?? 999;

      if (orderA === orderB) {
         return a.storycard_id - b.storycard_id; 
      }
      return orderA - orderB; 
    }
  });

  // 🌟 4. Gắn thuộc tính display_image_url đã qua xử lý dấu '#' -> 'hash_'
  const formattedCards = filteredCards.map(card => ({
    ...card,
    display_image_url: getStoryCardImageUrl(card.image_url)
  }));

  return {
    searchTerm, setSearchTerm, 
    sortOption, setSortOption, 
    loading, message, 
    filteredCards: formattedCards, // Trả về danh sách đã có URL ảnh chuẩn
    handleDelete, handleOrderChangeLocal, handleOrderBlur
  };
};