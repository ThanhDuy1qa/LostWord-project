import { useAddStoryCard } from '../hooks/useAddStoryCard';

const AddStoryCard = () => {
  const { formData, message, handleChange, handleSubmit } = useAddStoryCard();

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8 flex justify-center items-center">
      <div className="bg-[#1a1a20] p-8 rounded-xl border border-gray-700 w-full max-w-lg shadow-2xl">
        <h2 className="text-2xl font-bold text-[#c09641] mb-6 text-center font-serif">
          ❖ Thêm Story Card Mới ❖
        </h2>
        
        {message && <div className="mb-4 text-center font-bold text-green-400">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nhập Tên */}
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Tên Thẻ (Name)</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none transition-colors" />
          </div>

          <div className="flex gap-4">
            {/* Chọn Số Sao */}
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-sm">Độ hiếm (Rarity)</label>
              <select name="rarity" value={formData.rarity} onChange={handleChange}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none">
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num} Sao</option>
                ))}
              </select>
            </div>

            {/* Chọn Type */}
            <div className="flex-1">
              <label className="block text-gray-400 mb-1 text-sm">Loại (Type)</label>
              <select name="type" value={formData.type} onChange={handleChange}
                className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none">
                <option value="Bamboo">Bamboo</option>
                <option value="Orchid">Orchid</option>
                <option value="Chrysanthemum">Chrysanthemum</option>
                <option value="Plum">Plum</option>
              </select>
            </div>
          </div>

          {/* Nhập URL ảnh */}
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Đường dẫn ảnh (Image URL)</label>
            <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} required
              className="w-full bg-[#0f0f12] border border-gray-600 rounded p-2 focus:border-[#c09641] outline-none transition-colors" />
          </div>

          <button type="submit" className="w-full bg-[#c09641] hover:bg-[#8a6822] text-black font-bold py-2.5 px-4 rounded transition-colors mt-6">
            Lưu Story Card
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStoryCard;