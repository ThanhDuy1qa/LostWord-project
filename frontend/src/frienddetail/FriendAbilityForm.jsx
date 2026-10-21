import React from 'react';
import { matchDictItem } from '../hooks/useEditFriendDetail';

const FriendAbilityForm = ({
  ability = [],
  abilityName = '',
  switchEffect = '',
  effectDict = [],
  onChangeAbility,
  onChangeAbilityName,
  onChangeSwitchEffect,
}) => {
  const abilityList = Array.isArray(ability) ? ability : [];

  // Cập nhật dòng Ability khi người dùng gõ/sửa
  const handleLineChange = (index, newText) => {
    const updated = [...abilityList];
    const matched = matchDictItem(newText, effectDict);
    updated[index] = {
      ...matched,
      effect_text: newText,
    };
    onChangeAbility(updated);
  };

  // Thêm dòng mới
  const handleAddLine = () => {
    const defaultText = 'DMG to effective elements: +30%';
    const matched = matchDictItem(defaultText, effectDict);
    onChangeAbility([...abilityList, { ...matched, effect_text: defaultText }]);
  };

  // Xóa dòng
  const handleRemoveLine = (index) => {
    const updated = abilityList.filter((_, i) => i !== index);
    onChangeAbility(updated);
  };

  return (
    <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700 flex flex-col gap-4">
      {/* 1. TÊN NĂNG LỰC & SWITCH EFFECT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#121216] p-3 rounded-lg border border-purple-900/50">
        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            ⚡ Tên Năng Lực (Ability Name)
          </label>
          <input
            type="text"
            value={abilityName || ''}
            onChange={(e) => onChangeAbilityName(e.target.value)}
            placeholder="VD: Ability of controlling fire..."
            className="w-full bg-[#0f0f12] border border-gray-700 rounded p-2 text-amber-200 font-bold text-xs outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
            🔄 Hiệu ứng Chuyển Đổi (Switch Effect)
          </label>
          <input
            type="text"
            value={switchEffect || ''}
            onChange={(e) => onChangeSwitchEffect(e.target.value)}
            placeholder="VD: When Switched In: [Self] Agility +1.0 (2 turns)..."
            className="w-full bg-[#0f0f12] border border-gray-700 rounded p-2 text-cyan-300 font-bold text-xs outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* 2. DANH SÁCH ABILITIES */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <h3 className="text-sm font-bold text-[#e1c16e] uppercase tracking-wider flex items-center gap-2">
          ✦ Các Dòng Năng Lực Chi Tiết (Abilities)
        </h3>
        <button
          type="button"
          onClick={handleAddLine}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-800 px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 transition-all"
        >
          + Thêm Dòng Ability
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {abilityList.map((item, idx) => {
          const lineText = typeof item === 'string' ? item : (item.effect_text || '');
          const effectCode = typeof item === 'object' ? item.effect_code : '';
          const uiGroup = typeof item === 'object' ? (item.ui_group || item.effect_group) : '';
          const target = typeof item === 'object' ? item.target : '';

          return (
            <div key={idx} className="flex flex-col gap-1.5 bg-[#121216] p-2.5 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 w-6 text-center">
                  #{idx + 1}
                </span>

                {/* Ô nhập text tự do */}
                <input
                  type="text"
                  value={lineText}
                  onChange={(e) => handleLineChange(idx, e.target.value)}
                  placeholder="Nhập nội dung ability..."
                  className="flex-grow bg-[#0f0f12] border border-gray-700 text-cyan-100 font-semibold text-xs rounded p-2 outline-none focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  className="text-red-400 hover:text-red-300 font-bold px-2.5 py-1.5 text-xs bg-red-950/40 rounded border border-red-800/60"
                  title="Xóa dòng này"
                >
                  ✕
                </button>
              </div>

              {/* 🌟 CHỈ HIỂN THỊ BADGE KHI CÓ MÃ EFFECT_CODE HOẶC NHÓM HỢP LỆ (KHÔNG CÓ CUSTOM_EFFECT) */}
              {(Boolean(effectCode) || Boolean(uiGroup)) && (
                <div className="flex flex-wrap items-center gap-2 ml-8 text-[11px]">
                  <span className="text-gray-400 font-medium">Nhận diện:</span>

                  {/* Mục tiêu Target */}
                  {target && (
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      [{target}]
                    </span>
                  )}

                  {/* Mã Effect Code từ từ điển */}
                  {effectCode && (
                    <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-bold">
                      {effectCode}
                    </span>
                  )}

                  {/* Nhóm hiệu ứng UI Group */}
                  {uiGroup && (
                    <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-semibold">
                      {uiGroup}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {abilityList.length === 0 && (
          <span className="text-xs text-gray-500 italic py-1">
            Chưa có dòng ability nào. Chọn nhân vật ở thanh tìm kiếm JSON để tự động điền.
          </span>
        )}
      </div>
    </div>
  );
};

export default FriendAbilityForm;