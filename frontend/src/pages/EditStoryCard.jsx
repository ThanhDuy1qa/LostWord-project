import { useEditStoryCard } from '../hooks/useEditStoryCard';
import { getStoryCardImageUrl } from '../utils/storyCardUtils';

const EditStoryCard = () => {
  const {
    handleAutoFill,
    formData, message, loading, currentIndex, allCardsList, originalImageUrl, saveAction,
    setSaveAction, handleNavigate, handleChange, handleSubmit, navigate, effectDict,
    isRandomStat, setIsRandomStat, randomRange, setRandomRange, stat1, setStat1, stat2, setStat2,
    baseEffects, addBaseEffect, removeBaseEffect, handleBaseChange,
    luckGroups, addLuckGroup, removeLuckGroup, handleLuckChange,
    suggestions, showSuggestions, setShowSuggestions, handleNameChange, selectSuggestion
  } = useEditStoryCard();

  if (loading) return <div className="text-white text-center mt-20">Đang tải...</div>;

  const getIconUrl = (effCode, direction) => {
      if(!effCode) return null;
      const dictItem = effectDict.find(d => d.effect_code === effCode);
      if(!dictItem) return null;
      return direction === 'UP' ? dictItem.icon_up_url : dictItem.icon_down_url;
  };

  const handleFocus = (e) => e.target.select();

  const renderEffectRow = (eff, onChange, onRemove, rowKey) => {
      const iconSrc = getIconUrl(eff.effect_code, eff.direction);
      const uniqueGroups = [...new Set(effectDict.map(d => d.effect_group).filter(Boolean))];
      const currentGroup = eff.ui_group || (eff.effect_code ? effectDict.find(d => d.effect_code === eff.effect_code)?.effect_group : '');
      const isBuff = currentGroup === 'Status Buff';
      const isModifier = currentGroup === 'Bullet Modifier' || currentGroup === 'Elemental Modifier';
      const isSpiritPowerUp = eff.effect_code === 'SPIRIT_POWER_UP';

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
        <div key={rowKey} className="flex flex-nowrap gap-3 items-center justify-center bg-[#25252d] p-2.5 rounded border border-gray-600 relative overflow-hidden group">
          <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded flex items-center justify-center border border-gray-600 overflow-hidden">
              {iconSrc ? <img src={`${iconSrc}.webp`} alt="Icon" className="w-full h-full object-contain" onError={(e) => {e.target.style.display='none'}}/> : <span className="text-xs text-gray-500">?</span>}
          </div>

          <select value={currentGroup} onChange={(e) => onChange('ui_group', e.target.value)} className="w-[140px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-gray-300">
            <option value="">-- Chọn Nhóm --</option>
            {uniqueGroups.map(groupName => <option key={groupName} value={groupName}>{groupName}</option>)}
          </select>

          <select value={eff.effect_code} onChange={handleEffectCodeChange} disabled={!currentGroup} className={`flex-grow min-w-[150px] max-w-[250px] bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-sm text-[#419ec0] font-semibold ${!currentGroup ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#419ec0]'}`}>
            <option value="">-- Chọn Hiệu ứng --</option>
            {effectDict.filter(d => d.effect_group === currentGroup).map(dict => <option key={dict.effect_code} value={dict.effect_code} className="text-white">{dict.effect_name}</option>)}
          </select>

          {currentGroup === 'Tag Modifier' ? (
             <input type="text" placeholder="Tag (VD: Tengu)" value={eff.tag || ''} onChange={(e) => onChange('tag', e.target.value)} className="w-[110px] flex-shrink-0 bg-blue-900/30 border border-blue-500 rounded p-1.5 outline-none text-sm text-center text-blue-300 placeholder-blue-700 focus:bg-[#0f0f12]" />
          ) : (
             <select value={eff.role_lock || 'ALL'} onChange={(e) => onChange('role_lock', e.target.value)} disabled={!isBuff} title={!isBuff ? "Chỉ áp dụng cho Status Buff" : "Khóa Class nhận Buff"} className={`w-[110px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-sm text-center ${!isBuff ? 'opacity-30 cursor-not-allowed' : 'focus:border-[#419ec0] text-pink-400'}`}>
                <option value="ALL">Mọi Class</option> <option value="Attack">ATK ONLY</option> <option value="Defense">DEF ONLY</option> <option value="Support">SUP ONLY</option> <option value="Heal">HEAL ONLY</option> <option value="Speed">SPD ONLY</option> <option value="Destroy">DES ONLY</option> <option value="Technical">TEC ONLY</option> <option value="Debuff">DBF ONLY</option>
             </select>
          )}

          <select value={eff.direction || 'UP'} onChange={handleDirectionChange} className="w-[100px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center">
            <option value="UP">Tăng(UP)</option><option value="DOWN">Giảm(DW)</option>
          </select>

          <div className="flex items-center gap-1.5 w-[85px] flex-shrink-0">
            <span className="text-[11px] text-gray-400 leading-tight">Trị<br/>số:</span>
            <input 
              type="number" 
              value={eff.value !== undefined ? eff.value : ''} 
              onFocus={handleFocus} 
              step={isModifier ? 5 : (isSpiritPowerUp ? 0.1 : 1)} 
              onChange={(e) => onChange('value', e.target.value)} 
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center font-bold" 
            />
          </div>

          <select value={eff.target || 'SELF'} onChange={(e) => onChange('target', e.target.value)} className="w-[110px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center">
            <option value="SELF">Bản thân</option><option value="TARGET">Mục tiêu</option><option value="PARTY">Toàn Đội</option><option value="ENEMY">Toàn Địch</option>
          </select>

          <div className="flex items-center gap-1.5 w-[80px] flex-shrink-0">
            <span className="text-xs text-gray-400">Turn:</span>
            <input type="number" value={eff.duration || 1} onFocus={handleFocus} onChange={(e) => onChange('duration', parseInt(e.target.value) || 0)} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center" />
          </div>

          {onRemove && (
            <button type="button" onClick={onRemove} className="flex-shrink-0 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-2.5 py-1.5 rounded transition-colors opacity-50 hover:opacity-100" title="Xóa">✕</button>
          )}
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-start">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-6xl shadow-2xl flex flex-col gap-6">
        
        <div className="relative flex flex-col md:block items-center">
          <h2 className="text-3xl font-bold text-[#e1c16e] mb-2 text-center font-serif">❖ Chỉnh Sửa Story Card ❖</h2>

          <button 
            type="button" 
            onClick={() => {
              const ok = handleAutoFill(formData.name);
              alert(ok ? `✅ Đã tự động điền dữ liệu cho thẻ: "${formData.name}"` : `❌ Không tìm thấy thẻ "${formData.name}" trong file scraped_cards.json!`);
            }}
            className="md:absolute right-0 top-1/2 md:-translate-y-1/2 mt-2 md:mt-0 flex items-center gap-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs px-3 py-2 rounded-lg font-bold shadow-md transition-all cursor-pointer"
            title="Tự động nạp Effect và Stats từ file scraped_cards.json"
          >
            ⚡ Điền từ Dữ liệu Cào
          </button>

          {message && <div className="text-center font-bold text-yellow-400 mt-2">{message}</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 flex flex-col items-center">
              
              <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg relative">
                <img 
                  src={getStoryCardImageUrl(formData.image_url || originalImageUrl)} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23151518'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23e1c16e' font-size='18' font-family='sans-serif'%3E⚠ Không tìm thấy ảnh%3C/text%3E%3C/svg%3E"; 
                  }} 
                />
                <div className="absolute bottom-0 left-0 w-full bg-black/70 text-center text-xs py-2 px-1 font-mono text-gray-300 break-all">
                  {formData.image_url || originalImageUrl}
                </div>
              </div>

              <p className="mt-4 text-center text-yellow-500 font-bold text-xl">{'★'.repeat(formData.rarity)}</p>

              <div className="flex w-full justify-between mt-6 gap-2">
                <button onClick={() => handleNavigate('prev')} disabled={currentIndex <= 0} type="button" className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1">⬅ Trước</button>
                <button onClick={() => handleNavigate('next')} disabled={currentIndex === -1 || currentIndex >= allCardsList.length - 1} type="button" className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1">Sau ➡</button>
              </div>
            </div>

            <div className="w-full md:w-2/3 flex flex-col gap-4">
              
              {/* O NHP TÊN CÓ MENU GỢI Ý */}
              <div className="relative">
                <label className="block text-gray-400 mb-1 text-sm">Tên Thẻ (Name)</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleNameChange} 
                  onFocus={() => {
                    if (formData.name.trim()) handleNameChange({ target: { value: formData.name } });
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  required 
                  placeholder="Nhập tên thẻ để tìm kiếm..."
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none" 
                />

                {/* Danh sách gợi ý từ file scraped_cards.json */}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a1a20] border border-gray-600 rounded-md shadow-2xl max-h-60 overflow-y-auto">
                    {suggestions.map((card, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => selectSuggestion(card)}
                        className="px-4 py-2 hover:bg-[#419ec0]/20 hover:text-[#419ec0] cursor-pointer text-sm text-gray-200 flex justify-between items-center border-b border-gray-800 last:border-none"
                      >
                        <span className="font-semibold">{card.name}</span>
                        <span className="text-xs text-yellow-500 font-mono">{'★'.repeat(card.rarity || 5)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Độ Hiếm</label>
                  <select name="rarity" value={formData.rarity} onChange={handleChange} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-yellow-500">
                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Sao</option>)}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Loại (Type)</label>
                  <div className="flex items-center gap-2">
                    <select name="type" value={formData.type} onChange={handleChange} className="flex-grow bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none">
                      <option value="Bamboo">Bamboo</option> <option value="Orchid">Orchid</option> <option value="Chrysanthemum">Chrysanthemum</option> <option value="Plum">Plum</option>
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
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%236b7280' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'/%3E%3C/svg%3E";
                            }
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-sm">Đường Dẫn Ảnh Mới</label>
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] text-gray-300 outline-none" />
              </div>

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
                      <select value={stat1.type} onChange={(e) => setStat1({...stat1, type: e.target.value})} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-sm font-semibold text-gray-200">
                        <option value="hp">HP</option> <option value="yin_atk">Yin ATK</option> <option value="yang_atk">Yang ATK</option> <option value="yin_def">Yin DEF</option> <option value="yang_def">Yang DEF</option> <option value="agility">Agility</option>
                      </select>
                      <div className="flex items-center gap-2">
                         {isRandomStat && <span className="text-xs text-pink-400 font-mono font-bold w-8">MIN:</span>}
                         <input type="number" value={stat1.value} onFocus={handleFocus} step="5" onChange={(e) => setStat1({...stat1, value: parseInt(e.target.value) || 0})} className={`flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-center font-bold ${isRandomStat ? 'text-pink-400' : 'text-yellow-500'}`} />
                         
                         {isRandomStat && (
                           <>
                             <span className="text-xs text-pink-400 font-mono font-bold w-8 text-right pr-1">MAX:</span>
                             <input type="number" value={stat1.max_value} onFocus={handleFocus} step="5" onChange={(e) => setStat1({...stat1, max_value: parseInt(e.target.value) || 0})} className="flex-1 bg-[#0f0f12] border border-pink-500 outline-none text-center text-pink-400 font-bold" />
                           </>
                         )}
                      </div>
                    </div>

                    <div className={`flex-1 flex flex-col gap-2 bg-[#25252d] p-3 rounded border transition-colors ${isRandomStat ? 'border-pink-700/50 shadow-[0_0_10px_rgba(236,72,153,0.1)]' : 'border-gray-600'}`}>
                      <select value={stat2.type} onChange={(e) => setStat2({...stat2, type: e.target.value})} className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-sm font-semibold text-gray-200">
                        <option value="hp">HP</option> <option value="yin_atk">Yin ATK</option> <option value="yang_atk">Yang ATK</option> <option value="yin_def">Yin DEF</option> <option value="yang_def">Yang DEF</option> <option value="agility">Agility</option>
                      </select>
                      <div className="flex items-center gap-2">
                         {isRandomStat && <span className="text-xs text-pink-400 font-mono font-bold w-8">MIN:</span>}
                         <input type="number" value={stat2.value} onFocus={handleFocus} step="5" onChange={(e) => setStat2({...stat2, value: parseInt(e.target.value) || 0})} className={`flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-center font-bold ${isRandomStat ? 'text-pink-400' : 'text-yellow-500'}`} />
                         
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

          <div className="mt-2 border-t border-gray-700 pt-6">
            <div className="flex justify-center flex-wrap gap-8 mb-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#419ec0] transition-colors text-gray-300">
                <input type="radio" name="saveAction" value="stay" checked={saveAction === 'stay'} onChange={(e) => setSaveAction(e.target.value)} className="accent-[#419ec0] w-4 h-4" />
                Lưu & Ở lại trang này
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#419ec0] transition-colors text-gray-300">
                <input type="radio" name="saveAction" value="next" checked={saveAction === 'next'} onChange={(e) => setSaveAction(e.target.value)} className="accent-[#419ec0] w-4 h-4" />
                Lưu xong qua thẻ kế tiếp
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#419ec0] transition-colors text-gray-300">
                <input type="radio" name="saveAction" value="list" checked={saveAction === 'list'} onChange={(e) => setSaveAction(e.target.value)} className="accent-[#419ec0] w-4 h-4" />
                Lưu xong về trang Quản lý
              </label>
            </div>

            <div className="flex justify-center gap-6 max-w-2xl mx-auto">
              <button type="button" onClick={() => navigate('/manage-storycards')} className="w-1/3 border border-gray-500 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded transition-colors text-lg">
                Hủy
              </button>
              <button type="submit" className="w-2/3 bg-[#419ec0] hover:bg-[#2c728c] text-white font-bold py-3 px-4 rounded transition-colors shadow-lg shadow-[#419ec0]/20 text-lg tracking-wide">
                LƯU THAY ĐỔI
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditStoryCard;