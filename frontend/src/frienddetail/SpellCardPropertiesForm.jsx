import React from 'react';
import EffectRowItem from './EffectRowItem';
import { matchDictItem } from '../hooks/useEditFriendDetail';

const PROPERTY_PRESETS = [
  // 1. Tỷ lệ Scale & % Máu
  { key: 'SLICE', label: '[Slice] Agility Scale', template: (v) => `[Slice]: ${v}% Agility Scale`, defaultVal: '100' },
  { key: 'HARD', label: '[Hard] DEF Scale', template: (v) => `[Hard]: ${v}% DEF Scale`, defaultVal: '100' },
  { key: 'REBOUND', label: '[Rebound] Consumes HP %', template: (v) => `[Rebound]: Consumes ${v}% of max HP`, defaultVal: '50' },
  { key: 'ABSORB', label: '[Absorb] Recovers HP %', template: (v) => `[Absorb]: Recovers ${v}% of max HP`, defaultVal: '10' },

  // 2. Hiệu ứng Bảng Effect (Status Buff)
  { key: 'STATUS_BUFF', label: '✦ Status Buff' },

  // 3. Barrier Anomaly & Impact
  { key: 'BARRIER_ANOMALY', label: 'Bùa Barrier Anomaly (Poison, Burn...)' },
  { key: 'IMPACT', label: 'Hiệu ứng Impact' },

  // 4. Hiệu ứng Đặc biệt của Đạn
  { key: 'EXPLOSIVE', label: '[Explosive] CRIT scaling enemy DEF', template: () => `[Explosive]: Higher CRIT chance scaling with enemy DEF` },
  { key: 'PRECISE', label: '[Precise] CRIT scaling enemy Agility', template: () => `[Precise]: Higher CRIT chance scaling with enemy Agility` },
  { key: 'SPECULAR', label: '[Specular] Attacks opposite DEF type', template: () => `[Specular]: Attacks opposite DEF type` },
  { key: 'PIERCING', label: '[Piercing] Ignores DEF modifiers', template: () => `[Piercing]: Ignores DEF modifiers` },
  { key: 'SURE_HIT', label: '[Sure-Hit] Always hits', template: () => `[Sure-Hit]: Always hits` },

  // 5. Phá Bùa (Breakers)
  { key: 'INCINERATION', label: '[Incineration] Breaks Burn', template: () => `[Incineration]: Breaks Burn` },
  { key: 'DISCHARGE', label: '[Discharge] Breaks Paralyze', template: () => `[Discharge]: Breaks Paralyze` },
  { key: 'MELTING', label: '[Melting] Breaks Freeze', template: () => `[Melting]: Breaks Freeze` },
  { key: 'TOXIC', label: '[Toxic] Breaks Poison', template: () => `[Toxic]: Breaks Poison` },
  { key: 'FLASH', label: '[Flash] Breaks Blind', template: () => `[Flash]: Breaks Blind` },

  // 6. Custom
  { key: 'CUSTOM', label: 'Tùy chỉnh tự do...' },
];

const TARGET_OPTIONS = ['Target', 'Self', 'Allies', 'Enemies'];
const ANOMALY_OPTIONS = ['Poisons', 'Paralyzes', 'Burns', 'Freezes', 'Blinds'];

function capitalize(str) {
  if (!str) return 'Target';
  const lower = str.toLowerCase();
  if (lower === 'self') return 'Self';
  if (lower === 'allies') return 'Allies';
  if (lower === 'enemies') return 'Enemies';
  return 'Target';
}

