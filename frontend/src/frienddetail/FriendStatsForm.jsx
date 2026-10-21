import React from 'react';

const FriendStatsForm = ({ stats = {}, onChange }) => {
  const statList = [
    { key: 'hp', label: 'HP' },
    { key: 'yang_atk', label: 'Yang ATK' },
    { key: 'yin_atk', label: 'Yin ATK' },
    { key: 'yang_def', label: 'Yang DEF' },
    { key: 'yin_def', label: 'Yin DEF' },
    { key: 'agility', label: 'Agility' },
  ];

  const handleStatChange = (key, value) => {
    onChange({
      ...stats,
      [key]: parseInt(value) || 0
    });
  };

  return (
    <div className="bg-[#1d1d24] p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-bold text-amber-400 mb-3 flex items-center gap-2">
        📊 Chỉ Số Cơ Bản (Character Stats)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statList.map(({ key, label }) => (
          <div key={key} className="bg-[#121216] p-2 rounded border border-gray-800">
            <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">
              {label}
            </label>
            <input
              type="number"
              value={stats[key] ?? 0}
              onChange={(e) => handleStatChange(key, e.target.value)}
              className="w-full bg-[#0f0f12] border border-gray-700 rounded p-1.5 text-center text-amber-300 font-bold text-sm outline-none focus:border-amber-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendStatsForm;