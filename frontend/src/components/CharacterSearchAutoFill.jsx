import React, { useState, useMemo, useRef, useEffect } from 'react';

// Nạp các file JSON nhân vật từ thư mục data
const jsonModules = import.meta.glob('/src/data/data_characters/*.json', { eager: true });

const characterList = Object.entries(jsonModules).map(([path, module]) => {
  const data = module.default || module;

  // Tách thông tin từ tên file (VD: B3_Watatsuki_no_Toyohime_rebirth.json)
  const fileName = path.split('/').pop().replace(/\.json$/i, '');
  const parts = fileName.split('_');

  const fallbackCode = parts[0] || 'N/A';
  let nameParts = parts.slice(1);
  let isRebirth = false;

  if (nameParts.length > 0 && nameParts[nameParts.length - 1].toLowerCase() === 'rebirth') {
    isRebirth = true;
    nameParts.pop();
  }

  let fullParsedName = nameParts.join(' ');
  if (!fullParsedName) fullParsedName = fileName;
  if (isRebirth) fullParsedName += ' (Rebirth)';

  const displayCode = data.code || data.universe || data.character_code || fallbackCode;
  const displayName = data.name || data.character_name || data.chara_name || fullParsedName;

  return {
    ...data,
    _filePath: path,
    displayCode,
    displayName,
  };
});

const CharacterSearchAutoFill = ({ onSelectCharacter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 🌟 CLICK OUTSIDE: Tự động ẩn khung gợi ý khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Lọc danh sách theo Code hoặc Tên nhân vật trong cùng 1 ô
  const filteredCharacters = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return characterList.slice(0, 15);

    return characterList.filter((char) => {
      const matchCode = String(char.displayCode).toLowerCase().includes(term);
      const matchName = String(char.displayName).toLowerCase().includes(term);
      return matchCode || matchName;
    });
  }, [searchTerm]);

  const handleSelect = (selectedChar) => {
    setSearchTerm(`[${selectedChar.displayCode}] ${selectedChar.displayName}`);
    setIsOpen(false);

    if (onSelectCharacter) {
      onSelectCharacter(selectedChar);
    }
  };

  return (
    <div ref={containerRef} className="relative bg-[#1d1d24] p-4 rounded-lg border border-gray-700 mb-6 z-30">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-bold text-cyan-400">
          🔍 Tìm kiếm & Tự động điền dữ liệu (JSON Local)
        </h3>
        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">
          Đã nạp: {characterList.length} nhân vật
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Nhập Code hoặc Tên nhân vật (VD: B3, Seija, Toyohime...)"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2.5 text-white text-sm focus:border-cyan-500 outline-none"
        />

        {isOpen && filteredCharacters.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-2 bg-[#18181c] border border-cyan-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto divide-y divide-gray-800">
            {filteredCharacters.map((item, idx) => (
              <li
                key={item._filePath || idx}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-[#252530] cursor-pointer flex items-center justify-between text-sm transition-colors"
              >
                <div>
                  <p className="font-bold text-amber-300">{item.displayName}</p>
                  <p className="text-xs text-gray-400">
                    Code/Universe: <span className="text-cyan-400 font-semibold">{item.displayCode}</span>
                  </p>
                </div>
                <span className="text-xs bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded border border-cyan-700 font-semibold">
                  Điền dữ liệu
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CharacterSearchAutoFill;