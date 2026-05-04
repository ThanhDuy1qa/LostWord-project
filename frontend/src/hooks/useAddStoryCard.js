import { useState } from 'react';
import axios from 'axios';

export const useAddStoryCard = () => {
  const [formData, setFormData] = useState({
    name: '', rarity: 5, type: 'Bamboo', image_url: '/image/storycard/'
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/storycards', formData);
      setMessage('✅ Thêm Story Card thành công!');
      setFormData({ name: '', rarity: 5, type: 'Bamboo', image_url: '/image/storycard/' });
    } catch (error) {
      console.error("Lỗi thêm thẻ:", error);
      setMessage('❌ Có lỗi xảy ra khi thêm thẻ vào cơ sở dữ liệu.');
    }
  };

  return { formData, message, handleChange, handleSubmit };
};