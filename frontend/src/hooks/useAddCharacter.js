import { useState } from 'react';
import axios from 'axios';

export const useAddCharacter = () => {
  const [formData, setFormData] = useState({
    name: '', rarity_code: 'GENERAL', universe: 'L1', role: 'Attack', image_url: '/image/friend/'
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  return { formData, message, handleChange, handleSubmit };
};