// Phân tích property để phân loại chính xác
const parsePropItem = (prop, effectDict = []) => {
  if (!prop) return { type: 'CUSTOM', val: '' };

  // 1. Trường hợp prop đã là một Effect Object (được quản lý bởi EffectRowItem)
  if (typeof prop === 'object' && prop !== null) {
    if (prop.type && prop.type !== 'STATUS_BUFF') {
      return prop;
    }
    return { type: 'STATUS_BUFF', effObj: prop };
  }

  const str = String(prop).trim();
  const lowerStr = str.toLowerCase();

  // 2. Scale % (Slice / Hard / Rebound / Absorb)
  if (lowerStr.startsWith('[slice]')) {
    const match = str.match(/\d+(?:\.\d+)?/);
    return { type: 'SLICE', val: match ? match[0] : '100' };
  }
  if (lowerStr.startsWith('[hard]')) {
    const match = str.match(/\d+(?:\.\d+)?/);
    return { type: 'HARD', val: match ? match[0] : '100' };
  }
  if (lowerStr.startsWith('[rebound]')) {
    const match = str.match(/\d+(?:\.\d+)?/);
    return { type: 'REBOUND', val: match ? match[0] : '50' };
  }
  if (lowerStr.startsWith('[absorb]')) {
    const match = str.match(/\d+(?:\.\d+)?/);
    return { type: 'ABSORB', val: match ? match[0] : '10' };
  }

  // 3. Hiệu ứng đặc biệt (Specials)
  if (lowerStr.startsWith('[explosive]')) return { type: 'EXPLOSIVE' };
  if (lowerStr.startsWith('[precise]')) return { type: 'PRECISE' };
  if (lowerStr.startsWith('[specular]')) return { type: 'SPECULAR' };
  if (lowerStr.startsWith('[piercing]')) return { type: 'PIERCING' };
  if (lowerStr.startsWith('[sure-hit]')) return { type: 'SURE_HIT' };

  // 4. Phá bùa (Breakers)
  if (lowerStr.startsWith('[incineration]')) return { type: 'INCINERATION' };
  if (lowerStr.startsWith('[discharge]')) return { type: 'DISCHARGE' };
  if (lowerStr.startsWith('[melting]')) return { type: 'MELTING' };
  if (lowerStr.startsWith('[toxic]')) return { type: 'TOXIC' };
  if (lowerStr.startsWith('[flash]')) return { type: 'FLASH' };

// 5. Impact (Dùng dấu pipe | chuẩn)
  if (lowerStr.includes('impact') && /^\[\s*(target|self|allies|enemies)\s*\]/i.test(str)) {
    const targetMatch = str.match(/^\[\s*(target|self|allies|enemies)\s*\]/i);
    const turnMatch = str.match(/\(\s*(\d+)\s*turns?\s*\)/i);
    return {
      type: 'IMPACT',
      target: targetMatch ? capitalize(targetMatch[1]) : 'Target',
      turns: turnMatch ? turnMatch[1] : '1'
    };
  }

  // 6. Barrier Anomaly (Dùng dấu pipe | chuẩn)
  const anomalyMatch = str.match(/^\[\s*(target|self|allies|enemies)\s*\]\s*(poisons|paralyzes|burns|freezes|blinds)\s*([\d.]+)\s*barrier\(?s\)?\s*\(\s*(\d+)\s*turns?\s*\)/i);
  if (anomalyMatch) {
    return {
      type: 'BARRIER_ANOMALY',
      target: capitalize(anomalyMatch[1]),
      anomaly: capitalize(anomalyMatch[2]),
      count: anomalyMatch[3],
      turns: anomalyMatch[4]
    };
  }

  // 7. Nhận diện Status Buff / Debuff (Dùng dấu pipe | chuẩn)
  const isTargetTagPattern = /^\[\s*(target|self|allies|enemies|party|field)\s*\]/i.test(str);

  if (isTargetTagPattern) {
    const matchedEff = matchDictItem(str, effectDict);
    return { type: 'STATUS_BUFF', effObj: matchedEff };
  }

  return { type: 'CUSTOM', val: str };
};
const SpellCardPropertiesForm = ({ bullet = {}, bIndex, effectDict = [], onChange }) => {
  const properties = Array.isArray(bullet.properties) ? bullet.properties : [];

  const handlePropertyChange = (pIndex, newVal) => {
    const updatedProps = [...properties];
    updatedProps[pIndex] = newVal;
    onChange({ ...bullet, properties: updatedProps });
  };

  const handlePresetSelect = (pIndex, newType) => {
    const preset = PROPERTY_PRESETS.find((p) => p.key === newType);
    if (!preset) return;

    if (newType === 'STATUS_BUFF') {
      const defaultEff = matchDictItem('[Self] Evasion +1.0 (2 turns)', effectDict);
      handlePropertyChange(pIndex, defaultEff);
      return;
    }

    let newText = '';
    if (['SLICE', 'HARD', 'REBOUND', 'ABSORB'].includes(newType)) {
      newText = preset.template(preset.defaultVal);
    } else if (newType === 'BARRIER_ANOMALY') {
      newText = '[Target] Poisons 0.30 Barrier(s) (3 turns)';
    } else if (newType === 'IMPACT') {
      newText = '[Target] Impact (1 turn)';
    } else if (newType === 'CUSTOM') {
      newText = '';
    } else {
      newText = preset.template();
    }

    handlePropertyChange(pIndex, newText);
  };

  const addProperty = () => {
    onChange({
      ...bullet,
      properties: [...properties, '[Sure-Hit]: Always hits'],
    });
  };

  const removeProperty = (pIndex) => {
    const updatedProps = properties.filter((_, i) => i !== pIndex);
    onChange({ ...bullet, properties: updatedProps });
  };

  return (
    <div className="mt-3 bg-[#111116] p-3 rounded-lg border border-gray-800 flex flex-col gap-2.5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
          ✦ Hiệu ứng / Properties Đạn Line {bIndex + 1}
        </span>
        <button
          type="button"
          onClick={addProperty}
          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-800/80 px-2 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 transition-all"
        >
          + Thêm Property
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {properties.map((prop, pIdx) => {
          const parsed = parsePropItem(prop, effectDict);

          return (
            <div key={pIdx} className="flex flex-wrap items-center gap-2 bg-[#181820] p-2 rounded border border-gray-700/60">
              
              {/* SELECT LOẠI PROPERTY */}
              <select
                value={parsed.type}
                onChange={(e) => handlePresetSelect(pIdx, e.target.value)}
                className="bg-[#0f0f12] border border-gray-600 text-cyan-300 text-xs font-bold rounded p-1.5 outline-none min-w-[170px]"
              >
                {PROPERTY_PRESETS.map((p) => (
                  <option key={p.key} value={p.key} className="bg-[#18181c] text-white">
                    {p.label}
                  </option>
                ))}
              </select>

              {/* 1. HIỆU ỨNG THUỘC BẢNG EFFECT (STATUS BUFF) */}
              {parsed.type === 'STATUS_BUFF' && (
                <div className="flex-grow min-w-[280px]">
                  <EffectRowItem
                    eff={parsed.effObj || matchDictItem(prop, effectDict)}
                    effectDict={effectDict}
                    onChange={(updatedEff) => handlePropertyChange(pIdx, updatedEff)}
                    onRemove={() => removeProperty(pIdx)}
                  />
                </div>
              )}

              {/* 2. CÁC HIỆU ỨNG SCALE % (SLICE, HARD, REBOUND, ABSORB) */}
              {['SLICE', 'HARD', 'REBOUND', 'ABSORB'].includes(parsed.type) && (
                <div className="flex items-center gap-1.5 bg-[#0f0f12] border border-amber-500/80 px-2 py-1 rounded">
                  <span className="text-[11px] text-amber-300 font-semibold">Gia trị (%):</span>
                  <input
                    type="number"
                    step="any"
                    value={parsed.val || '100'}
                    onChange={(e) => {
                      const preset = PROPERTY_PRESETS.find((p) => p.key === parsed.type);
                      handlePropertyChange(pIdx, preset.template(e.target.value));
                    }}
                    className="w-16 bg-transparent text-white font-bold text-xs outline-none text-center"
                  />
                </div>
              )}

              {/* 3. BARRIER ANOMALY */}
              {parsed.type === 'BARRIER_ANOMALY' && (
                <div className="flex flex-wrap items-center gap-1.5 bg-[#0f0f12] p-1 rounded border border-purple-500/50">
                  <select
                    value={parsed.target}
                    onChange={(e) => {
                      const text = `[${e.target.value}] ${parsed.anomaly} ${parsed.count} Barrier(s) (${parsed.turns} turns)`;
                      handlePropertyChange(pIdx, text);
                    }}
                    className="bg-[#18181c] text-amber-300 font-bold text-xs p-1 rounded outline-none"
                  >
                    {TARGET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <select
                    value={parsed.anomaly}
                    onChange={(e) => {
                      const text = `[${parsed.target}] ${e.target.value} ${parsed.count} Barrier(s) (${parsed.turns} turns)`;
                      handlePropertyChange(pIdx, text);
                    }}
                    className="bg-[#18181c] text-purple-300 font-bold text-xs p-1 rounded outline-none"
                  >
                    {ANOMALY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>

                  <input
                    type="number"
                    step="any"
                    value={parsed.count}
                    onChange={(e) => {
                      const text = `[${parsed.target}] ${parsed.anomaly} ${e.target.value} Barrier(s) (${parsed.turns} turns)`;
                      handlePropertyChange(pIdx, text);
                    }}
                    placeholder="0.30"
                    className="w-14 bg-[#181820] text-center text-purple-200 font-bold text-xs p-1 rounded outline-none"
                  />
                  <span className="text-gray-400 text-xs">Barrier(s)</span>

                  <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                    <span>(</span>
                    <input
                      type="number"
                      value={parsed.turns}
                      onChange={(e) => {
                        const text = `[${parsed.target}] ${parsed.anomaly} ${parsed.count} Barrier(s) (${e.target.value} turns)`;
                        handlePropertyChange(pIdx, text);
                      }}
                      className="w-10 bg-[#181820] text-center text-white font-bold text-xs p-1 rounded outline-none"
                    />
                    <span>turns)</span>
                  </div>
                </div>
              )}

              {/* 4. IMPACT */}
              {parsed.type === 'IMPACT' && (
                <div className="flex items-center gap-1.5 bg-[#0f0f12] p-1 rounded border border-red-500/50">
                  <select
                    value={parsed.target}
                    onChange={(e) => {
                      const text = `[${e.target.value}] Impact (${parsed.turns} turn${Number(parsed.turns) > 1 ? 's' : ''})`;
                      handlePropertyChange(pIdx, text);
                    }}
                    className="bg-[#18181c] text-amber-300 font-bold text-xs p-1 rounded outline-none"
                  >
                    {TARGET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <span className="text-red-400 font-bold text-xs">Impact</span>

                  <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                    <span>(</span>
                    <input
                      type="number"
                      value={parsed.turns}
                      onChange={(e) => {
                        const turnsVal = e.target.value;
                        const text = `[${parsed.target}] Impact (${turnsVal} turn${Number(turnsVal) > 1 ? 's' : ''})`;
                        handlePropertyChange(pIdx, text);
                      }}
                      className="w-10 bg-[#181820] text-center text-white font-bold text-xs p-1 rounded outline-none"
                    />
                    <span>turn)</span>
                  </div>
                </div>
              )}

              {/* 5. CUSTOM TRỰC TIẾP */}
              {parsed.type === 'CUSTOM' && (
                <input
                  type="text"
                  value={typeof prop === 'string' ? prop : prop?.effect_text || ''}
                  onChange={(e) => handlePropertyChange(pIdx, e.target.value)}
                  placeholder="Nhập tùy chỉnh..."
                  className="flex-grow bg-[#0f0f12] border border-gray-600 text-amber-200 text-xs rounded p-1.5 outline-none"
                />
              )}

              {/* BẢN XEM TRƯỚC VĂN BẢN (CHO CÁC DẠNG PRESET KHÔNG PHẢI CUSTOM / STATUS_BUFF) */}
              {parsed.type !== 'CUSTOM' && parsed.type !== 'STATUS_BUFF' && (
                <span className="flex-grow text-[11px] text-gray-300 font-mono italic truncate bg-[#0f0f12] px-2 py-1 rounded border border-gray-800">
                  {typeof prop === 'string' ? prop : prop?.effect_text || ''}
                </span>
              )}

              {/* NÚT XÓA (NẾU KHÔNG PHẢI STATUS_BUFF) */}
              {parsed.type !== 'STATUS_BUFF' && (
                <button
                  type="button"
                  onClick={() => removeProperty(pIdx)}
                  className="text-red-400 hover:text-red-300 font-bold px-1.5 py-0.5 text-xs bg-red-950/40 rounded border border-red-800/60 ml-auto"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {properties.length === 0 && (
          <span className="text-[11px] text-gray-500 italic py-1">Chưa có property nào cho dòng đạn này.</span>
        )}
      </div>
    </div>
  );
};

export default SpellCardPropertiesForm;