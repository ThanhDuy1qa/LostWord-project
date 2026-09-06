import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import scrapedCards from '../data/scraped_cards.json';

export const useEditStoryCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', rarity: 5, type: '', image_url: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [allCardsList, setAllCardsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [saveAction, setSaveAction] = useState('stay'); 

  const [effectDict, setEffectDict] = useState([]); 

  // --- STATE CHO GỢI Ý TÊN ---
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- STATE CHO EFFECTS ---
  const [baseEffects, setBaseEffects] = useState([]); 
  const [luckGroups, setLuckGroups] = useState([]);   

  // --- STATE CHO STATS ---
  const [isRandomStat, setIsRandomStat] = useState(false);
  const [randomRange, setRandomRange] = useState({ min: 0, max: 0 });
  const [stat1, setStat1] = useState({ type: 'hp', value: 0 });
  const [stat2, setStat2] = useState({ type: 'yang_atk', value: 0 });

  useEffect(() => {
    axios.get('http://localhost:5000/api/storycards/dictionary/effects')
      .then(res => setEffectDict(res.data)).catch(err => console.error(err));
  }, []);

  // Hàm bổ trợ áp dụng dữ liệu từ card được tìm thấy
  // File: useEditStoryCard_2.js

const applyCardData = (matched) => {
  if (!matched) return false;

  // Cập nhật cả rarity và type vào formData
  setFormData(prev => ({ 
    ...prev, 
    rarity: matched.rarity || prev.rarity,
    type: matched.type || prev.type 
  }));

  if (matched.stat1) setStat1(matched.stat1);
  if (matched.stat2) setStat2(matched.stat2);

  if (matched.effects && matched.effects.length > 0) {
    let bases = matched.effects.map(eff => ({
      effect_code: eff.effect_code || '',
      direction: eff.direction || 'UP',
      value: eff.value !== undefined ? eff.value : 1,
      target: eff.target || 'SELF',
      duration: eff.duration !== undefined ? eff.duration : 1,
      role_lock: eff.role_lock || 'ALL',
      ui_group: eff.ui_group || '',
      tag: eff.tag || '',
      luck_group: 0
    }));

    const emptyBase = { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '', tag: '', luck_group: 0 };
    while (bases.length < 3) bases.push({ ...emptyBase });
    setBaseEffects(bases);
  }
  return true;
};

  const handleAutoFill = (cardName) => {
    const matched = scrapedCards.find(c => c.name.trim().toLowerCase() === cardName.trim().toLowerCase());
    return applyCardData(matched);
  };

  // Xử lý khi nhập Tên Thẻ -> Tìm gợi ý
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      name: value, 
      image_url: `/image/storycard/${value.trim().replace(/\s+/g, '_')}` 
    }));

    if (value.trim().length > 0) {
      const matches = scrapedCards.filter(c =>
        c.name.toLowerCase().includes(value.trim().toLowerCase())
      );
      setSuggestions(matches.slice(0, 8)); // Giới hạn tối đa 8 kết quả gợi ý
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Xử lý khi bấm chọn một Tên gợi ý từ danh sách

  const selectSuggestion = (card) => {
    setFormData(prev => ({
      ...prev,
      name: card.name,
      rarity: card.rarity || prev.rarity,
      type: card.type || prev.type, // <-- Thêm dòng này để tự động điền Type
      image_url: `/image/storycard/${card.name.trim().replace(/\s+/g, '_')}`
    }));
    setShowSuggestions(false);
    applyCardData(card); 
  };

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
          setFormData({ name: cardToEdit.name, rarity: cardToEdit.rarity, type: cardToEdit.type, image_url: cardToEdit.image_url });
          setOriginalImageUrl(cardToEdit.image_url);
          
          const emptyBase = { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '', tag: '', luck_group: 0 };

          if (effectsRes.data.length > 0) {
              let bases = effectsRes.data.filter(e => e.luck_group === 0 || !e.luck_group);
              const lucks = effectsRes.data.filter(e => e.luck_group > 0);
              while (bases.length < 3) bases.push({ ...emptyBase });
              setBaseEffects(bases);

              const grouped = [];
              lucks.forEach(eff => {
                  const groupIndex = eff.luck_group - 1; 
                  if(!grouped[groupIndex]) grouped[groupIndex] = [];
                  grouped[groupIndex].push(eff);
              });
              setLuckGroups(grouped.filter(Boolean));
          } else {
              const filled = handleAutoFill(cardToEdit.name);
              if (!filled) {
                setBaseEffects([{ ...emptyBase }, { ...emptyBase }, { ...emptyBase }]);
                setLuckGroups([]);
              }
          }

          if (statsRes.data && statsRes.data.data) {
            const isRand = statsRes.data.is_random;
            const dbData = statsRes.data.data;
            setIsRandomStat(isRand);
            
            if (isRand) {
                setStat1({ type: dbData.stat1_type || 'hp', value: dbData.stat1_min || 0, max_value: dbData.stat1_max || 0 });
                setStat2({ type: dbData.stat2_type || 'yang_atk', value: dbData.stat2_min || 0, max_value: dbData.stat2_max || 0 });
            } else {
                const activeStats = [];
                ['hp', 'yin_atk', 'yang_atk', 'yin_def', 'yang_def', 'agility'].forEach(key => {
                  if (dbData[key] > 0 || dbData[key] < 0) activeStats.push({ type: key, value: dbData[key], max_value: 0 });
                });
                if (activeStats[0]) setStat1(activeStats[0]); else setStat1({ type: 'hp', value: 0, max_value: 0 });
                if (activeStats[1]) setStat2(activeStats[1]); else setStat2({ type: 'yang_atk', value: 0, max_value: 0 });
            }
          } else {
            setIsRandomStat(false); setStat1({ type: 'hp', value: 0, max_value: 0 }); setStat2({ type: 'yang_atk', value: 0, max_value: 0 });
          }

        } else setMessage('❌ Không tìm thấy thẻ.');
      } catch (error) { setMessage('❌ Lỗi kết nối.'); } finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleNavigate = (direction) => {
    setMessage('');
    if (currentIndex === -1) return; 
    if (direction === 'prev' && currentIndex > 0) navigate(`/edit-storycard/${allCardsList[currentIndex - 1].storycard_id}`);
    else if (direction === 'next' && currentIndex < allCardsList.length - 1) navigate(`/edit-storycard/${allCardsList[currentIndex + 1].storycard_id}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') handleNameChange(e);
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addBaseEffect = () => {
    setBaseEffects([...baseEffects, { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '', tag: '', luck_group: 0 }]);
  };
  const removeBaseEffect = (index) => {
    setBaseEffects(baseEffects.filter((_, i) => i !== index));
  };
  const handleBaseChange = (index, field, value) => {
    const newEffects = [...baseEffects];
    if (field === 'ui_group') { newEffects[index].ui_group = value; newEffects[index].effect_code = ''; }
    else if (field === 'effect_code') {
      newEffects[index].effect_code = value;
      const dictItem = effectDict.find(d => d.effect_code === value);
      if (dictItem) {
        newEffects[index].ui_group = dictItem.effect_group;
        if (dictItem.effect_group === 'Bullet Modifier' || dictItem.effect_group === 'Elemental Modifier') {
          newEffects[index].value = 50; newEffects[index].duration = 1;
        }
      }
    } else newEffects[index][field] = value;
    setBaseEffects(newEffects);
  };

  const addLuckGroup = () => {
    const newGroup = [
        { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '', tag: '' },
        { effect_code: '', direction: 'UP', value: 1, target: 'SELF', duration: 1, role_lock: 'ALL', ui_group: '', tag: '' }
    ];
    setLuckGroups([...luckGroups, newGroup]);
  };
  const removeLuckGroup = (groupIndex) => {
    setLuckGroups(luckGroups.filter((_, i) => i !== groupIndex));
  };
  const handleLuckChange = (groupIndex, effectIndex, field, value) => {
    const newGroups = [...luckGroups];
    const effect = newGroups[groupIndex][effectIndex];
    if (field === 'ui_group') { effect.ui_group = value; effect.effect_code = ''; }
    else if (field === 'effect_code') {
      effect.effect_code = value;
      const dictItem = effectDict.find(d => d.effect_code === value);
      if (dictItem) {
        effect.ui_group = dictItem.effect_group;
        if (dictItem.effect_group === 'Bullet Modifier' || dictItem.effect_group === 'Elemental Modifier') {
          effect.value = 50; effect.duration = 1;
        }
      }
    } else effect[field] = value;
    setLuckGroups(newGroups);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const statsPayload = { is_random: isRandomStat };
      if (isRandomStat) {
          statsPayload.stat1 = { type: stat1.type, min: stat1.value, max: stat1.max_value };
          statsPayload.stat2 = { type: stat2.type, min: stat2.value, max: stat2.max_value };
      } else {
          statsPayload.normal_stats = { hp: 0, yin_atk: 0, yang_atk: 0, yin_def: 0, yang_def: 0, agility: 0 };
          statsPayload.normal_stats[stat1.type] = stat1.value || 0;
          statsPayload.normal_stats[stat2.type] = stat2.value || 0;
      }

      const allEffectsPayload = [
          ...baseEffects.map(e => ({...e, luck_group: 0})),
          ...luckGroups.flatMap((group, index) => group.map(e => ({...e, luck_group: index + 1}))) 
      ].filter(eff => eff.effect_code !== '');

      const payload = { ...formData, effects: allEffectsPayload, stats: statsPayload };
      await axios.put(`http://localhost:5000/api/storycards/${id}`, payload);
      
      setOriginalImageUrl(formData.image_url); 
      if (saveAction === 'next') {
        setMessage('✅ Lưu thành công! Đang qua thẻ kế tiếp...');
        setTimeout(() => {
          if (currentIndex !== -1 && currentIndex < allCardsList.length - 1) navigate(`/edit-storycard/${allCardsList[currentIndex + 1].storycard_id}`);
          else navigate('/manage-storycards');
        }, 1000);
      } else if (saveAction === 'list') {
        setMessage('✅ Lưu thành công! Đang về trang quản lý...');
        setTimeout(() => navigate('/manage-storycards'), 1000);
      } else { setMessage('✅ Lưu thành công!'); setTimeout(() => setMessage(''), 3000); }
    } catch (error) { setMessage('❌ Có lỗi xảy ra khi lưu.'); }
  };

  return {
    handleAutoFill,
    formData, message, loading, currentIndex, allCardsList, originalImageUrl, saveAction, setSaveAction, 
    handleNavigate, handleChange, handleSubmit, navigate, effectDict,
    isRandomStat, setIsRandomStat, randomRange, setRandomRange, stat1, setStat1, stat2, setStat2,
    baseEffects, addBaseEffect, removeBaseEffect, handleBaseChange,
    luckGroups, addLuckGroup, removeLuckGroup, handleLuckChange,
    suggestions, showSuggestions, setShowSuggestions, handleNameChange, selectSuggestion
  };
};