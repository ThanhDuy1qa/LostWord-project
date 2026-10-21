import React from 'react';

const STAT_OPTIONS = [
  'Agility', 'Yin ATK', 'Yang ATK', 'Yin DEF', 'Yang DEF', 
];
const EffectRowItem = ({ eff = {}, effectDict = [], onChange, onRemove }) => {
  // 1. Lấy danh sách các Nhóm hiệu ứng không trùng lặp từ Effect Dict
  const uniqueGroups = [...new Set(effectDict.map(d => d.effect_group || d.ui_group).filter(Boolean))];

  // 2. Tự động xác định Nhóm hiện tại (nếu ui_group trống thì tra theo effect_code)
  const dictMatch = eff.effect_code ? effectDict.find(d => d.effect_code === eff.effect_code) : null;
  const currentGroup = eff.ui_group || eff.effect_group || dictMatch?.effect_group || dictMatch?.ui_group || '';

  // 3. Đường dẫn Icon Tăng/Giảm
  const iconRaw = eff.direction === 'DOWN' ? dictMatch?.icon_down_url : dictMatch?.icon_up_url;
  const iconSrc = iconRaw ? (iconRaw.endsWith('.webp') ? iconRaw : `${iconRaw}.webp`) : null;

  // Thay đổi Nhóm
  const handleGroupChange = (e) => {
    const newGroup = e.target.value;
    onChange({
      ...eff,
      ui_group: newGroup,
      effect_group: newGroup,
      effect_code: '' // Reset mã hiệu ứng khi đổi nhóm
    });
  };

  // Thay đổi Mã hiệu ứng
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    const selectedDict = effectDict.find(d => d.effect_code === newCode);
    const group = selectedDict?.effect_group || selectedDict?.ui_group || currentGroup;

    onChange({
      ...eff,
      effect_code: newCode,
      ui_group: group,
      effect_group: group,
      effect_text: selectedDict?.effect_name || eff.effect_text || newCode
    });
  };

  // Thay đổi thuộc tính lẻ
  const handleFieldChange = (field, value) => {
    onChange({
      ...eff,
      [field]: value
    });
  };

  return (
    <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center justify-between bg-[#18181c] p-2.5 rounded border border-gray-700">
      
      {/* ICON HIỆU ỨNG */}
      <div className="w-8 h-8 flex-shrink-0 bg-gray-900 rounded flex items-center justify-center border border-gray-700 overflow-hidden">
        {iconSrc ? (
          <img 
            src={iconSrc} 
            alt="Icon" 
            className="w-full h-full object-contain" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        ) : (
          <span className="text-xs text-gray-500">⚡</span>
        )}
      </div>

      {/* 1. CHỌN NHÓM HIỆU ỨNG */}
      <select
        value={currentGroup}
        onChange={handleGroupChange}
        className="w-[130px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-gray-300 focus:border-green-500"
      >
        <option value="">-- Chọn Nhóm --</option>
        {uniqueGroups.map(groupName => (
          <option key={groupName} value={groupName}>{groupName}</option>
        ))}
      </select>

      {/* 2. CHỌN MÃ / TÊN HIỆU ỨNG */}
      <select
        value={eff.effect_code || ''}
        onChange={handleCodeChange}
        disabled={!currentGroup}
        className={`flex-grow min-w-[140px] bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-cyan-400 font-semibold ${
          !currentGroup ? 'opacity-50 cursor-not-allowed' : 'focus:border-cyan-500'
        }`}
      >
        <option value="">-- Chọn Hiệu Ứng --</option>
        {effectDict
          .filter(d => (d.effect_group || d.ui_group) === currentGroup)
          .sort((a, b) => (a.effect_name || '').localeCompare(b.effect_name || ''))
          .map(dict => (
            <option key={dict.effect_code} value={dict.effect_code} className="text-white">
              {dict.effect_name || dict.effect_code}
            </option>
          ))
        }
      </select>

      {(eff.effect_code === 'Stat Sync' || eff.effect_text?.toLowerCase().includes('sync')) && (
        <div className="flex items-center gap-1 bg-[#0f0f12] p-1 rounded border border-cyan-800 flex-shrink-0">
          <span className="text-[10px] text-cyan-400 font-semibold">Từ:</span>
          <select
            value={eff.sync_from_stat || eff.from_stat || ''}
            onChange={(e) => handleFieldChange('sync_from_stat', e.target.value)}
            className="bg-[#18181c] border border-gray-700 rounded px-1 py-0.5 text-xs text-amber-300 font-bold outline-none cursor-pointer"
          >
            <option value="">-- Stat 1 --</option>
            {STAT_OPTIONS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <span className="text-[10px] text-cyan-400 font-bold">➜</span>

          <select
            value={eff.sync_to_stat || eff.to_stat || ''}
            onChange={(e) => handleFieldChange('sync_to_stat', e.target.value)}
            className="bg-[#18181c] border border-gray-700 rounded px-1 py-0.5 text-xs text-amber-300 font-bold outline-none cursor-pointer"
          >
            <option value="">-- Stat 2 --</option>
            {STAT_OPTIONS.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      )}

      {/* 3. HƯỚNG TĂNG / GIẢM */}
      <select
        value={eff.direction || 'UP'}
        onChange={(e) => handleFieldChange('direction', e.target.value)}
        className="w-[90px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-center text-green-400 font-bold"
      >
        <option value="UP">Tăng (UP)</option>
        <option value="DOWN">Giảm (DW)</option>
      </select>

      {/* 4. TRỊ SỐ */}
      <div className="flex items-center gap-1 w-[75px] flex-shrink-0">
        <span className="text-[10px] text-gray-400">Trị số:</span>
        <input
          type="number"
          value={eff.value !== undefined ? eff.value : 1}
          onChange={(e) => handleFieldChange('value', parseFloat(e.target.value) || 0)}
          className="w-full bg-[#0f0f12] border border-gray-600 rounded p-1 text-xs text-center font-bold text-white outline-none focus:border-green-500"
        />
      </div>

      {/* 5. MỤC TIÊU */}
      <select
        value={eff.target || 'SELF'}
        onChange={(e) => handleFieldChange('target', e.target.value)}
        className="w-[100px] flex-shrink-0 bg-[#0f0f12] border border-gray-600 rounded p-1.5 outline-none text-xs text-center text-gray-300"
      >
        <option value="SELF">Bản thân</option>
        <option value="TARGET">Mục tiêu</option>
        <option value="ALLIES">Toàn Đội</option>
        <option value="ENEMIES">Toàn Địch</option>
      </select>

      {/* 6. TURN (THỜI GIAN) & INFINITE */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="flex items-center gap-1 w-[70px]">
          <span className="text-[10px] text-gray-400">Turn:</span>
          <input
            type="number"
            disabled={Boolean(eff.is_infinite)}
            value={eff.is_infinite ? 0 : (eff.duration !== undefined ? eff.duration : 3)}
            onChange={(e) => handleFieldChange('duration', parseInt(e.target.value, 10) || 0)}
            className={`w-full border rounded p-1 text-xs text-center font-bold outline-none ${
              eff.is_infinite
                ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#0f0f12] border-gray-600 text-white focus:border-green-500'
            }`}
          />
        </div>

        {/* Nút bấm chuyển đổi Infinite */}
        <button
          type="button"
          onClick={() => {
            const nextVal = eff.is_infinite ? 0 : 1;
            onChange({
              ...eff,
              is_infinite: nextVal,
              duration: nextVal === 1 ? 0 : (eff.duration || 3)
            });
          }}
          className={`px-1.5 py-1 rounded text-xs font-bold transition-all border ${
            eff.is_infinite
              ? 'bg-purple-900/80 border-purple-500 text-purple-200 shadow-sm shadow-purple-500/50'
              : 'bg-[#0f0f12] border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
          title="Bật/Tắt Hiệu ứng Vĩnh viễn (Infinite)"
        >
          ∞
        </button>
      </div>

      {/* NÚT XÓA */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white px-2 py-1 rounded transition-colors text-xs font-bold"
          title="Xóa hiệu ứng này"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default EffectRowItem;