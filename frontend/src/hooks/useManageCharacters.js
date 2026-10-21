// src/hooks/useManageCharacters.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const useManageCharacters = () => {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | NO_DETAILS | MISSING_IMAGE | INCOMPLETE
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/friends`);
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
        await axios.delete(`${API_BASE_URL}/friends/${id}`);
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
      await axios.patch(`${API_BASE_URL}/friends/${id}/order`, { sort_order: newOrder || 999 }); 
    } catch (error) {
      setMessage('❌ Không thể lưu thứ tự!');
    }
  };

  // Kiểm tra nhân vật thiếu thông tin cơ bản hoặc thiếu chi tiết
  const isIncomplete = (char) => {
    const missingImg = !char.image_url || char.image_url.trim() === '';
    const missingUniverse = !char.universe || char.universe.trim() === '';
    const missingRole = !char.role || char.role.trim() === '';
    const missingDetails = !char.has_details;
    return missingImg || missingUniverse || missingRole || missingDetails;
  };

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = 
      (char.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (char.universe || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === 'NO_DETAILS') {
      matchesFilter = !char.has_details; // Lọc các nhân vật chưa có chi tiết Stats/Skill
    } else if (filterStatus === 'MISSING_IMAGE') {
      matchesFilter = !char.image_url || char.image_url.trim() === '';
    } else if (filterStatus === 'INCOMPLETE') {
      matchesFilter = isIncomplete(char);
    }

    return matchesSearch && matchesFilter;
  });

  return {
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    loading, message, filteredCharacters,
    handleDelete, handleOrderChangeLocal, handleOrderBlur
  };
};