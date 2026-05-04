import { getCharacterImageUrl } from '../utils/characterUtils';
import { useEditCharacter } from '../hooks/useEditCharacter';

const EditCharacter = () => {
  const {
    formData, message, loading, currentIndex, allFriendsList, showSuggestions,
    originalImageUrl, saveAction, filteredNames,
    setSaveAction, setShowSuggestions, handleNavigate, handleChange, handleSelectName, handleSubmit, navigate
  } = useEditCharacter();

  if (loading) return <div className="text-white text-center mt-20">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-center">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-5xl shadow-2xl flex flex-col md:flex-row gap-8">
        
        {/* CỘT TRÁI */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-between">
          <div className="w-full">
            <div className="w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border-2 border-gray-600 shadow-lg relative">
              <img 
                src={getCharacterImageUrl(formData.universe, originalImageUrl || formData.image_url)} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x400?text=No+Image'; }}
              />
              <div className="absolute bottom-0 left-0 w-full bg-black/70 text-center text-xs py-2 px-1 font-mono text-gray-300 break-all">
                {originalImageUrl}.webp
              </div>
            </div>
            <p className="mt-4 text-center text-[#419ec0] font-bold tracking-widest font-serif">{formData.universe}</p>
          </div>

          <div className="flex w-full justify-between mt-6 gap-2">
            <button 
              onClick={() => handleNavigate('prev')}
              disabled={currentIndex <= 0}
              type="button"
              className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1"
            >
              ⬅ Trước
            </button>
            <button 
              onClick={() => handleNavigate('next')}
              disabled={currentIndex === -1 || currentIndex >= allFriendsList.length - 1}
              type="button"
              className="px-3 py-2 bg-gray-800 hover:bg-[#419ec0] disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors flex-1"
            >
              Sau ➡
            </button>
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#419ec0] mb-6 text-center font-serif">
            ❖ Chỉnh Sửa Nhân Vật ❖
          </h2>
          
          {message && <div className="mb-4 text-center font-bold text-yellow-400">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-gray-400 mb-1 text-sm">Tên Nhân Vật (Name)</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required autoComplete="off"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none" />
              
              {showSuggestions && formData.name && filteredNames.length > 0 && (
                <ul className="absolute z-50 w-full bg-[#25252d] border border-gray-600 mt-1 max-h-48 overflow-y-auto rounded shadow-xl">
                  {filteredNames.map((n, index) => (
                    <li key={index} onMouseDown={() => handleSelectName(n)}
                      className="p-2 hover:bg-[#419ec0] hover:text-white cursor-pointer transition-colors border-b border-gray-700 last:border-none">
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-400 mb-1 text-sm">Độ Hiếm</label>
                <select name="rarity_code" value={formData.rarity_code} onChange={handleChange}
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none">
                  <option value="GENERAL">General</option>
                  <option value="FES">Festival (Fes)</option>
                  <option value="UFES">Ultra Festival (UFes)</option>
                  <option value="RFES">Relic Festival (RFes)</option>
                  <option value="EPIC">Epic</option>
                  <option value="GENIC">Genic</option>
                  <option value="EXFes">EX Festival</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-400 mb-1 text-sm">Vũ Trụ</label>
                <input type="text" name="universe" value={formData.universe} onChange={handleChange} required
                  className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 text-sm">Vai Trò</label>
              <select name="role" value={formData.role} onChange={handleChange}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] outline-none">
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

            <div>
              <label className="block text-gray-400 mb-1 text-sm">Đường Dẫn Ảnh Mới (Tự cập nhật)</label>
              <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#419ec0] text-gray-300 outline-none" />
            </div>

            <div className="flex justify-center gap-6 mt-6 border-t border-gray-700 pt-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#419ec0] transition-colors text-gray-300">
                <input type="radio" name="saveAction" value="next"
                  checked={saveAction === 'next'} onChange={(e) => setSaveAction(e.target.value)}
                  className="accent-[#419ec0] w-4 h-4" />
                Lưu xong qua NV kế tiếp
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-[#419ec0] transition-colors text-gray-300">
                <input type="radio" name="saveAction" value="list"
                  checked={saveAction === 'list'} onChange={(e) => setSaveAction(e.target.value)}
                  className="accent-[#419ec0] w-4 h-4" />
                Lưu xong về Quản lý
              </label>
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" onClick={() => navigate('/manage-characters')} className="w-1/3 border border-gray-500 hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded transition-colors">
                Hủy
              </button>
              <button type="submit" className="w-2/3 bg-[#419ec0] hover:bg-[#2c728c] text-white font-bold py-2.5 px-4 rounded transition-colors shadow-lg shadow-[#419ec0]/20">
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCharacter;