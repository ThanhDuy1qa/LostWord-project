import React, { useState, useRef, useEffect } from 'react';
import EffectRowItem from './EffectRowItem';
import { API_BASE_URL } from '../config/api';
// Hàm hỗ trợ tạo đường dẫn ảnh nhân vật từ thông tin friend
const getFriendAvatarUrl = (friend) => {
  if (!friend) return '';
  if (friend.avatar_url) return friend.avatar_url;
  if (friend.image_url) {
    if (friend.image_url.startsWith('http') || friend.image_url.startsWith('/')) {
      return friend.image_url;
    }
    // Chuyển đổi tên thư mục universe tương tự backend
    const folder = (friend.universe || '')
      .replaceAll('>', '__')
      .replaceAll('<', '_')
      .replaceAll('#', '%');
    return `/image/friend/${folder}/${friend.image_url}.webp`;
  }
  return '';
};

// =========================================================================
// COMPONENT DROPDOWN TÌM KIẾM NHÂN VẬT (HÌNH + TÊN + VŨ TRỤ)
// =========================================================================
const CharacterSearchSelect = ({ value, friendList = [], onSelect, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [internalList, setInternalList] = useState(friendList);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Cập nhật internalList khi friendList prop thay đổi
  useEffect(() => {
    if (Array.isArray(friendList) && friendList.length > 0) {
      setInternalList(friendList);
    }
  }, [friendList]);

  // 2. Tự động Fetch API nếu friendList truyền vào rỗng
  // 2. Tự động Fetch API nếu friendList truyền vào rỗng
useEffect(() => {
  if (!internalList || internalList.length === 0) {
    setLoading(true);

    // Sử dụng đúng API BASE URL của Backend
    fetch(`${API_BASE_URL}/friends`)
      .then((res) => res.json())
      .then((resData) => {
        // Hỗ trợ bóc tách mảng từ các kiểu response khác nhau (array, {data: [...]}, {friends: [...]})
        const list = Array.isArray(resData)
          ? resData
          : Array.isArray(resData?.data)
          ? resData.data
          : Array.isArray(resData?.friends)
          ? resData.friends
          : [];

        if (list.length > 0) {
          setInternalList(list);
        }
      })
      .catch((err) => console.error('Lỗi lấy danh sách nhân vật cho Dropdown:', err))
      .finally(() => setLoading(false));
  }
}, []);

  // 3. Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFriend = internalList.find(
    (f) => (f.name || f.character_name) === value
  );

  // Lọc theo Tên hoặc Vũ trụ
  const filteredFriends = internalList.filter((f) => {
    const name = (f.name || f.character_name || '').toLowerCase();
    const universe = (f.universe || '').toLowerCase();
    const term = search.toLowerCase();
    return name.includes(term) || universe.includes(term);
  });

  return (
    <div className="relative min-w-[200px]" ref={dropdownRef}>
      {/* Khung hiển thị nhân vật đã chọn */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0f0f12] border border-purple-600/80 hover:border-purple-400 rounded px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-all text-xs select-none min-h-[34px]"
      >
        {selectedFriend ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={getFriendAvatarUrl(selectedFriend)}
              alt={selectedFriend.name}
              className="w-6 h-6 object-cover rounded border border-purple-500/60 flex-shrink-0 bg-black/40"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="truncate">
              <div className="text-amber-300 font-bold truncate leading-tight">
                {selectedFriend.name}
              </div>
              {selectedFriend.universe && (
                <div className="text-[10px] text-purple-300/80 truncate leading-tight">
                  {selectedFriend.universe}
                </div>
              )}
            </div>
          </div>
        ) : value ? (
          <span className="text-amber-300 font-bold truncate">{value}</span>
        ) : (
          <span className="text-gray-400 italic">-- Chọn nhân vật --</span>
        )}
        <span className="text-purple-400 text-xs ml-2">▼</span>
      </div>

      {/* Menu thả xuống */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-[#181820] border border-purple-600/90 rounded-lg shadow-2xl z-50 p-2 text-xs">
          {/* Ô nhập từ khóa tìm kiếm */}
          <div className="mb-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Gõ tìm Tên hoặc Vũ trụ..."
              className="w-full bg-[#0d0d11] text-gray-200 border border-purple-700 rounded px-2 py-1.5 outline-none focus:border-purple-400 text-xs"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Danh sách gợi ý */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-3 text-center text-purple-300 italic">Đang tải danh sách...</div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-3 text-center text-gray-400 italic">
                Không tìm thấy nhân vật phù hợp
              </div>
            ) : (
              filteredFriends.map((f) => {
                const fName = f.name || f.character_name;
                const isSelected = fName === value;
                return (
                  <div
                    key={f.friend_id || f.id || fName}
                    onClick={() => {
                      onSelect(fName);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-900/80 border border-purple-500'
                        : 'hover:bg-purple-950/60'
                    }`}
                  >
                    <img
                      src={getFriendAvatarUrl(f)}
                      alt={fName}
                      className="w-7 h-7 object-cover rounded border border-gray-700 flex-shrink-0 bg-black/40"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-200 truncate">{fName}</div>
                      {f.universe && (
                        <div className="text-[10px] text-purple-300/80 truncate">
                          {f.universe}
                        </div>
                      )}
                    </div>
                    {isSelected && <span className="text-green-400 font-bold ml-auto">✓</span>}
                  </div>
                );
              })
            )}
          </div>

          {/* Nút Xóa chọn */}
          {value && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setIsOpen(false);
              }}
              className="w-full mt-2 pt-1.5 border-t border-gray-700 text-center text-red-400 hover:text-red-300 font-semibold text-[11px]"
            >
              ✕ Bỏ chọn nhân vật
            </button>
          )}
        </div>
      )}
    </div>
  );
};
// =========================================================================
// MAIN SKILLS FORM COMPONENT
// =========================================================================
const FriendSkillsForm = ({ skills = [], effectDict = [], onChange, friendList = [] }) => {
  const currentSkills = Array.isArray(skills) && skills.length > 0 
    ? skills 
    : [
        { name: 'Skill 1', skill_name: 'Skill 1', cd: 3, cooldown: 3, is_x_change: false, x_change_from: '', effects: [] },
        { name: 'Skill 2', skill_name: 'Skill 2', cd: 3, cooldown: 3, is_x_change: false, x_change_from: '', effects: [] },
        { name: 'Skill 3', skill_name: 'Skill 3', cd: 3, cooldown: 3, is_x_change: false, x_change_from: '', effects: [] },
      ];

  const updateSkillField = (sIdx, field, value) => {
    const updated = [...currentSkills];
    updated[sIdx] = { ...updated[sIdx], [field]: value };
    if (field === 'name') updated[sIdx].skill_name = value;
    if (field === 'cd') updated[sIdx].cooldown = parseInt(value, 10) || 0;
    onChange(updated);
  };

  // Hàm bật/tắt hoặc HỦY X-Change cho bất kỳ skill nào
  const toggleXChange = (sIdx, checked) => {
    const updated = [...currentSkills];
    updated[sIdx] = {
      ...updated[sIdx],
      is_x_change: Boolean(checked),
      x_change_from: checked ? (updated[sIdx].x_change_from || '') : '' // Hủy thì xóa x_change_from
    };
    onChange(updated);
  };

  const addXChangeSkill = () => {
    const updated = [
      ...currentSkills,
      {
        name: 'X-Change Skill',
        skill_name: 'X-Change Skill',
        cd: 8,
        cooldown: 8,
        is_x_change: true,
        x_change_from: '',
        effects: []
      }
    ];
    onChange(updated);
  };

  const removeXChangeSkill = () => {
    const updated = currentSkills.slice(0, 3);
    onChange(updated);
  };

  const addSkillEffect = (sIdx) => {
    const updated = [...currentSkills];
    const targetSkill = { ...updated[sIdx] };
    const currentEffects = Array.isArray(targetSkill.effects) ? targetSkill.effects : [];
    
    const firstDict = Array.isArray(effectDict) && effectDict.length > 0 ? effectDict[0] : {};
    const groupName = firstDict.effect_group || firstDict.ui_group || 'Status Buff';

    const newEffect = {
      ui_group: groupName,
      effect_group: groupName,
      effect_code: firstDict.effect_code || '',
      direction: 'UP',
      value: 1,
      target: 'SELF',
      duration: 3,
      is_infinite: 0,
      sync_from_stat: '',
      sync_to_stat: '',
      effect_text: ''
    };

    targetSkill.effects = [...currentEffects, newEffect];
    updated[sIdx] = targetSkill;
    onChange(updated);
  };

  const updateSkillEffect = (sIdx, eIdx, updatedEff) => {
    const updated = [...currentSkills];
    const targetSkill = { ...updated[sIdx] };
    const effects = [...(targetSkill.effects || [])];
    
    effects[eIdx] = updatedEff;
    targetSkill.effects = effects;
    updated[sIdx] = targetSkill;
    onChange(updated);
  };

  const removeSkillEffect = (sIdx, eIdx) => {
    const updated = [...currentSkills];
    const targetSkill = { ...updated[sIdx] };
    targetSkill.effects = (targetSkill.effects || []).filter((_, i) => i !== eIdx);
    updated[sIdx] = targetSkill;
    onChange(updated);
  };

  return (
    <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-green-400">⚡ Skill Effects</h3>
        
        {/* NÚT THÊM / XÓA SKILL 4 (X-CHANGE) */}
        {currentSkills.length === 3 ? (
          <button
            type="button"
            onClick={addXChangeSkill}
            className="bg-purple-800 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded font-bold shadow transition-all"
          >
            + Thêm Skill 4 (X-Change)
          </button>
        ) : currentSkills.length > 3 ? (
          <button
            type="button"
            onClick={removeXChangeSkill}
            className="bg-red-900/60 hover:bg-red-700 text-red-200 text-xs px-3 py-1.5 rounded font-bold shadow transition-all"
          >
            ✕ Xóa Skill 4 (X-Change)
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {currentSkills.map((skill, sIdx) => {
          const isXChange = Boolean(skill.is_x_change);

          return (
            <div
              key={skill.id || sIdx}
              className={`p-3 rounded-lg border transition-all ${
                isXChange
                  ? 'bg-[#181220] border-purple-700/80 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'bg-[#121216] border-gray-800'
              }`}
            >
              {/* TÊN SKILL, COOLDOWN VÀ CẤU HÌNH X-CHANGE */}
              <div className="flex flex-wrap items-center justify-between border-b border-gray-700/80 pb-2 mb-3 gap-2">
                <input
                  type="text"
                  value={skill.name || skill.skill_name || ''}
                  onChange={(e) => updateSkillField(sIdx, 'name', e.target.value)}
                  className={`bg-transparent font-bold text-sm border-b border-transparent hover:border-gray-600 outline-none w-1/3 min-w-[150px] ${
                    isXChange ? 'text-purple-300' : 'text-green-400'
                  }`}
                  placeholder="Tên Skill..."
                />

                <div className="flex items-center gap-3 flex-wrap">
                  {/* COOLDOWN */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-amber-400 font-bold">CD:</span>
                    <input
                      type="number"
                      value={skill.cd ?? skill.cooldown ?? 3}
                      onChange={(e) => updateSkillField(sIdx, 'cd', e.target.value)}
                      className="w-12 bg-[#0f0f12] border border-gray-700 rounded text-center text-xs text-amber-300 font-bold p-1 outline-none"
                    />
                    <span className="text-xs text-gray-400">turn</span>
                  </div>

                  {/* CHECKBOX VÀ NÚT HỦY X-CHANGE */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-[#0f0f12] px-2 py-1 rounded border border-purple-800/60 select-none hover:border-purple-600 transition-colors">
                      <input
                        type="checkbox"
                        checked={isXChange}
                        onChange={(e) => toggleXChange(sIdx, e.target.checked)}
                        className="accent-purple-500 cursor-pointer"
                      />
                      <span className="text-xs text-purple-300 font-bold">X-Change Skill</span>
                    </label>

                    {/* NÚT HỦY TẬN TAY NẾU ĐANG BẬT X-CHANGE */}
                    {isXChange && (
                      <button
                        type="button"
                        onClick={() => toggleXChange(sIdx, false)}
                        className="text-[11px] bg-red-900/50 hover:bg-red-800 text-red-200 px-2 py-1 rounded font-semibold transition-colors"
                        title="Hủy chế độ X-Change cho Skill này"
                      >
                        ✕ Hủy X-Change
                      </button>
                    )}
                  </div>

                  {/* CHỌN NHÂN VẬT ĐỔI SANG (DROPDOWN HÌNH + TÊN + VŨ TRỤ) */}
                  {isXChange && (
                    <div className="flex items-center gap-1.5 bg-purple-950/70 px-2 py-1 rounded border border-purple-600/60">
                      <span className="text-xs text-purple-200 font-semibold whitespace-nowrap">Switch từ:</span>
                      <CharacterSearchSelect
                        value={skill.x_change_from || ''}
                        friendList={friendList}
                        onSelect={(charName) => updateSkillField(sIdx, 'x_change_from', charName)}
                        onClear={() => updateSkillField(sIdx, 'x_change_from', '')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* DANH SÁCH HIỆU ỨNG CỦA SKILL */}
              <div className="flex flex-col gap-2">
                {(skill.effects || []).map((eff, eIdx) => (
                  <EffectRowItem
                    key={eIdx}
                    eff={eff}
                    effectDict={effectDict}
                    onChange={(val) => updateSkillEffect(sIdx, eIdx, val)}
                    onRemove={() => removeSkillEffect(sIdx, eIdx)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => addSkillEffect(sIdx)}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold border border-cyan-800/60 rounded px-2 py-1 w-max bg-cyan-950/30 hover:bg-cyan-900/50 transition-all"
                >
                  + Thêm Hiệu Ứng Skill
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FriendSkillsForm;