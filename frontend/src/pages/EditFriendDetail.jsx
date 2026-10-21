import React, { useState } from 'react';
import { useEditFriendDetail } from '../hooks/useEditFriendDetail';
import CharacterSearchAutoFill from "../components/CharacterSearchAutoFill";
import { getCharacterImageUrl, getRoleIconUrl } from '../utils/characterUtils';

import FriendStatsForm from '../frienddetail/FriendStatsForm';
import FriendSkillsForm from '../frienddetail/FriendSkillsForm';
import FriendAbilityForm from '../frienddetail/FriendAbilityForm';
import SpellCardHeaderForm from '../frienddetail/SpellCardHeaderForm';
import SpellCardBulletsForm from '../frienddetail/SpellCardBulletsForm';
import SpellCardPropertiesForm from '../frienddetail/SpellCardPropertiesForm';

const EditFriendDetail = ({ characterId }) => {
  const {
    charData,
    setCharData,
    effectDict,
    friendList,
    loading,
    message,
    autoNext,
    setAutoNext,
    currentIndex,
    totalFriends,
    isCurrentRebirth,
    toggleRebirthMode,
    goToNextCharacter,
    goToPrevCharacter,
    handleSave,
    applyCharacterData
  } = useEditFriendDetail(characterId);

  const [activeScTab, setActiveScTab] = useState(0);
  const [newTagInput, setNewTagInput] = useState('');

  if (loading) return <div className="text-white text-center mt-20 font-bold">⌛ Đang tải dữ liệu nhân vật...</div>;

  const spellCardsList = charData?.spellCards || charData?.spellcards || [];
  const activeSc = spellCardsList[activeScTab] || spellCardsList[0];

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tagVal = newTagInput.trim();
    const currentTags = Array.isArray(charData.unit_tags) ? charData.unit_tags : [];
    
    if (!currentTags.includes(tagVal)) {
      setCharData({
        ...charData,
        unit_tags: [...currentTags, tagVal]
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    const currentTags = Array.isArray(charData.unit_tags) ? charData.unit_tags : [];
    const updatedTags = currentTags.filter((_, idx) => idx !== indexToRemove);
    setCharData({
      ...charData,
      unit_tags: updatedTags
    });
  };

  const handleUpdateActiveScHeader = (updatedSc) => {
    const updatedCards = [...spellCardsList];
    updatedCards[activeScTab] = updatedSc;
    setCharData({ 
      ...charData, 
      spellCards: updatedCards, 
      spellcards: updatedCards 
    });
  };

  const handleUpdateBullet = (bIndex, updatedBullet) => {
    const updatedCards = [...spellCardsList];
    const targetSc = { ...updatedCards[activeScTab] };
    const bullets = [...(targetSc.bullets || targetSc.bullet_lines || [])];
    
    bullets[bIndex] = updatedBullet;
    targetSc.bullets = bullets;
    targetSc.bullet_lines = bullets;
    
    updatedCards[activeScTab] = targetSc;
    setCharData({ 
      ...charData, 
      spellCards: updatedCards, 
      spellcards: updatedCards 
    });
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white p-6 flex justify-center">
      <div className="bg-[#15151a] p-6 rounded-xl border border-gray-800 w-full max-w-6xl shadow-2xl flex flex-col gap-6">
        
        {/* HEADER & THANH ĐIỀU HƯỚNG NHANH */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <button
            type="button"
            onClick={goToPrevCharacter}
            disabled={currentIndex <= 0}
            className="px-4 py-2 bg-[#1d1d24] hover:bg-[#282834] disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 rounded-lg text-sm font-bold text-cyan-400 transition-all flex items-center gap-1.5"
          >
            ◀ NV Trước
          </button>

          <div className="flex flex-col items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#e1c16e] font-serif tracking-wide text-center">
              ❖ CHI TIẾT NHÂN VẬT & SPELL CARD EDITOR ❖
            </h2>
            {totalFriends > 0 && (
              <span className="text-xs text-gray-400 mt-1 bg-gray-900 px-3 py-0.5 rounded-full border border-gray-800">
                Nhân vật <strong className="text-amber-400">{currentIndex + 1}</strong> / <strong>{totalFriends}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextCharacter}
            disabled={currentIndex === -1 || currentIndex >= totalFriends - 1}
            className="px-4 py-2 bg-[#1d1d24] hover:bg-[#282834] disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 rounded-lg text-sm font-bold text-cyan-400 transition-all flex items-center gap-1.5"
          >
            NV Kế Tiếp ▶
          </button>
        </div>

        {/* TÌM KIẾM AUTOFILL */}
        <CharacterSearchAutoFill
          effectDict={effectDict}
          friendList={friendList}
          onSelectCharacter={(data) => applyCharacterData(data, effectDict)}
        />

        {/* 🌟 THANH CHỌN CHẾ ĐỘ THƯỜNG / REBIRTH (CHUYỂN SINH) */}
        <div className="bg-[#181820] p-3 rounded-xl border border-purple-800/60 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              ✦ Phiên bản Nhân Vật:
            </span>
            {isCurrentRebirth ? (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                🌟 Đang xem Bản Rebirth
              </span>
            ) : (
              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 text-xs px-2.5 py-0.5 rounded-full font-bold">
                👤 Đang xem Bản Thường
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#0f0f12] p-1 rounded-lg border border-gray-800">
            <button
              type="button"
              onClick={() => toggleRebirthMode(false)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                !isCurrentRebirth
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              👤 Bản Thường
            </button>

            <button
              type="button"
              onClick={() => toggleRebirthMode(true)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                isCurrentRebirth
                  ? 'bg-gradient-to-r from-amber-600 to-purple-600 text-white shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              🌟 Bản Rebirth (Chuyển Sinh)
            </button>
          </div>
        </div>

        {/* 💾 KHỐI NÚT LƯU THAY ĐỔI (ĐÃ CHUYỂN LÊN ĐÂY) */}
        <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoNext}
                onChange={(e) => setAutoNext(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
              Tự động chuyển NV kế tiếp sau khi lưu
            </label>
            {message && <span className="text-xs font-semibold text-amber-300 ml-2">{message}</span>}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg transition-all text-xs sm:text-sm flex-1 sm:flex-none text-center"
            >
              💾 Lưu Thay Đổi
            </button>

            <button
              type="button"
              onClick={() => handleSave({ forceGoNext: true })}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg transition-all text-xs sm:text-sm flex-1 sm:flex-none text-center"
            >
              💾 Lưu & Kế Tiếp ➔
            </button>
          </div>
        </div>

        {/* THÔNG TIN VŨ TRỤ / NV */}
        <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-4 bg-[#121216] p-3 rounded-lg border border-gray-800 w-full md:w-auto min-w-[240px]">
            <div className="w-16 h-20 bg-black rounded overflow-hidden border border-gray-600 flex-shrink-0 relative">
              <img
                src={getCharacterImageUrl(charData.universe || charData.code, charData.image_url)}
                alt={charData.name || 'Character'}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/100x120?text=No+Img'; }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#c09641] uppercase tracking-wider">
                Vũ trụ: {charData.universe || charData.code || 'N/A'}
              </span>
              <span className="text-sm font-bold text-white line-clamp-1">
                {charData.name || 'Chưa chọn NV'}
              </span>
              {charData.role && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <img src={getRoleIconUrl(charData.role)} alt={charData.role} className="w-4 h-4 object-contain" />
                  <span className="text-xs text-gray-400">{charData.role}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Mã Vũ Trụ / Code</label>
              <input
                type="text"
                value={charData?.code || charData?.universe || ''}
                onChange={(e) => setCharData({ 
                  ...charData, 
                  code: e.target.value, 
                  universe: e.target.value 
                })}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 text-cyan-400 font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Tên Nhân Vật</label>
              <input
                type="text"
                value={charData?.name || ''}
                onChange={(e) => setCharData({ ...charData, name: e.target.value })}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 text-amber-300 font-bold text-sm"
              />
            </div>
          </div>
        </div>

        {/* KHU VỰC CHỈNH SỬA UNIT TAGS */}
        <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-[#e1c16e] uppercase tracking-wider flex items-center gap-2">
              🏷️ Thẻ Nhân Vật (Unit Tags)
            </h3>
            <span className="text-xs text-gray-400">
              {Array.isArray(charData.unit_tags) ? charData.unit_tags.length : 0} tags
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(charData.unit_tags || []).map((tag, tIdx) => (
              <span
                key={tIdx}
                className="inline-flex items-center gap-1.5 bg-[#121216] text-cyan-300 text-xs font-semibold px-2.5 py-1 rounded-md border border-cyan-800/80 hover:border-cyan-500 transition-colors"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tIdx)}
                  className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs"
                  title="Xóa tag này"
                >
                  ✕
                </button>
              </span>
            ))}
            {(!charData.unit_tags || charData.unit_tags.length === 0) && (
              <span className="text-xs text-gray-500 italic">Chưa có unit tag nào.</span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Nhập tên tag mới (VD: Magician, Youkai...) và nhấn Enter"
              className="flex-grow bg-[#0f0f12] border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 font-bold border border-cyan-700 text-xs px-3 py-2 rounded transition-colors whitespace-nowrap"
            >
              + Thêm Tag
            </button>
          </div>
        </div>

        {/* FILE 1: ĐIỀN STAT */}
        <FriendStatsForm
          stats={charData.stats}
          onChange={(newStats) => setCharData({ ...charData, stats: newStats })}
        />

        {/* FILE 2: ĐIỀN SKILL */}
        <FriendSkillsForm
          skills={charData.skills}
          effectDict={effectDict}
          friendList={friendList}
          onChange={(newSkills) => setCharData({ ...charData, skills: newSkills })}
        />

        {/* FILE 3: ĐIỀN ABILITY VÀ SWITCH EFFECT */}
        <FriendAbilityForm
          ability={charData.ability}
          abilityName={charData.ability_name}
          switchEffect={charData.switch_effect}
          effectDict={effectDict}
          onChangeAbility={(newAbility) => setCharData({ ...charData, ability: newAbility })}
          onChangeAbilityName={(newName) => setCharData({ ...charData, ability_name: newName })}
          onChangeSwitchEffect={(newSwitch) => setCharData({ ...charData, switch_effect: newSwitch })}
        />

        {/* ĐIỀN PASSIVES */}
        <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-[#e1c16e] uppercase tracking-wider flex items-center gap-2">
              🛡️ Kỹ Năng Bị Động (Passives)
            </h3>
            <span className="text-xs text-gray-400">
              {(charData.passives || []).length} passives
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((pIdx) => (
              <div key={pIdx} className="flex flex-col gap-1 bg-[#121216] p-2.5 rounded border border-gray-800">
                <label className="text-xs font-bold text-cyan-400">
                  Passive {pIdx + 1}
                </label>
                <input
                  type="text"
                  value={(charData.passives || [])[pIdx] || ''}
                  onChange={(e) => {
                    const updatedPassives = [...(charData.passives || [])];
                    updatedPassives[pIdx] = e.target.value;
                    setCharData({ ...charData, passives: updatedPassives });
                  }}
                  placeholder={`Mô tả Passive ${pIdx + 1}...`}
                  className="bg-[#0f0f12] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-cyan-500 font-semibold"
                />
              </div>
            ))}
          </div>
        </div>

        {/* FILE 4, 5, 6: SPELL CARDS & BULLET LINES */}
        <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">🃏 Spell Cards & Bullet Lines</h3>
          
          <div className="flex gap-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
            {spellCardsList.map((sc, idx) => (
              <button
                key={sc.id || idx}
                type="button"
                onClick={() => setActiveScTab(idx)}
                className={`px-4 py-2 rounded-t-lg font-bold text-xs transition-all ${
                  activeScTab === idx
                    ? 'bg-cyan-900/80 text-cyan-300 border-t-2 border-cyan-400'
                    : 'bg-[#121216] text-gray-400 hover:text-white'
                }`}
              >
                {sc.name || sc.card_title || sc.title || `Spell Card ${idx + 1}`}
              </button>
            ))}
          </div>

          {activeSc && (
            <div className="flex flex-col gap-6">
              <SpellCardHeaderForm
                spellCard={activeSc}
                scIndex={activeScTab}
                effectDict={effectDict}
                onChange={handleUpdateActiveScHeader}
              />

              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                  ✦ Các Dòng Đạn & Thuộc Tính Đạn (Bullet Lines)
                </h4>
                
                <div className="flex flex-col gap-4">
                  {(activeSc.bullets || activeSc.bullet_lines || []).map((bullet, bIndex) => (
                    <div key={bullet.id || bIndex} className="bg-[#121216] p-4 rounded-lg border border-gray-800">
                      <SpellCardBulletsForm
                        bullet={bullet}
                        bIndex={bIndex}
                        onChange={(updatedB) => handleUpdateBullet(bIndex, updatedB)}
                      />

                      <SpellCardPropertiesForm
                        bullet={bullet}
                        bIndex={bIndex}
                        effectDict={effectDict}
                        onChange={(updatedB) => handleUpdateBullet(bIndex, updatedB)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EditFriendDetail;