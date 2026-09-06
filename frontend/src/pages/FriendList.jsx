// src/pages/FriendList.jsx
import FriendCard from '../components/FriendCard';
import { useFriends } from '../hooks/useFriends';

const FriendList = () => {
  const { filteredFriends, searchTerm, setSearchTerm, loading } = useFriends();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white flex justify-center items-center text-xl">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-5">
      <h1 className="text-3xl font-bold text-center text-yellow-500 mb-6 uppercase tracking-widest">
        LostWord Characters
      </h1>

      {/* Thanh Tìm Kiếm */}
      <div className="max-w-md mx-auto mb-8 px-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Nhập tên nhân vật..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a20] border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors shadow-lg shadow-black/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid render 100% dữ liệu. Nhờ CSS content-visibility ở FriendCard,
          trình duyệt sẽ tự động tối ưu hóa tài nguyên như một danh sách ảo. */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-4">
        {filteredFriends.map((friend) => (
          <FriendCard key={friend.friend_id} friend={friend} />
        ))}
      </div>

      {filteredFriends.length === 0 && (
        <div className="text-center text-gray-400 mt-10 text-lg">
          Không tìm thấy nhân vật "<span className="text-yellow-500 font-bold">{searchTerm}</span>"
        </div>
      )}
    </div>
  );
};

export default FriendList;