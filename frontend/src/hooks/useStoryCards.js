import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export const useStoryCards = () => {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        // Lưu ý: Bạn cần tạo API /api/storycards ở Backend nhé
        const res = await axios.get('http://localhost:5000/api/storycards');
        setCards(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu Story Card:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((card) =>
      card.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cards, searchTerm]);

  return {
    filteredCards,
    searchTerm,
    setSearchTerm,
    loading
  };
};