import React from 'react';
import EffectRowItem from './EffectRowItem';

const SpellCardHeaderForm = ({ spellCard = {}, scIndex, effectDict = [], onChange }) => {
  const handleFieldChange = (field, value) => {
    onChange({
      ...spellCard,
      [field]: value
    });
  };

  const addEffect = (type) => {
    const field = type === 'PRE' ? 'pre_effects' : 'post_effects';
    const currentList = Array.isArray(spellCard[field]) ? spellCard[field] : [];
    
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

    onChange({
      ...spellCard,
      [field]: [...currentList, newEffect]
    });
  };

  const updateEffect = (type, eIndex, updatedEff) => {
    const field = type === 'PRE' ? 'pre_effects' : 'post_effects';
    const currentList = [...(spellCard[field] || [])];
    currentList[eIndex] = updatedEff;
    
    onChange({
      ...spellCard,
      [field]: currentList
    });
  };

  const removeEffect = (type, eIndex) => {
    const field = type === 'PRE' ? 'pre_effects' : 'post_effects';
    const currentList = (spellCard[field] || []).filter((_, i) => i !== eIndex);
    
    onChange({
      ...spellCard,
      [field]: currentList
    });
  };

  return (
    <div className="bg-[#121216] p-4 rounded-lg border border-gray-800 flex flex-col gap-5">
      
      {/* TÊN SPELL CARD & TARGET TYPE (ĐÃ BỎ CHECKBOX LAST WORD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-700/80 pb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Tên Spell Card</label>
          <input
            type="text"
            value={spellCard.card_title || spellCard.title || spellCard.name || ''}
            onChange={(e) => handleFieldChange('card_title', e.target.value)}
            className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 text-cyan-400 font-bold text-sm outline-none focus:border-cyan-500"
            placeholder="Nhập tên Spell Card..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Phạm Vi (Target Type)</label>
          <select
            value={spellCard.target_type || 'Solo'}
            onChange={(e) => handleFieldChange('target_type', e.target.value)}
            className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 text-amber-300 font-bold text-sm outline-none cursor-pointer"
          >
            <option value="Solo">SOLO (Đơn thể)</option>
            <option value="All">ALL (Toàn thể)</option>
          </select>
        </div>
      </div>

      {/* HIỆU ỨNG TÁCH DỌC THÀNH 2 KHỐI RIÊNG BIỆT (XẾP CHỒNG LÊN NHAU) */}
      <div className="flex flex-col gap-5">
        
        {/* PRE-ATTACK EFFECTS */}
        <div className="bg-[#181820] p-3.5 rounded-lg border border-amber-900/60">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
            ✦ Pre-Attack Effects (Hiệu ứng trước khi đánh)
          </h4>
          <div className="flex flex-col gap-2.5">
            {(spellCard.pre_effects || []).map((eff, eIdx) => (
              <EffectRowItem
                key={`pre-${eIdx}`}
                eff={eff}
                effectDict={effectDict}
                onChange={(val) => updateEffect('PRE', eIdx, val)}
                onRemove={() => removeEffect('PRE', eIdx)}
              />
            ))}
            <button
              type="button"
              onClick={() => addEffect('PRE')}
              className="mt-1 text-xs text-amber-400 hover:text-amber-300 font-semibold border border-amber-800/60 rounded px-2.5 py-1.5 w-max bg-amber-950/30 hover:bg-amber-900/50 transition-all"
            >
              + Thêm Pre-Effect
            </button>
          </div>
        </div>

        {/* POST-ATTACK EFFECTS */}
        <div className="bg-[#181820] p-3.5 rounded-lg border border-purple-900/60">
          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">
            ✦ Post-Attack Effects (Hiệu ứng sau khi đánh)
          </h4>
          <div className="flex flex-col gap-2.5">
            {(spellCard.post_effects || []).map((eff, eIdx) => (
              <EffectRowItem
                key={`post-${eIdx}`}
                eff={eff}
                effectDict={effectDict}
                onChange={(val) => updateEffect('POST', eIdx, val)}
                onRemove={() => removeEffect('POST', eIdx)}
              />
            ))}
            <button
              type="button"
              onClick={() => addEffect('POST')}
              className="mt-1 text-xs text-purple-400 hover:text-purple-300 font-semibold border border-purple-800/60 rounded px-2.5 py-1.5 w-max bg-purple-950/30 hover:bg-purple-900/50 transition-all"
            >
              + Thêm Post-Effect
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SpellCardHeaderForm;