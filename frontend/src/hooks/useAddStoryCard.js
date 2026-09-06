import { useState, useEffect } from 'react';
import axios from 'axios';
import scrapedCards from '../data/scraped_cards.json';
import { sanitizePathString } from '../utils/pathSanitizer';

export const useAddStoryCard = () => {
  const [formData, setFormData] = useState({
    name: '',
    rarity: 5,
    type: '',
    image_url: '/image/storycard/'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // State Hiệu ứng & Từ điển
  const [effectDict, setEffectDict] = useState([]);
  const [baseEffects, setBaseEffects] = useState([]);
  const [luckGroups, setLuckGroups] = useState([]);

  // State Gợi ý tên
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // State Chỉ số (Stats)
  const [isRandomStat, setIsRandomStat] = useState(false);
  const [stat1, setStat1] = useState({ type: 'hp', value: 0, max_value: 0 });
  const [stat2, setStat2] = useState({ type: 'yang_atk', value: 0, max_value: 0 });

  const emptyEffect = {
    effect_code: '', direction: 'UP', value: 1, target: 'SELF',
    duration: 1, role_lock: 'ALL', ui_group: '', tag: '', character_lock: '', luck_group: 0
  };

  useEffect(() => {
    // Khởi tạo 3 hiệu ứng cơ bản mặc định
    setBaseEffects([
      { ...emptyEffect },
      { ...emptyEffect },
      { ...emptyEffect }
    ]);

    axios.get('http://localhost:5000/api/storycards/dictionary/effects')
      .then(res => setEffectDict(res.data))
      .catch(err => console.error(err));
  }, []);

  const applyCardData = (matched) => {
    if (!matched) return false;

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
        character_lock: eff.character_lock || '',
        luck_group: 0
      }));

      while (bases.length < 3) bases.push({ ...emptyEffect });
      setBaseEffects(bases);
    }
    return true;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    const safeFileName = sanitizePathString(value.trim().replace(/\s+/g, '_'));

    setFormData(prev => ({
      ...prev,
      name: value,
      image_url: value ? `/image/storycard/${safeFileName}` : '/image/storycard/'
    }));

    if (value.trim().length > 0) {
      const matches = scrapedCards.filter(c =>
        c.name.toLowerCase().includes(value.trim().toLowerCase())
      );
      setSuggestions(matches.slice(0, 8));
      setShowSuggestions(true);

      const exactMatch = scrapedCards.find(c => c.name.trim().toLowerCase() === value.trim().toLowerCase());
      if (exactMatch) applyCardData(exactMatch);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (card) => {
    const safeFileName = sanitizePathString(card.name.trim().replace(/\s+/g, '_'));

    setFormData(prev => ({
      ...prev,
      name: card.name,
      rarity: card.rarity || prev.rarity,
      type: card.type || prev.type,
      image_url: `/image/storycard/${safeFileName}`
    }));
    setShowSuggestions(false);
    applyCardData(card);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      handleNameChange(e);
    } else if (name === 'image_url') {
      const rawFileName = value.split('/').pop().replace(/\.webp$/i, '');
      const safeFileName = sanitizePathString(rawFileName.trim().replace(/\s+/g, '_'));
      setFormData(prev => ({ ...prev, image_url: `/image/storycard/${safeFileName}` }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Quản lý Base Effects
  const addBaseEffect = () => setBaseEffects([...baseEffects, { ...emptyEffect }]);
  const removeBaseEffect = (index) => setBaseEffects(baseEffects.filter((_, i) => i !== index));
  const handleBaseChange = (index, field, value) => {
    const newEffects = [...baseEffects];
    if (field === 'ui_group') {
      newEffects[index].ui_group = value;
      newEffects[index].effect_code = '';
    } else if (field === 'effect_code') {
      newEffects[index].effect_code = value;
      const dictItem = effectDict.find(d => d.effect_code === value);
      if (dictItem) {
        newEffects[index].ui_group = dictItem.effect_group;
        if (dictItem.effect_group === 'Bullet Modifier' || dictItem.effect_group === 'Elemental Modifier') {
          newEffects[index].value = 50;
          newEffects[index].duration = 1;
        }
      }
    } else {
      newEffects[index][field] = value;
    }
    setBaseEffects(newEffects);
  };

  // Quản lý Luck Groups
  const addLuckGroup = () => setLuckGroups([...luckGroups, [{ ...emptyEffect }, { ...emptyEffect }]]);
  const removeLuckGroup = (groupIndex) => setLuckGroups(luckGroups.filter((_, i) => i !== groupIndex));
  const handleLuckChange = (groupIndex, effectIndex, field, value) => {
    const newGroups = [...luckGroups];
    const effect = newGroups[groupIndex][effectIndex];
    if (field === 'ui_group') {
      effect.ui_group = value;
      effect.effect_code = '';
    } else if (field === 'effect_code') {
      effect.effect_code = value;
      const dictItem = effectDict.find(d => d.effect_code === value);
      if (dictItem) {
        effect.ui_group = dictItem.effect_group;
        if (dictItem.effect_group === 'Bullet Modifier' || dictItem.effect_group === 'Elemental Modifier') {
          effect.value = 50;
          effect.duration = 1;
        }
      }
    } else {
      effect[field] = value;
    }
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
        ...baseEffects.map(e => ({ ...e, luck_group: 0 })),
        ...luckGroups.flatMap((group, index) => group.map(e => ({ ...e, luck_group: index + 1 })))
      ].filter(eff => eff.effect_code !== '');

      const payload = { ...formData, effects: allEffectsPayload, stats: statsPayload };
      await axios.post('http://localhost:5000/api/storycards', payload);

      setMessage('✅ Thêm Story Card thành công!');
      setFormData({ name: '', rarity: 5, type: '', image_url: '/image/storycard/' });
      setBaseEffects([{ ...emptyEffect }, { ...emptyEffect }, { ...emptyEffect }]);
      setLuckGroups([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('❌ Có lỗi xảy ra khi thêm Story Card.');
    }
  };

  return {
    formData, message, loading, effectDict,
    isRandomStat, setIsRandomStat, stat1, setStat1, stat2, setStat2,
    baseEffects, addBaseEffect, removeBaseEffect, handleBaseChange,
    luckGroups, addLuckGroup, removeLuckGroup, handleLuckChange,
    suggestions, showSuggestions, setShowSuggestions, handleNameChange, selectSuggestion,
    handleChange, handleSubmit
  };
};