import React from 'react';

const ELEMENTS = ['NO_ELEMENT', 'SUN', 'MOON', 'FIRE', 'WATER', 'WOOD', 'METAL', 'EARTH', 'STAR'];
const BULLET_TYPES = [
  'NORMAL', 'LASER', 'RICE', 'BOUND', 'LIGHT', 'HEAVY', 
  'SHARP', 'LIQUID', 'ENERGY', 'BODY', 'OFUDA', 'MISSILE', 'SLASH'
];

// Bảng màu phủ kín khung (Background, Border, Text & Input) theo đúng yêu cầu
const ELEMENT_STYLES = {
  NO_ELEMENT: {
    bg: 'bg-[#2b2e36]', // Trắng xám
    border: 'border-slate-400',
    text: 'text-slate-100',
    badge: 'bg-slate-200 text-slate-900 font-bold border-slate-300',
    inputBg: 'bg-[#1d1f25] border-slate-400 text-slate-100',
  },
  SUN: {
    bg: 'bg-[#3d3814]', // Vàng nhạt
    border: 'border-yellow-300',
    text: 'text-yellow-200',
    badge: 'bg-yellow-300 text-yellow-950 font-extrabold border-yellow-200',
    inputBg: 'bg-[#28250d] border-yellow-400/80 text-yellow-100',
  },
  MOON: {
    bg: 'bg-[#2d1645]', // Tím
    border: 'border-purple-400',
    text: 'text-purple-200',
    badge: 'bg-purple-500 text-white font-bold border-purple-300',
    inputBg: 'bg-[#1e0e2e] border-purple-400/80 text-purple-100',
  },
  FIRE: {
    bg: 'bg-[#401212]', // Đỏ
    border: 'border-red-500',
    text: 'text-red-200',
    badge: 'bg-red-600 text-white font-bold border-red-400',
    inputBg: 'bg-[#2b0c0c] border-red-400/80 text-red-100',
  },
  WATER: {
    bg: 'bg-[#122842]', // Xanh dương
    border: 'border-blue-400',
    text: 'text-blue-200',
    badge: 'bg-blue-600 text-white font-bold border-blue-300',
    inputBg: 'bg-[#0c1a2b] border-blue-400/80 text-blue-100',
  },
  WOOD: {
    bg: 'bg-[#133b19]', // Xanh lá
    border: 'border-green-400',
    text: 'text-green-200',
    badge: 'bg-green-600 text-white font-bold border-green-300',
    inputBg: 'bg-[#0d2610] border-green-400/80 text-green-100',
  },
  METAL: {
    bg: 'bg-[#47340c]', // Vàng đậm
    border: 'border-amber-400',
    text: 'text-amber-200',
    badge: 'bg-amber-500 text-amber-950 font-extrabold border-amber-300',
    inputBg: 'bg-[#2e2208] border-amber-400/80 text-amber-100',
  },
  EARTH: {
    bg: 'bg-[#26150b]', // Nâu đậm
    border: 'border-[#8c4e24]',
    text: 'text-amber-100',
    badge: 'bg-[#5c3114] text-amber-100 font-bold border-[#8c4b20]',
    inputBg: 'bg-[#190e07] border-[#7d441e] text-amber-100',
  },
  STAR: {
    bg: 'bg-[#3b2b20]', // Nâu nhạt
    border: 'border-[#a87a5a]',
    text: 'text-orange-100',
    badge: 'bg-[#7a563e] text-amber-50 font-bold border-[#b08261]',
    inputBg: 'bg-[#281d15] border-[#8a6348] text-orange-100',
  },
};

