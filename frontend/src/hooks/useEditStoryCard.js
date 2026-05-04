import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export const useEditStoryCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', rarity: 5, type: '', image_url: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [allCardsList, setAllCardsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [saveAction, setSaveAction] = useState('next'); 

  const [effectDict, setEffectDict] = useState([]); 
  
  // KHỞI TẠO MẶC ĐỊNH 3 HIỆU ỨNG RỖNG
  const defaultEffects = [
    { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '' },
    { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '' },
    { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '' }
  ];
  const [cardEffects, setCardEffects] = useState(defaultEffects); 

  const [stat1, setStat1] = useState({ type: 'hp', value: 0 });
  const [stat2, setStat2] = useState({ type: 'yang_atk', value: 0 });

  // Tải Dictionary một lần duy nhất
  useEffect(() => {
    axios.get('http://localhost:5000/api/storycards/dictionary/effects')
      .then(res => setEffectDict(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cardsRes, effectsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/storycards'),
          axios.get(`http://localhost:5000/api/storycards/${id}/effects`),
          axios.get(`http://localhost:5000/api/storycards/${id}/stats`)
        ]);

        const allCards = cardsRes.data;
        setAllCardsList(allCards);

        const index = allCards.findIndex(c => String(c.storycard_id) === String(id));
        setCurrentIndex(index);

        if (index !== -1) {
          const cardToEdit = allCards[index];
          setFormData({
            name: cardToEdit.name, rarity: cardToEdit.rarity,
            type: cardToEdit.type, image_url: cardToEdit.image_url
          });
          setOriginalImageUrl(cardToEdit.image_url);
          
          // GHI ĐÈ 3 HIỆU ỨNG MẶC ĐỊNH NẾU DB CÓ DỮ LIỆU
          if (effectsRes.data.length > 0) {
              const loadedEffects = [...defaultEffects];
              effectsRes.data.forEach((eff, i) => {
                  if(i < 3) loadedEffects[i] = { ...loadedEffects[i], ...eff };
              });
              setCardEffects(loadedEffects);
          } else {
             setCardEffects(defaultEffects); // Reset về 3 rỗng nếu chuyển sang thẻ không có effect
          }

          if (statsRes.data.length > 0) {
            const dbStats = statsRes.data[0];
            const activeStats = [];
            ['hp', 'yin_atk', 'yang_atk', 'yin_def', 'yang_def', 'agility'].forEach(key => {
              if (dbStats[key] > 0 || dbStats[key] < 0) activeStats.push({ type: key, value: dbStats[key] });
            });
            if (activeStats[0]) setStat1(activeStats[0]);
            if (activeStats[1]) setStat2(activeStats[1]);
          } else {
            // Reset stats nếu thẻ không có
            setStat1({ type: 'hp', value: 0 });
            setStat2({ type: 'yang_atk', value: 0 });
          }

        } else setMessage('❌ Không tìm thấy thẻ.');
      } catch (error) {
        setMessage('❌ Lỗi kết nối máy chủ.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Các hàm điều hướng, thay đổi form giữ nguyên
  const handleNavigate = (direction) => {
    setMessage('');
    if (currentIndex === -1) return; 
    if (direction === 'prev' && currentIndex > 0) {
      navigate(`/edit-storycard/${allCardsList[currentIndex - 1].storycard_id}`);
    } else if (direction === 'next' && currentIndex < allCardsList.length - 1) {
      navigate(`/edit-storycard/${allCardsList[currentIndex + 1].storycard_id}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const autoUrl = `/image/storycard/${value.trim().replace(/\s+/g, '_')}`;
      setFormData(prev => ({ ...prev, name: value, image_url: autoUrl }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ẨN CÁC HÀM ADD/REMOVE EFFECT VÌ ĐÃ CỐ ĐỊNH 3 DÒNG
  // const addEffect = () => { ... }
  // const removeEffect = (index) => { ... }

  const handleEffectChange = (index, field, value) => {
    const newEffects = [...cardEffects];
    
    if (field === 'ui_group') {
      // Khi chọn Nhóm: Cập nhật nhóm, XÓA hiệu ứng cũ để bắt chọn lại
      newEffects[index].ui_group = value;
      newEffects[index].effect_code = ''; 
    } 
    else if (field === 'effect_code') {
      newEffects[index].effect_code = value;
      
      // AUTO LOGIC: Tự động nhảy số dựa theo nhóm hiệu ứng
      if (value !== '') {
        const dictItem = effectDict.find(d => d.effect_code === value);
        if (dictItem) {
          newEffects[index].ui_group = dictItem.effect_group; // Đảm bảo UI luôn đồng bộ Nhóm
          
          if (dictItem.effect_group === 'Bullet Modifier' || dictItem.effect_group === 'Elemental Modifier') {
            newEffects[index].value = 50; // Tự động set 50%
            newEffects[index].duration = 1; // Mặc định 1 turn
          }
        }
      }
    } 
    else {
      newEffects[index][field] = value;
    }

    setCardEffects(newEffects);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const statsPayload = { hp: 0, yin_atk: 0, yang_atk: 0, yin_def: 0, yang_def: 0, agility: 0 };
      statsPayload[stat1.type] = stat1.value || 0;
      statsPayload[stat2.type] = stat2.value || 0;

      // Lọc bỏ các effect rỗng trước khi gửi
      const effectsPayload = cardEffects.filter(eff => eff.effect_code !== '');

      const payload = { ...formData, effects: effectsPayload, stats: statsPayload };
      
      await axios.put(`http://localhost:5000/api/storycards/${id}`, payload);
      setOriginalImageUrl(formData.image_url); 

      // --- CẬP NHẬT LOGIC ĐIỀU HƯỚNG ---
      if (saveAction === 'next') {
        setMessage('✅ Lưu thành công! Đang qua thẻ kế tiếp...');
        setTimeout(() => {
          if (currentIndex !== -1 && currentIndex < allCardsList.length - 1) {
            navigate(`/edit-storycard/${allCardsList[currentIndex + 1].storycard_id}`);
          } else navigate('/manage-storycards');
        }, 1000);
      } else if (saveAction === 'list') {
        setMessage('✅ Lưu thành công! Đang về trang quản lý...');
        setTimeout(() => navigate('/manage-storycards'), 1000);
      } else {
        // Tuỳ chọn "stay": Lưu & Ở lại trang hiện tại
        setMessage('✅ Lưu thành công!');
        // Tự động ẩn thông báo sau 3 giây để màn hình đỡ rối
        setTimeout(() => setMessage(''), 3000); 
      }
      
    } catch (error) {
      setMessage('❌ Có lỗi xảy ra khi lưu.');
    }
  };
  return {
    formData, message, loading, currentIndex, allCardsList, originalImageUrl, saveAction, setSaveAction, 
    handleNavigate, handleChange, handleSubmit, navigate,
    effectDict, cardEffects, handleEffectChange, // Bỏ addEffect, removeEffect
    stat1, setStat1, stat2, setStat2
  };
};