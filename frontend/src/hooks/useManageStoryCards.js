import { useState, useEffect } from 'react';
import axios from 'axios';

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
      await axios.patch(`http://localhost:5000/api/storycards/${id}/order`, { sort_order: newOrder || 999 });
    } catch (error) {
      setMessage('❌ Không thể lưu thứ tự!');
    }
  };

  let filteredCards = cards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. LOGIC MỚI: Sắp xếp dựa trên sortOption
  filteredCards = filteredCards.sort((a, b) => {
    if (sortOption === 'id') {
      return a.storycard_id - b.storycard_id; // Tăng dần theo ID
    } else if (sortOption === 'name') {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    } else { // Mặc định là 'order'
      // Sắp xếp theo sort_order, nếu sort_order bằng nhau thì ưu tiên ID nhỏ hơn
      if (a.sort_order === b.sort_order) {
         return a.storycard_id - b.storycard_id; 
      }
      return (a.sort_order || 999) - (b.sort_order || 999); 
    }
  });

  return {
    searchTerm, setSearchTerm, 
    sortOption, setSortOption, // Xuất thêm State này ra
    loading, message, filteredCards,
    handleDelete, handleOrderChangeLocal, handleOrderBlur
  };
};