const SpellCardBulletsForm = ({ bullet, bIndex, onChange }) => {
  if (!bullet) return null;

  const handleChange = (field, value) => {
    onChange({
      ...bullet,
      [field]: value,
      ...(field === 'bullet_type' ? { type: value } : {}),
      ...(field === 'element' ? { element_type: value, element_code: value } : {})
    });
  };

  const currentElement = (bullet.element || bullet.element_code || bullet.element_type || 'NO_ELEMENT')
    .toString()
    .toUpperCase()
    .replace(/\s+/g, '_');

  const currentBulletType = (bullet.bullet_type || bullet.type || 'NORMAL')
    .toString()
    .toUpperCase();

  const elemStyle = ELEMENT_STYLES[currentElement] || ELEMENT_STYLES.NO_ELEMENT;

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${elemStyle.bg} ${elemStyle.border} flex flex-col gap-3 shadow-lg`}>
      
      {/* HEADER LINE ĐẠN & BADGE NGUYÊN TỐ */}
      <div className="flex items-center justify-between border-b border-white/20 pb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${elemStyle.text}`}>Line Đạn {bIndex + 1}</span>
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border uppercase tracking-wider ${elemStyle.badge}`}>
            {currentElement}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-200 font-semibold">P Cost:</span>
          <input
            type="number"
            value={bullet.p_cost ?? 0}
            onChange={(e) => handleChange('p_cost', parseInt(e.target.value) || 0)}
            className={`w-12 border font-bold text-center rounded text-xs p-1 outline-none ${elemStyle.inputBg}`}
          />
        </div>
      </div>

      {/* CHỌN NGUYÊN TỐ VÀ LOẠI ĐẠN */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-200 font-bold mb-1">Nguyên Tố</label>
          <select
            value={ELEMENTS.includes(currentElement) ? currentElement : 'NO_ELEMENT'}
            onChange={(e) => handleChange('element', e.target.value)}
            className={`w-full border rounded px-2 py-1.5 text-xs font-bold transition-all outline-none ${elemStyle.inputBg}`}
          >
            {ELEMENTS.map(elem => (
              <option key={elem} value={elem} className="bg-[#18181c] text-white font-semibold">
                {elem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-gray-200 font-bold mb-1">Loại Đạn</label>
          <select
            value={BULLET_TYPES.includes(currentBulletType) ? currentBulletType : 'NORMAL'}
            onChange={(e) => handleChange('bullet_type', e.target.value)}
            className={`w-full border rounded px-2 py-1.5 text-xs font-bold outline-none ${elemStyle.inputBg}`}
          >
            {BULLET_TYPES.map(bt => (
              <option key={bt} value={bt} className="bg-[#18181c] text-white">
                {bt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* THÔNG SỐ ĐẠN */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-[10px] text-gray-200 font-semibold">Power</label>
          <input
            type="number"
            value={bullet.power ?? 0}
            onChange={(e) => handleChange('power', parseFloat(e.target.value) || 0)}
            className={`w-full border text-center rounded p-1 text-xs font-bold outline-none ${elemStyle.inputBg}`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-200 font-semibold">Acc (%)</label>
          <input
            type="number"
            value={bullet.accuracy ?? 80}
            onChange={(e) => handleChange('accuracy', parseFloat(e.target.value) || 0)}
            className={`w-full border text-center rounded p-1 text-xs font-bold outline-none ${elemStyle.inputBg}`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-200 font-semibold">Crit (%)</label>
          <input
            type="number"
            value={bullet.crit_rate ?? bullet.crit ?? 0}
            onChange={(e) => handleChange('crit', parseFloat(e.target.value) || 0)}
            className={`w-full border text-center rounded p-1 text-xs font-bold outline-none ${elemStyle.inputBg}`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-200 font-semibold">Số Lượng</label>
          <input
            type="number"
            value={bullet.bullet_count ?? bullet.count ?? 1}
            onChange={(e) => handleChange('count', parseInt(e.target.value) || 1)}
            className={`w-full border text-center rounded p-1 text-xs font-bold outline-none ${elemStyle.inputBg}`}
          />
        </div>
      </div>

      {/* KILLERS */}
      <div>
        <label className="block text-[10px] text-gray-200 font-semibold mb-1">Đặc Sát (Killers)</label>
        <input
          type="text"
          value={typeof bullet.killers === 'string' ? bullet.killers : (bullet.killers || []).join(', ')}
          onChange={(e) => handleChange('killers', e.target.value)}
          placeholder="VD: Human, Youkai, Spirit..."
          className={`w-full border rounded px-2 py-1 text-xs outline-none ${elemStyle.inputBg}`}
        />
      </div>
    </div>
  );
};

export default SpellCardBulletsForm;