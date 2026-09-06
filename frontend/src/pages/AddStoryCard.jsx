// src/components/AddStoryCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAddStoryCard } from '../hooks/useAddStoryCard';
import { getStoryCardImageUrl } from '../utils/storyCardUtils';

const AddStoryCard = () => {
  const navigate = useNavigate();
  const {
    formData, message, loading, effectDict,
    isRandomStat, setIsRandomStat, stat1, setStat1, stat2, setStat2,
    baseEffects, addBaseEffect, removeBaseEffect, handleBaseChange,
    luckGroups, addLuckGroup, removeLuckGroup, handleLuckChange,
    handleChange, handleSubmit
  } = useAddStoryCard();

  if (loading) return <div className="text-white text-center mt-20">Đang tải...</div>;

  const getIconUrl = (effCode, direction) => {
    if (!effCode) return null;
    const dictItem = effectDict.find(d => d.effect_code === effCode);
    if (!dictItem) return null;
    const rawUrl = direction === 'UP' ? dictItem.icon_up_url : dictItem.icon_down_url;
    if (!rawUrl) return null;
    return rawUrl.endsWith('.webp') ? rawUrl : `${rawUrl}.webp`;
  };

  const handleFocus = (e) => e.target.select();

  // 1. Tìm tên Nhân vật đã được nhập ở dòng bất kỳ trong thẻ
  const activeLockedChar = 
    baseEffects.find(e => e.character_lock && e.character_lock.trim() !== '')?.character_lock ||
    luckGroups.flatMap(g => g).find(e => e.character_lock && e.character_lock.trim() !== '')?.character_lock ||
    '';

  // 2. Kiểm tra xem trong toàn bộ thẻ đã có dòng nào khóa NV hay chưa
  const hasAnyCharLock = Boolean(activeLockedChar) || 
    baseEffects.some(e => e.role_lock === 'CHAR') || 
    luckGroups.some(g => g.some(e => e.role_lock === 'CHAR'));

  const renderEffectRow = (eff, onChange, onRemove, rowKey) => {
    const iconSrc = getIconUrl(eff.effect_code, eff.direction);
    const uniqueGroups = [...new Set(effectDict.map(d => d.effect_group).filter(Boolean))];
    const currentGroup = eff.ui_group || (eff.effect_code ? effectDict.find(d => d.effect_code === eff.effect_code)?.effect_group : '');
    const isBuff = currentGroup === 'Status Buff';
    const isModifier = currentGroup === 'Bullet Modifier' || currentGroup === 'Elemental Modifier';
    const isSpiritPowerUp = eff.effect_code === 'SPIRIT_POWER_UP';

    const isCharLocked = eff.role_lock === 'CHAR' || Boolean(eff.character_lock);

    // Bật tùy chọn Khóa NV cho mọi nhóm hiệu ứng nếu đây là Status Buff HOẶC thẻ này đã có ít nhất 1 dòng Khóa NV
    const canShowCharLock = isBuff || hasAnyCharLock || isCharLocked;

    const handleDirectionChange = (e) => {
      const newDir = e.target.value;
      onChange('direction', newDir);
      
      if (currentGroup === 'Status Buff') {
        if (newDir === 'DOWN') {
          onChange('target', 'ENEMY');
        } else if (newDir === 'UP' && eff.target === 'ENEMY') {
          onChange('target', 'SELF');
        }
      }
    };

    const handleEffectCodeChange = (e) => {
      const newCode = e.target.value;
      onChange('effect_code', newCode);
      
      const dictItem = effectDict.find(d => d.effect_code === newCode);
      if (dictItem && dictItem.effect_group === 'Status Buff' && eff.direction === 'DOWN') {
        onChange('target', 'ENEMY');
      }
    };

    return (
      <div key={rowKey} className="flex flex-wrap lg:flex-nowrap gap-2 items-center justify-between bg-[#25252d] p-2.5 rounded border border-gray-600 relative overflow-hidden group">
        
        {/* ICON */}
        <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded flex items-center justify-center border border-gray-600 overflow-hidden">
          {iconSrc ? (
            <img src={iconSrc} alt="Icon" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          ) : (
            <span className="text-xs text-gray-500">?</span>
          )}
        </div>

        {/* NHÓM HIỆU ỨNG */}
        <select value={currentGroup} onChange={(e) => onChange('ui_group', e.target.value)} className="w-[125px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#e1c16e] outline-none text-xs text-gray-300">
          <option value="">-- Chọn Nhóm --</option>
          {uniqueGroups.map(groupName => <option key={groupName} value={groupName}>{groupName}</option>)}
        </select>

        {/* MÃ HIỆU ỨNG */}
        <select value={eff.effect_code} onChange={handleEffectCodeChange} disabled={!currentGroup} className={`flex-grow min-w-[130px] bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-[#e1c16e] font-semibold ${!currentGroup ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#e1c16e]'}`}>
          <option value="">-- Chọn Hiệu ứng --</option>
          {effectDict
            .filter(d => d.effect_group === currentGroup)
            .sort((a, b) => {
              const aIsRank2 = a.effect_code.endsWith('_II') || a.effect_name.includes(' II');
              const bIsRank2 = b.effect_code.endsWith('_II') || b.effect_name.includes(' II');
              
              if (aIsRank2 && !bIsRank2) return 1;
              if (!aIsRank2 && bIsRank2) return -1;
              
              return a.effect_name.localeCompare(b.effect_name);
            })
            .map(dict => (
              <option key={dict.effect_code} value={dict.effect_code} className="text-white">
                {dict.effect_name}
              </option>
            ))
          }
        </select>

        {/* KHÓA CLASS / KHÓA NV */}
        {currentGroup === 'Tag Modifier' ? (
          <input type="text" placeholder="Tag (VD: Tengu)" value={eff.tag || ''} onChange={(e) => onChange('tag', e.target.value)} className="w-[110px] flex-shrink-0 bg-blue-900/30 border border-blue-500 rounded p-1.5 outline-none text-xs text-center text-blue-300 placeholder-blue-700 focus:bg-[#0f0f12]" />
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <select 
              value={isCharLocked ? 'CHAR' : (eff.role_lock || 'ALL')} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'CHAR') {
                  onChange('role_lock', 'CHAR');
                  if (!eff.character_lock && activeLockedChar) {
                    onChange('character_lock', activeLockedChar);
                  }
                } else {
                  onChange('role_lock', val);
                  onChange('character_lock', '');
                }
              }} 
              disabled={!isBuff && !canShowCharLock} 
              className={`w-[105px] bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-center ${
                !isBuff && !canShowCharLock ? 'opacity-30 cursor-not-allowed' : 'focus:border-[#e1c16e]'
              } ${isCharLocked ? 'text-purple-400 font-bold border-purple-500' : 'text-pink-400'}`}
            >
              {isBuff ? (
                <>
                  <option value="ALL">Mọi Class</option>
                  <option value="Attack">ATK ONLY</option>
                  <option value="Defense">DEF ONLY</option>
                  <option value="Support">SUP ONLY</option>
                  <option value="Heal">HEAL ONLY</option>
                  <option value="Speed">SPD ONLY</option>
                  <option value="Destroy">DES ONLY</option>
                  <option value="Technical">TEC ONLY</option>
                  <option value="Debuff">DBF ONLY</option>
                  <option value="CHAR">👤 KHÓA NV</option>
                </>
              ) : (
                <>
                  <option value="ALL">Mọi Class</option>
                  {canShowCharLock && <option value="CHAR">👤 KHÓA NV</option>}
                </>
              )}
            </select>

            {isCharLocked && (
              <input 
                type="text" 
                placeholder="Tên NV (VD: L80 Parsee)" 
                value={eff.character_lock || ''} 
                onChange={(e) => onChange('character_lock', e.target.value)} 
                className="w-[120px] bg-purple-900/40 border border-purple-500 rounded p-1.5 outline-none text-xs text-center text-purple-200 placeholder-purple-500 focus:bg-[#0f0f12] font-semibold" 
              />
            )}
          </div>
        )}

        {/* HƯỚNG TĂNG/GIẢM */}
        <select value={eff.direction || 'UP'} onChange={handleDirectionChange} className="w-[85px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#e1c16e] outline-none text-xs text-center">
          <option value="UP">Tăng(UP)</option>
          <option value="DOWN">Giảm(DW)</option>
        </select>

        {/* TRỊ SỐ */}
        <div className="flex items-center gap-1 w-[70px] flex-shrink-0">
          <span className="text-[10px] text-gray-400 leading-none">Trị số:</span>
          <input 
            type="number" 
            value={eff.value !== undefined ? eff.value : ''} 
            onFocus={handleFocus} 
            step={isModifier ? 5 : (isSpiritPowerUp ? 0.05 : 1)} 
            onChange={(e) => onChange('value', e.target.value)} 
            className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1 focus:border-[#e1c16e] outline-none text-xs text-center font-bold" 
          />
        </div>

        {/* MỤC TIÊU */}
        <select value={eff.target || 'SELF'} onChange={(e) => onChange('target', e.target.value)} className="w-[95px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#e1c16e] outline-none text-xs text-center">
          <option value="SELF">Bản thân</option>
          <option value="TARGET">Mục tiêu</option>
          <option value="PARTY">Toàn Đội</option>
          <option value="ENEMY">Toàn Địch</option>
        </select>

        {/* SỐ TURN */}
        <div className="flex items-center gap-1 w-[65px] flex-shrink-0">
          <span className="text-[10px] text-gray-400">Turn:</span>
          <input type="number" value={eff.duration || 1} onFocus={handleFocus} onChange={(e) => onChange('duration', parseInt(e.target.value) || 0)} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1 focus:border-[#e1c16e] outline-none text-xs text-center" />
        </div>

        {/* NÚT XÓA */}
        {onRemove && (
          <button type="button" onClick={onRemove} className="flex-shrink-0 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-2 py-1 rounded transition-colors" title="Xóa dòng này">✕</button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-start">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-7xl shadow-2xl flex flex-col gap-6">
        
        <div className="relative flex flex-col md:block items-center">
          <h2 className="text-3xl font-bold text-[#e1c16e] mb-2 text-center font-serif">❖ Thêm Story Card Mới ❖</h2>

          {message && <div className="text-center font-bold text-yellow-400 mt-2">{message}</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* CỘT TRÁI: KHUNG XEM TRƯỚC ANH & SAO */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg relative">
                <img 
                  src={getStoryCardImageUrl(formData.image_url)} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23151518'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23e1c16e' font-size='18' font-family='sans-serif'%3E⚠ Xem trước ảnh%3C/text%3E%3C/svg%3E"; 
                  }} 
                />
                <div className="absolute bottom-0 left-0 w-full bg-black/70 text-center text-xs py-2 px-1 font-mono text-gray-300 break-all">
                  {formData.image_url}
                </div>
              </div>

              <p className="mt-4 text-center text-yellow-500 font-bold text-xl">{'★'.repeat(formData.rarity)}</p>
            </div>

            {/* CỘT PHẢI: THÔNG TIN CƠ BẢN & STATS */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              
              <div className="relative">
                <label className="block text-gray-400 mb-1 text-sm">Tên Thẻ (Name)</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Nhập tên thẻ..."
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none" 
                />


              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Độ Hiếm</label>
                  <select name="rarity" value={formData.rarity} onChange={handleChange} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none text-yellow-500">
                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Sao</option>)}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Loại (Type)</label>
                  <div className="flex items-center gap-2">
                    <select name="type" value={formData.type} onChange={handleChange} className="flex-grow bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none">
                      <option value="">-- Chọn Loại --</option>
                      <option value="Bamboo">Bamboo</option>
                      <option value="Orchid">Orchid</option>
                      <option value="Chrysanthemum">Chrysanthemum</option>
                      <option value="Plum">Plum</option>
                    </select>
                    
                    {formData.type && (
                      <div className="w-10 h-10 bg-[#0f0f12] rounded border border-gray-600 flex items-center justify-center p-1 shrink-0" title={`Loại: ${formData.type}`}>
                        <img 
                          src={`/image/type/${formData.type}.png`} 
                          alt={formData.type} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            if (!e.target.dataset.triedWebp) {
                              e.target.dataset.triedWebp = 'true';
                              e.target.src = `/image/type/${formData.type}.webp`;
                            } else {
                              e.target.onerror = null;
                            }
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-sm">Đường Dẫn Ảnh DB</label>
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] text-gray-300 outline-none" />
              </div>

              {/* STATS */}
              <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-[#c09641]">Chỉ Số Bổ Sung (Stats)</h3>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-pink-400 font-bold bg-pink-900/30 px-3 py-1 rounded border border-pink-800 transition-colors hover:bg-pink-900/50">
                    <input type="checkbox" checked={isRandomStat} onChange={(e) => setIsRandomStat(e.target.checked)} className="accent-pink-500 w-4 h-4" />
                    🎲 EX Card (Chỉ số dao động)
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className={`flex flex-col ${isRandomStat ? 'gap-5' : 'lg:flex-row gap-4'}`}>
                    <div className={`flex-1 flex flex-col gap-2 bg-[#25252d] p-3 rounded border transition-colors ${isRandomStat ? 'border-pink-700/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-gray-600'}`}>
                      <select value={stat1.type} onChange={(e) => setStat1({...stat1, type: e.target.value})} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none text-sm font-semibold text-gray-200">
                        <option value="hp">HP</option>
                        <option value="yin_atk">Yin ATK</option>
                        <option value="yang_atk">Yang ATK</option>
                        <option value="yin_def">Yin DEF</option>
                        <option value="yang_def">Yang DEF</option>
                        <option value="agility">Agility</option>
                      </select>
                      <div className="flex items-center gap-2">
                         {isRandomStat && <span className="text-xs text-pink-400 font-mono font-bold w-8">MIN:</span>}
                         <input type="number" value={stat1.value} onFocus={handleFocus} step="5" onChange={(e) => setStat1({...stat1, value: parseInt(e.target.value) || 0})} className={`flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none text-center font-bold ${isRandomStat ? 'text-pink-400' : 'text-yellow-500'}`} />
                         
                         {isRandomStat && (
                           <>
                             <span className="text-xs text-pink-400 font-mono font-bold w-8 text-right pr-1">MAX:</span>
                             <input type="number" value={stat1.max_value} onFocus={handleFocus} step="5" onChange={(e) => setStat1({...stat1, max_value: parseInt(e.target.value) || 0})} className="flex-1 bg-[#0f0f12] border border-pink-500 outline-none text-center text-pink-400 font-bold" />
                           </>
                         )}
                      </div>
                    </div>

                    <div className={`flex-1 flex flex-col gap-2 bg-[#25252d] p-3 rounded border transition-colors ${isRandomStat ? 'border-pink-700/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-gray-600'}`}>
                      <select value={stat2.type} onChange={(e) => setStat2({...stat2, type: e.target.value})} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none text-sm font-semibold text-gray-200">
                        <option value="hp">HP</option>
                        <option value="yin_atk">Yin ATK</option>
                        <option value="yang_atk">Yang ATK</option>
                        <option value="yin_def">Yin DEF</option>
                        <option value="yang_def">Yang DEF</option>
                        <option value="agility">Agility</option>
                      </select>
                      <div className="flex items-center gap-2">
                         {isRandomStat && <span className="text-xs text-pink-400 font-mono font-bold w-8">MIN:</span>}
                         <input type="number" value={stat2.value} onFocus={handleFocus} step="5" onChange={(e) => setStat2({...stat2, value: parseInt(e.target.value) || 0})} className={`flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#e1c16e] outline-none text-center font-bold ${isRandomStat ? 'text-pink-400' : 'text-yellow-500'}`} />
                         
                         {isRandomStat && (
                           <>
                             <span className="text-xs text-pink-400 font-mono font-bold w-8 text-right pr-1">MAX:</span>
                             <input type="number" value={stat2.max_value} onFocus={handleFocus} step="5" onChange={(e) => setStat2({...stat2, max_value: parseInt(e.target.value) || 0})} className="flex-1 bg-[#0f0f12] border border-pink-500 outline-none text-center text-pink-400 font-bold" />
                           </>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HIỆU ỨNG */}
          <div className="border-t border-gray-700 pt-6">
              <div className="mb-8 bg-[#1f1f26] p-4 rounded-lg border border-gray-600 shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-200">Hiệu Ứng Chung (Base Effects)</h3>
                  <button type="button" onClick={addBaseEffect} className="bg-green-600 hover:bg-green-700 text-white text-sm py-1.5 px-3 rounded shadow transition-colors font-bold">
                    + Thêm Hiệu Ứng Chung
                  </button>
                </div>
                <div className="space-y-3">
                  {baseEffects.length === 0 && <p className="text-gray-500 italic text-sm text-center py-2">Chưa có hiệu ứng chung nào.</p>}
                  {baseEffects.map((eff, index) => renderEffectRow(eff, (f, v) => handleBaseChange(index, f, v), () => removeBaseEffect(index), `base-${index}`))}
                </div>
              </div>

              <div className="bg-[#2a2015] p-4 rounded-lg border border-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <div className="flex justify-between items-center mb-4 border-b border-yellow-800 pb-2">
                  <h3 className="text-xl font-bold text-[#e1c16e]">Tùy Chọn Luck Effects (EX)</h3>
                  <button type="button" onClick={addLuckGroup} className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-1.5 px-3 rounded shadow transition-colors font-bold">
                    + Thêm Nhóm Luck
                  </button>
                </div>
                
                <div className="space-y-6">
                  {luckGroups.length === 0 && <p className="text-yellow-700/50 italic text-sm text-center py-2">Không có hiệu ứng Luck nào. Thẻ này là thẻ thường.</p>}
                  
                  {luckGroups.map((group, gIndex) => (
                    <div key={`group-${gIndex}`} className="bg-[#1f1a14] rounded border border-yellow-800 p-3 relative">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-yellow-500 font-bold font-mono tracking-widest px-2 py-0.5 bg-yellow-900/40 rounded">LUCK OPTION #{gIndex + 1}</span>
                        <button type="button" onClick={() => removeLuckGroup(gIndex)} className="text-xs text-red-400 hover:text-red-300 hover:underline">
                          [Xóa Tùy Chọn Này]
                        </button>
                      </div>
                      <div className="space-y-2">
                         {group.map((eff, eIndex) => renderEffectRow(eff, (f, v) => handleLuckChange(gIndex, eIndex, f, v), null, `luck-${gIndex}-${eIndex}`))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </div>

          {/* NÚT THAO TÁC BOTTOM */}
          <div className="mt-2 border-t border-gray-700 pt-6">
            <div className="flex justify-center gap-6 max-w-2xl mx-auto">
              <button type="button" onClick={() => navigate('/manage-storycards')} className="w-1/3 border border-gray-500 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition-colors text-lg">
                Hủy
              </button>
              <button type="submit" className="w-2/3 bg-[#e1c16e] hover:bg-[#c0a256] text-black font-bold py-3 px-4 rounded transition-colors shadow-lg shadow-[#e1c16e]/20 text-lg tracking-wide">
                THÊM STORY CARD
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddStoryCard;