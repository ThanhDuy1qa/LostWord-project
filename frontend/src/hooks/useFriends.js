// src/hooks/useFriends.js
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const useFriends = () => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/friends');
        setFriends(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  // useMemo giúp ghi nhớ kết quả lọc, tăng tốc độ web khi gõ tìm kiếm
  const filteredFriends = useMemo(() => {
    return friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [friends, searchTerm]);

  // Trả về những dữ liệu cần thiết cho giao diện
  return {
    filteredFriends,
    searchTerm,
    setSearchTerm,
    loading
  };
};