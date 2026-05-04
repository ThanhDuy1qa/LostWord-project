import { Link } from 'react-router-dom';
import { useManageStoryCards } from '../hooks/useManageStoryCards';

const ManageStoryCards = () => {
  const {
    searchTerm, setSearchTerm, loading, message, filteredCards,sortOption, 
    setSortOption, handleDelete, handleOrderChangeLocal, handleOrderBlur
  } = useManageStoryCards();

  if (loading) return <div className="min-h-screen bg-[#0f0f12] text-white flex justify-center items-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-5 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-[#419ec0] font-serif">❖ Quản Lý Story Cards ❖</h2>
          <Link to="/admin" className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white py-2 px-4 rounded transition-colors">
            ⬅ Quay lại Dashboard
          </Link>
        </div>

        
        {message && (
          <div className={`mb-6 p-3 rounded text-center font-bold ${message.includes('✅') ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'}`}>
            {message}
          </div>
        )}
        
        {/* --- KHU VỰC TÌM KIẾM VÀ SẮP XẾP --- */}
        <div className="mb-6 flex gap-4 bg-[#1a1a20] p-4 rounded-xl border border-gray-700 shadow-lg items-center">
          
          <input type="text" placeholder="Tìm theo Tên hoặc Loại..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-[#0f0f12] border border-gray-600 rounded p-2.5 focus:border-[#419ec0] outline-none transition-colors text-white" />
          
          {/* SELECT BOX MỚI ĐỂ CHỌN KIỂU SẮP XẾP */}
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            className="bg-[#0f0f12] border border-gray-600 rounded p-2.5 focus:border-[#419ec0] outline-none text-white w-48"
          >
            <option value="order">Sắp xếp theo: Thứ tự</option>
            <option value="id">Sắp xếp theo: ID</option>
            <option value="name">Sắp xếp theo: Tên (A-Z)</option>
          </select>

          <Link to="/add-storycard" className="bg-[#c09641] hover:bg-[#a67d30] text-black font-bold py-2.5 px-6 rounded transition-colors whitespace-nowrap">
            + Thêm Thẻ Mới
          </Link>

        </div>

        <div className="bg-[#1a1a20] rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#25252d] border-b border-gray-600 text-gray-300 text-sm">
                  <th className="p-4 w-16 text-center">ID</th>
                  <th className="p-4 w-24 text-center">Ảnh</th>
                  <th className="p-4">Tên Story Card</th>
                  <th className="p-4 w-28 text-center">Độ Hiếm</th>
                  <th className="p-4 w-32">Loại (Type)</th>
                  <th className="p-4 w-24 text-center">Thứ Tự</th>
                  <th className="p-4 w-40 text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredCards.length > 0 ? (
                  filteredCards.map((card) => (
                    <tr key={card.storycard_id} className="hover:bg-[#202028] transition-colors">
                      <td className="p-4 text-center text-gray-400 font-mono">{card.storycard_id}</td>
                      <td className="p-4 text-center">
                        <div className="w-16 h-12 mx-auto bg-black rounded overflow-hidden border border-gray-600">
                          <img src={`${card.image_url}.webp`} alt={card.name} className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/64x48?text=Err'; }} />
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#e1c16e]">{card.name}</td>
                      <td className="p-4 text-center text-yellow-500">{'★'.repeat(card.rarity)}</td>
                      <td className="p-4 text-gray-300">{card.type}</td>
                      <td className="p-4 text-center">
                        <input type="number" value={card.sort_order ?? 999}
                          onChange={(e) => handleOrderChangeLocal(card.storycard_id, parseInt(e.target.value))}
                          onBlur={(e) => handleOrderBlur(card.storycard_id, parseInt(e.target.value))}
                          className="w-16 bg-[#0f0f12] border border-gray-600 text-center rounded p-1 focus:border-[#419ec0] outline-none text-yellow-500 font-mono" />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link to={`/edit-storycard/${card.storycard_id}`} className="bg-[#419ec0] hover:bg-[#2c728c] text-white px-3 py-1.5 rounded text-sm transition-colors">Sửa</Link>
                          <button onClick={() => handleDelete(card.storycard_id, card.name)} className="bg-red-600 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm transition-colors">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">Không tìm thấy Story Card nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStoryCards;