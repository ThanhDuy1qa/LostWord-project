import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#0f0f12] text-white p-8">
      <h1 className="text-3xl font-bold text-center text-[#c09641] mb-12 uppercase tracking-widest font-serif">
        ❖ Menu Quản Trị Dữ Liệu ❖
      </h1>

      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Nút Dẫn Sang Form Thêm Story Card */}
        <Link 
          to="/add-storycard" 
          className="bg-[#1a1a20] border-2 border-gray-700 hover:border-[#c09641] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-[#c09641] hover:text-black shadow-lg"
        >
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🃏</span>
          <h2 className="text-xl font-bold font-serif">Thêm Story Card</h2>
          <p className="text-sm text-gray-400 group-hover:text-gray-800 mt-2">Nhập dữ liệu Story Card mới vào Database</p>
        </Link>

        {/* Nút Dẫn Sang Form Thêm Nhân Vật (Bạn có thể làm form này sau) */}
        <Link 
          to="/add-character" 
          className="bg-[#1a1a20] border-2 border-gray-700 hover:border-[#c09641] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-[#c09641] hover:text-black shadow-lg"
        >
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎎</span>
          <h2 className="text-xl font-bold font-serif">Thêm Nhân Vật</h2>
          <p className="text-sm text-gray-400 group-hover:text-gray-800 mt-2">Nhập dữ liệu Character mới vào Database</p>
        </Link>
        {}
        <Link 
          to="/manage-characters" /* Đổi link trỏ về trang danh sách quản lý */
          className="bg-[#1a1a20] border-2 border-gray-700 hover:border-[#419ec0] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-[#419ec0] hover:text-white shadow-lg"
        >
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛠️</span>
          <h2 className="text-xl font-bold font-serif">Sửa Nhân Vật</h2>
          <p className="text-sm text-gray-400 group-hover:text-gray-200 mt-2">Xem danh sách và cập nhật</p>
        </Link>
        {}
        <Link 
          to="/manage-storycards" /* Đổi link trỏ về trang danh sách quản lý */
          className="bg-[#1a1a20] border-2 border-gray-700 hover:border-[#419ec0] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group hover:bg-[#419ec0] hover:text-white shadow-lg"
        >
          <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛠️</span>
          <h2 className="text-xl font-bold font-serif">Sửa Story Card</h2>
          <p className="text-sm text-gray-400 group-hover:text-gray-200 mt-2">Xem danh sách và cập nhật</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;