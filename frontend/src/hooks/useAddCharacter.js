// src/hooks/useAddCharacter.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAddCharacter = () => {
  const [formData, setFormData] = useState({
    name: '', rarity_code: 'GENERAL', universe: 'L1', role: 'Attack', image_url: '/image/friend/'
  });
  const [message, setMessage] = useState('');

  // State cho gợi ý tên
  const [l1Names, setL1Names] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Lấy danh sách tên nhân vật L1 từ DB
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/friends');
        const l1Chars = response.data
          .filter(f => f.universe === 'L1')
          .map(f => f.name);
        setL1Names([...new Set(l1Chars)]);
      } catch (error) {
        console.error("Lỗi lấy danh sách nhân vật L1:", error);
      }
    };
    fetchFriends();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'name') {
        const cleanName = value.trim().replace(/\s+/g, '_');
        updated.image_url = cleanName ? `/image/friend/${cleanName}` : '/image/friend/';
      }

      return updated;
    });

    if (name === 'name') setShowSuggestions(true);
  };

  const handleSelectName = (selectedName) => {
    const cleanName = selectedName.trim().replace(/\s+/g, '_');
    setFormData(prev => ({
      ...prev,
      name: selectedName,
      image_url: `/image/friend/${cleanName}`
    }));
    setShowSuggestions(false);
  };

  // 🌟 Hàm xử lý gửi Form (handleSubmit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/friends', formData);
      setMessage('✅ Thêm Nhân Vật thành công!');
      setFormData({ name: '', rarity_code: 'GENERAL', universe: 'L1', role: 'Attack', image_url: '/image/friend/' });
    } catch (error) {
      console.error("Lỗi thêm nhân vật:", error);
      setMessage('❌ Có lỗi xảy ra khi thêm nhân vật vào cơ sở dữ liệu.');
    }
  };

  // Lọc tên theo từ khóa gõ
  const filteredNames = l1Names.filter(name => 
    name.toLowerCase().includes(formData.name.toLowerCase())
  );

  return { 
    formData, message, showSuggestions, filteredNames,
    setShowSuggestions, handleChange, handleSelectName, handleSubmit 
  };
};