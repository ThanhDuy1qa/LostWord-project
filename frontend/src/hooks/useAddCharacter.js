// src/hooks/useAddCharacter.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const useAddCharacter = () => {
  const [formData, setFormData] = useState({
    name: '', rarity_code: 'GENERAL', universe: 'L1', role: 'Attack', image_url: '/image/friend/'
  });
  const [message, setMessage] = useState('');

  // State cho danh sách độ hiếm lấy từ DB
  const [rarityList, setRarityList] = useState([]);

  // State cho gợi ý tên
  const [l1Names, setL1Names] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Lấy danh sách tên nhân vật L1 & Danh sách Rarity từ DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Lấy danh sách nhân vật
        const friendRes = await axios.get(`${API_BASE_URL}/friends`);
        const l1Chars = friendRes.data
          .filter(f => f.universe === 'L1')
          .map(f => f.name);
        setL1Names([...new Set(l1Chars)]);

        // 2. Lấy danh sách Rarity (Sửa lại URL API của bạn nếu khác)
        const rarityRes = await axios.get(`${API_BASE_URL}/friends/rarities`);
        setRarityList(rarityRes.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu từ DB:", error);
      }
    };
    fetchData();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/friends`, formData);
      setMessage('✅ Thêm Nhân Vật thành công!');
      setFormData({ name: '', rarity_code: 'GENERAL', universe: 'L1', role: 'Attack', image_url: '/image/friend/' });
    } catch (error) {
      console.error("Lỗi thêm nhân vật:", error);
      setMessage('❌ Có lỗi xảy ra khi thêm nhân vật vào cơ sở dữ liệu.');
    }
  };

  const filteredNames = l1Names.filter(name => 
    name.toLowerCase().includes(formData.name.toLowerCase())
  );

  return { 
    formData, message, showSuggestions, filteredNames, rarityList,
    setShowSuggestions, handleChange, handleSelectName, handleSubmit 
  };
};