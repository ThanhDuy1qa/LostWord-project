import { useState, useEffect } from 'react';
import axios from 'axios';

export const useManageCharacters = () => {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/friends');
      setCharacters(response.data);
    } catch (error) {
      setMessage('❌ Không thể tải danh sách nhân vật.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`⚠️ Bạn có chắc chắn muốn xóa nhân vật "${name}" không? Hành động này không thể hoàn tác.`)) {
      try {
        await axios.delete(`http://localhost:5000/api/friends/${id}`);
        setMessage(`✅ Đã xóa nhân vật "${name}" thành công.`);
        fetchCharacters();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('❌ Có lỗi xảy ra khi xóa nhân vật.');
      }
    }
  };

  const handleOrderChangeLocal = (id, newOrder) => {
    setCharacters(characters.map(char => 
      char.friend_id === id ? { ...char, sort_order: newOrder } : char
    ));
  };

  const handleOrderBlur = async (id, newOrder) => {
    try {
      await axios.patch(`http://localhost:5000/api/friends/${id}/order`, { sort_order: newOrder || 999 });
    } catch (error) {
      setMessage('❌ Không thể lưu thứ tự!');
    }
  };

  const filteredCharacters = characters.filter(char => 
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    char.universe.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm, setSearchTerm, loading, message, filteredCharacters,
    handleDelete, handleOrderChangeLocal, handleOrderBlur
  };
};