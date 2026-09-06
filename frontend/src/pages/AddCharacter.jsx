// src/components/AddCharacter.jsx
import { useAddCharacter } from '../hooks/useAddCharacter';

const AddCharacter = () => {
  const { 
    formData, message, showSuggestions, filteredNames,
    setShowSuggestions, handleChange, handleSelectName, handleSubmit 
  } = useAddCharacter();

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-center">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold text-[#c09641] mb-6 text-center font-serif">
          ❖ Thêm Nhân Vật Mới ❖
        </h2>
        
        {message && <div className="mb-4 text-center font-bold text-green-400">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 🌟 1. Ô Nhập Tên có Gợi Ý */}
          <div className="relative">
            <label className="block text-gray-400 mb-1 text-sm">Tên Nhân Vật (Name)</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              autoComplete="off"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none transition-colors" 
            />

            {/* Menu Gợi Ý Dropdown */}
            {showSuggestions && formData.name && filteredNames.length > 0 && (
              <ul className="absolute z-50 w-full bg-[#25252d] border border-gray-600 mt-1 max-h-48 overflow-y-auto rounded shadow-xl">
                {filteredNames.map((n, index) => (
                  <li 
                    key={index} 
                    onMouseDown={() => handleSelectName(n)}
                    className="p-2 hover:bg-[#c09641] hover:text-black cursor-pointer transition-colors border-b border-gray-700 last:border-none"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-4">
            {/* Chọn Rarity Code */}
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-sm">Độ Hiếm (Rarity)</label>
              <select name="rarity_code" value={formData.rarity_code} onChange={handleChange}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none">
                <option value="GENERAL">General</option>
                <option value="FES">Festival (Fes)</option>
                <option value="UFES">Ultra Festival (UFes)</option>
                <option value="RFES">Relic Festival (RFes)</option>
                <option value="EPIC">Epic</option>
                <option value="GENIC">Genic</option>
                <option value="EXFes">EX Festival</option>
                <option value="YUKKURI">Yukkuri</option>
                <option value="PURE">PURE Festival</option>
              </select>
            </div>

            {/* Chọn Universe */}
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-sm">Vũ Trụ (Universe)</label>
              <input type="text" name="universe" value={formData.universe} onChange={handleChange} required placeholder="Ví dụ: L1, B3, A6"
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none transition-colors" />
            </div>
          </div>

          {/* Chọn Role */}
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Vai Trò (Role)</label>
            <select name="role" value={formData.role} onChange={handleChange}
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none">
              <option value="Attack">Attack</option>
              <option value="Defense">Defense</option>
              <option value="Support">Support</option>
              <option value="Heal">Heal</option>
              <option value="Speed">Speed</option>
              <option value="Destroy">Destroy</option>
              <option value="Technical">Technical</option>
              <option value="Debuff">Debuff</option>
            </select>
          </div>

          {/* Nhập URL ảnh */}
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Đường Dẫn Ảnh DB (Image URL)</label>
            <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required placeholder="/image/friend/Reimu"
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none transition-colors" />
          </div>

          <button type="submit" className="w-full bg-[#c09641] hover:bg-[#8a6822] text-black font-bold py-2.5 px-4 rounded transition-colors mt-6">
            Lưu Nhân Vật
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCharacter;