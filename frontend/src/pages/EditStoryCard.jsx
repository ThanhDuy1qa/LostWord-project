import { useEditStoryCard } from '../hooks/useEditStoryCard';

const EditStoryCard = () => {
  const {
    formData, message, loading, currentIndex, allCardsList, originalImageUrl, saveAction,
    setSaveAction, handleNavigate, handleChange, handleSubmit, navigate,
    effectDict, cardEffects, handleEffectChange,
    stat1, setStat1, stat2, setStat2
  } = useEditStoryCard();

  if (loading) return <div className="text-white text-center mt-20">Đang tải...</div>;

  const cleanOriginalUrl = (originalImageUrl || '').replace('.png', '');
  const cleanFormUrl = (formData.image_url || '').replace('.png', '');

  const effectGroups = effectDict.reduce((acc, effect) => {
    if (!acc[effect.effect_group]) acc[effect.effect_group] = [];
    acc[effect.effect_group].push(effect);
    return acc;
  }, {});

  const getIconUrl = (effCode, direction) => {
      if(!effCode) return null;
      const dictItem = effectDict.find(d => d.effect_code === effCode);
      if(!dictItem) return null;
      return direction === 'UP' ? dictItem.icon_up_url : dictItem.icon_down_url;
  }

  // Tiện ích tự động bôi đen chữ khi click vào ô input
  const handleFocus = (e) => e.target.select();

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-start">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-6xl shadow-2xl flex flex-col gap-6">
        
        {/* TIÊU ĐỀ NẰM TRÊN CÙNG */}
        <div>
          <h2 className="text-3xl font-bold text-[#e1c16e] mb-2 text-center font-serif">❖ Chỉnh Sửa Story Card ❖</h2>
          {message && <div className="text-center font-bold text-yellow-400 mt-2">{message}</div>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          {/* --- PHẦN TRÊN: CHIA 2 CỘT (HÌNH ẢNH & THÔNG TIN) --- */}
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* CỘT TRÁI (1/3): HÌNH ẢNH */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg relative">
                <img src={`${cleanOriginalUrl || cleanFormUrl}.webp`} alt="Preview" className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
                <div className="absolute bottom-0 left-0 w-full bg-black/70 text-center text-xs py-2 px-1 font-mono text-gray-300 break-all">
                  {cleanOriginalUrl}.webp
                </div>
              </div>
              <p className="mt-4 text-center text-yellow-500 font-bold text-xl">{'★'.repeat(formData.rarity)}</p>

              <div className="flex w-full justify-between mt-6 gap-2">
                <button onClick={() => handleNavigate('prev')} disabled={currentIndex <= 0} type="button"
                  className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1">⬅ Trước</button>
                <button onClick={() => handleNavigate('next')} disabled={currentIndex === -1 || currentIndex >= allCardsList.length - 1} type="button"
                  className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1">Sau ➡</button>
              </div>
            </div>

            {/* CỘT PHẢI (2/3): FORM CƠ BẢN & STATS */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              
              <div>
                <label className="block text-gray-400 mb-1 text-sm">Tên Thẻ (Name)</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Độ Hiếm</label>
                  <select name="rarity" value={formData.rarity} onChange={handleChange}
                    className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-yellow-500">
                    {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} Sao</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-gray-400 mb-1 text-sm">Loại (Type)</label>
                  <select name="type" value={formData.type} onChange={handleChange}
                    className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none">
                    <option value="Bamboo">Bamboo</option>
                    <option value="Orchid">Orchid</option>
                    <option value="Chrysanthemum">Chrysanthemum</option>
                    <option value="Plum">Plum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-sm">Đường Dẫn Ảnh Mới (Tự động cập nhật)</label>
                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] text-gray-300 outline-none" />
              </div>

              <div className="mt-4 border-t border-gray-700 pt-4">
                <h3 className="text-base font-bold text-[#c09641] mb-3">Chỉ Số Bổ Sung (Stats)</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex items-center gap-2 bg-[#25252d] p-2 rounded border border-gray-600">
                    <select value={stat1.type} onChange={(e) => setStat1({...stat1, type: e.target.value})}
                      className="flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-sm">
                      <option value="hp">HP</option>
                      <option value="yin_atk">Yin ATK</option>
                      <option value="yang_atk">Yang ATK</option>
                      <option value="yin_def">Yin DEF</option>
                      <option value="yang_def">Yang DEF</option>
                      <option value="agility">Agility</option>
                    </select>
                    <input type="number" value={stat1.value} onFocus={handleFocus} step="5" onChange={(e) => setStat1({...stat1, value: parseInt(e.target.value) || 0})}
                      className="w-24 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-center text-yellow-500 font-bold" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 bg-[#25252d] p-2 rounded border border-gray-600">
                    <select value={stat2.type} onChange={(e) => setStat2({...stat2, type: e.target.value})}
                      className="flex-1 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-sm">
                      <option value="hp">HP</option>
                      <option value="yin_atk">Yin ATK</option>
                      <option value="yang_atk">Yang ATK</option>
                      <option value="yin_def">Yin DEF</option>
                      <option value="yang_def">Yang DEF</option>
                      <option value="agility">Agility</option>
                    </select>
                    <input type="number" value={stat2.value} onFocus={handleFocus} step="5" onChange={(e) => setStat2({...stat2, value: parseInt(e.target.value) || 0})}
                      className="w-24 bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none text-center text-yellow-500 font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- PHẦN DƯỚI: HIỆU ỨNG TRẢI DÀI TOÀN BỘ (FULL WIDTH) --- */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-xl font-bold text-[#c09641] mb-4">Hiệu Ứng (Effects) - Tối đa 3</h3>

            <div className="space-y-3">
              {cardEffects.map((eff, index) => {
                const iconSrc = getIconUrl(eff.effect_code, eff.direction);
                const uniqueGroups = [...new Set(effectDict.map(d => d.effect_group).filter(Boolean))];
                const currentGroup = eff.ui_group || (eff.effect_code ? effectDict.find(d => d.effect_code === eff.effect_code)?.effect_group : '');
                const isBuff = currentGroup === 'Status Buff';
                const isModifier = currentGroup === 'Bullet Modifier' || currentGroup === 'Elemental Modifier';

                return (
                <div key={index} className="flex flex-nowrap gap-3 items-center justify-center bg-[#25252d] p-2.5 rounded border border-gray-600 relative overflow-hidden">
                  
                  {/* KHU VỰC ICON */}
                  <div className="w-8 h-8 flex-shrink-0 bg-gray-800 rounded flex items-center justify-center border border-gray-600 overflow-hidden">
                      {iconSrc ? (
                          <img src={`${iconSrc}.webp`} alt="Icon" className="w-full h-full object-contain" 
                              onError={(e) => {e.target.style.display='none'}}/>
                      ) : (
                          <span className="text-xs text-gray-500">?</span>
                      )}
                  </div>

                  {/* LỰA CHỌN NHÓM (GROUP) */}
                  <select value={currentGroup} onChange={(e) => handleEffectChange(index, 'ui_group', e.target.value)}
                    className="w-[140px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-gray-300">
                    <option value="">-- Chọn Nhóm --</option>
                    {uniqueGroups.map(groupName => (
                        <option key={groupName} value={groupName}>{groupName}</option>
                    ))}
                  </select>

                  {/* LỰA CHỌN HIỆU ỨNG CHI TIẾT */}
                  <select value={eff.effect_code} onChange={(e) => handleEffectChange(index, 'effect_code', e.target.value)}
                    disabled={!currentGroup}
                    className={`flex-grow min-w-[150px] max-w-[250px] bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-sm text-[#419ec0] font-semibold ${!currentGroup ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#419ec0]'}`}>
                    <option value="">-- Chọn Hiệu ứng --</option>
                    {effectDict.filter(d => d.effect_group === currentGroup).map(dict => (
                        <option key={dict.effect_code} value={dict.effect_code} className="text-white">
                          {dict.effect_name}
                        </option>
                    ))}
                  </select>

                  {/* LỰA CHỌN CLASS LOCK */}
                  <select value={eff.role_lock || 'ALL'} onChange={(e) => handleEffectChange(index, 'role_lock', e.target.value)}
                    disabled={!isBuff}
                    title={!isBuff ? "Chỉ áp dụng cho Status Buff" : "Khóa Class nhận Buff"}
                    className={`w-[110px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-sm text-center ${!isBuff ? 'opacity-30 cursor-not-allowed' : 'focus:border-[#419ec0] text-pink-400'}`}>
                    <option value="ALL">Mọi Class</option>
                    <option value="Attack">ATK ONLY</option>
                    <option value="Defense">DEF ONLY</option>
                    <option value="Support">SUP ONLY</option>
                    <option value="Heal">HEAL ONLY</option>
                    <option value="Speed">SPD ONLY</option>
                    <option value="Destroy">DES ONLY</option>
                    <option value="Technical">TEC ONLY</option>
                    <option value="Debuff">DEB ONLY</option>
                  </select>

                  {/* HƯỚNG TĂNG/GIẢM */}
                  <select value={eff.direction || 'UP'} onChange={(e) => handleEffectChange(index, 'direction', e.target.value)}
                    className="w-[100px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center">
                    <option value="UP">Tăng(UP)</option>
                    <option value="DOWN">Giảm(DW)</option>
                  </select>

                  {/* TRỊ SỐ - Bôi đen khi click & Bước nhảy 5 cho Bullet/Element */}
                  <div className="flex items-center gap-1.5 w-[85px] flex-shrink-0">
                    <span className="text-[11px] text-gray-400 leading-tight">Trị<br/>số:</span>
                    <input 
                      type="number" 
                      value={eff.value || 0} 
                      onFocus={handleFocus}
                      step={isModifier ? 5 : 1}
                      onChange={(e) => handleEffectChange(index, 'value', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center font-bold" 
                    />
                  </div>

                  {/* MỤC TIÊU */}
                  <select value={eff.target || 'SELF'} onChange={(e) => handleEffectChange(index, 'target', e.target.value)}
                    className="w-[110px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center">
                    <option value="SELF">Bản thân</option>
                    <option value="TARGET">Mục tiêu</option>
                    <option value="PARTY">Toàn Đội</option>
                    <option value="ENEMY">Toàn Địch</option>
                  </select>

                  {/* TURN - Bôi đen khi click */}
                  <div className="flex items-center gap-1.5 w-[80px] flex-shrink-0">
                    <span className="text-xs text-gray-400">Turn:</span>
                    <input 
                      type="number" 
                      value={eff.duration || 1} 
                      onFocus={handleFocus}
                      onChange={(e) => handleEffectChange(index, 'duration', parseInt(e.target.value) || 0)}
                      className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1.5 focus:border-[#419ec0] outline-none text-sm text-center" 
                    />
                  </div>

                </div>
              )})}
            </div>
          </div>

          {/* --- ACTION BUTTONS TỔNG --- */}
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