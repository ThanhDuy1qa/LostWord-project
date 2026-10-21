import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getStoryCardImageUrl } from '../utils/storyCardUtils';
import { API_BASE_URL } from '../config/api';

export const useStoryCardDetail = () => {
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [stats, setStats] = useState(null);
  const [effects, setEffects] = useState([]);
  const [dictionary, setDictionary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setLoading(true);
        const [cardRes, statsRes, effectsRes, dictRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/storycards/${id}`),
          axios.get(`${API_BASE_URL}/storycards/${id}/stats`),
          axios.get(`${API_BASE_URL}/storycards/${id}/effects`), 
          axios.get(`${API_BASE_URL}/storycards/dictionary/effects`)
        ]);

        setCard({
          ...cardRes.data,
          display_image_url: getStoryCardImageUrl(cardRes.data.image_url)
        });
        setStats(statsRes.data);
        setEffects(effectsRes.data);
        setDictionary(dictRes.data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết Story Card:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetailData();
  }, [id]);

  return { card, stats, effects, dictionary, loading };
};